// User types
export interface User {
  id: string;
  name: string;
  email?: string;
}

// Task-related enums
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Time tracking interfaces
export interface TimeTrackingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
}

export interface TimeTracking {
  sessions: TimeTrackingSession[];
  totalTimeSpent: number; // in minutes
}

// Task recurrence interface
export interface TaskRecurrence {
  type: RecurrenceType;
  interval: number; // How many days/weeks/months between occurrences
  endDate?: Date;
  count?: number; // How many occurrences
}

// Comment interface
export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  userName: string;
}

// Main Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  deadline?: Date;
  startTime?: Date;
  duration?: number; // in minutes
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: User[];
  comments?: Comment[];
  subtasks?: Task[];
  timeTracking?: TimeTracking;
  recurrence?: TaskRecurrence;
  calendarEventId?: string;
  notificationIds?: string[];
  completedAt?: Date;
}

export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    error: string;
    success: string;
    warning: string;
    priority: {
      low: string;
      medium: string;
      high: string;
    };
  };
}
