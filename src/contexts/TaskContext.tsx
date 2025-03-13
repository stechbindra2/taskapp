import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Task, Priority, TaskStatus, RecurrenceType } from '../types';
import * as FileSystem from 'expo-file-system';
import calendarService from '../services/calendarService';
import notificationService from '../services/notificationService';

// Actions
type Action =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_TASKS'; payload: Task[] };

// Context type
type TaskContextType = {
  tasks: Task[];
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: Priority) => Task[];
  getTasksByDateRange: (startDate: Date, endDate: Date) => Task[];
  startTaskTimer: (taskId: string) => Promise<void>;
  stopTaskTimer: (taskId: string) => Promise<void>;
};

// Reducer function
const taskReducer = (state: Task[], action: Action): Task[] => {
  switch (action.type) {
    case 'ADD_TASK':
      return [...state, action.payload];
    case 'UPDATE_TASK':
      return state.map(task => 
        task.id === action.payload.id ? action.payload : task
      );
    case 'DELETE_TASK':
      return state.filter(task => task.id !== action.payload);
    case 'SET_TASKS':
      return action.payload;
    default:
      return state;
  }
};

// Storage path
const TASKS_STORAGE_PATH = `${FileSystem.documentDirectory}tasks.json`;

// Create context
const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, dispatch] = useReducer(taskReducer, []);

  // Load tasks from storage on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(TASKS_STORAGE_PATH);
        
        if (fileInfo.exists) {
          const fileContent = await FileSystem.readAsStringAsync(TASKS_STORAGE_PATH);
          const loadedTasks = JSON.parse(fileContent);
          
          // Convert string dates back to Date objects
          const formattedTasks = loadedTasks.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            deadline: task.deadline ? new Date(task.deadline) : undefined,
            startTime: task.startTime ? new Date(task.startTime) : undefined,
            recurrence: task.recurrence ? {
              ...task.recurrence,
              endDate: task.recurrence.endDate ? new Date(task.recurrence.endDate) : undefined
            } : undefined,
            timeTracking: task.timeTracking ? {
              ...task.timeTracking,
              sessions: task.timeTracking.sessions.map((session: any) => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : undefined
              }))
            } : undefined,
          }));
          
          dispatch({ type: 'SET_TASKS', payload: formattedTasks });
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    
    loadTasks();
  }, []);

  // Save tasks to storage whenever they change
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await FileSystem.writeAsStringAsync(
          TASKS_STORAGE_PATH,
          JSON.stringify(tasks)
        );
      } catch (error) {
        console.error('Error saving tasks:', error);
      }
    };
    
    if (tasks.length > 0) {
      saveTasks();
    }
  }, [tasks]);

  const addTask = async (task: Task) => {
    try {
      // Create recurring tasks if needed
      if (task.recurrence && task.recurrence.type !== RecurrenceType.NONE) {
        // Handle task recurrence in a separate function
      }

      // Add to device calendar if there's a deadline
      if (task.deadline) {
        const eventId = await calendarService.addTaskToCalendar(task);
        if (eventId) {
          task.calendarEventId = eventId;
        }
        
        // Schedule notifications
        const notificationIds = await notificationService.scheduleTaskReminder(task);
        if (notificationIds.length > 0) {
          task.notificationIds = notificationIds;
        }
      }

      dispatch({ type: 'ADD_TASK', payload: task });
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const oldTask = getTaskById(task.id);
      
      // Update calendar event if deadline changed
      if (oldTask && task.deadline !== oldTask.deadline) {
        // Cancel old notifications if they exist
        if (oldTask.notificationIds && oldTask.notificationIds.length > 0) {
          await notificationService.cancelTaskReminders(oldTask.notificationIds);
        }
        
        // Schedule new notifications
        if (task.deadline) {
          const notificationIds = await notificationService.scheduleTaskReminder(task);
          if (notificationIds.length > 0) {
            task.notificationIds = notificationIds;
          }
        }

        // Update or add calendar event
        if (task.deadline) {
          if (oldTask.calendarEventId) {
            await calendarService.updateTaskInCalendar(task, oldTask.calendarEventId);
            task.calendarEventId = oldTask.calendarEventId;
          } else {
            const eventId = await calendarService.addTaskToCalendar(task);
            if (eventId) {
              task.calendarEventId = eventId;
            }
          }
        } else if (oldTask.calendarEventId) {
          // Remove calendar event if deadline was removed
          await calendarService.removeTaskFromCalendar(oldTask.calendarEventId);
          task.calendarEventId = undefined;
        }
      }

      dispatch({ type: 'UPDATE_TASK', payload: task });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const taskToDelete = getTaskById(id);
      if (taskToDelete) {
        // Cancel notifications
        if (taskToDelete.notificationIds && taskToDelete.notificationIds.length > 0) {
          await notificationService.cancelTaskReminders(taskToDelete.notificationIds);
        }
        
        // Remove from calendar
        if (taskToDelete.calendarEventId) {
          await calendarService.removeTaskFromCalendar(taskToDelete.calendarEventId);
        }
      }
      
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const startTaskTimer = async (taskId: string) => {
    const task = getTaskById(taskId);
    if (!task) return;
    
    const now = new Date();
    const newSession = {
      startTime: now,
    };
    
    const timeTracking = task.timeTracking || {
      totalTimeSpent: 0,
      sessions: [],
    };
    
    const updatedTask = {
      ...task,
      timeTracking: {
        ...timeTracking,
        sessions: [...timeTracking.sessions, newSession],
      },
    };
    
    await updateTask(updatedTask);
  };
  
  const stopTaskTimer = async (taskId: string) => {
    const task = getTaskById(taskId);
    if (!task || !task.timeTracking) return;
    
    const { sessions, totalTimeSpent } = task.timeTracking;
    const lastSession = sessions[sessions.length - 1];
    
    if (!lastSession || lastSession.endTime) return;
    
    const now = new Date();
    const duration = Math.round((now.getTime() - lastSession.startTime.getTime()) / 60000); // minutes
    
    const updatedSessions = [...sessions];
    updatedSessions[sessions.length - 1] = {
      ...lastSession,
      endTime: now,
      duration,
    };
    
    const updatedTask = {
      ...task,
      timeTracking: {
        totalTimeSpent: totalTimeSpent + duration,
        sessions: updatedSessions,
      },
    };
    
    await updateTask(updatedTask);
  };

  const getTaskById = (id: string) => {
    return tasks.find(task => task.id === id);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getTasksByPriority = (priority: Priority) => {
    return tasks.filter(task => task.priority === priority);
  };

  const getTasksByDateRange = (startDate: Date, endDate: Date) => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return taskDate >= startDate && taskDate <= endDate;
    });
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      updateTask,
      deleteTask,
      getTaskById,
      getTasksByStatus,
      getTasksByPriority,
      getTasksByDateRange,
      startTaskTimer,
      stopTaskTimer
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
