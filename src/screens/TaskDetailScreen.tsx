import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isPast, addDays, parseISO } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useTaskContext } from '../contexts/TaskContext';
import { Task, Priority, Comment, RecurrenceType } from '../types';
import AnimatedButton from '../components/AnimatedButton';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import TimeTrackingButton from '../components/TimeTrackingButton';
import calendarService from '../services/calendarService';
import { formatDate } from '../utils/dateUtils';

type TaskDetailScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const TaskDetailScreen = () => {
  const route = useRoute<TaskDetailScreenRouteProp>();
  const navigation = useNavigation<TaskDetailScreenNavigationProp>();
  const { theme } = useTheme();
  const { getTaskById, updateTask, deleteTask, startTaskTimer, stopTaskTimer } = useTaskContext();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimeTracking, setIsTimeTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { taskId } = route.params;
  const task = getTaskById(taskId);

  // Helper function to safely handle dates
  const safeFormat = (date: Date | string | undefined, formatString: string): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, formatString);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    if (!task) return;
    
    // Calculate elapsed time from the active session if any
    if (task.timeTracking && task.timeTracking.sessions.length > 0) {
      const lastSession = task.timeTracking.sessions[task.timeTracking.sessions.length - 1];
      
      if (lastSession && !lastSession.endTime) {
        // There's an active tracking session
        setIsTimeTracking(true);
        
        // Calculate elapsed seconds
        const now = new Date();
        const elapsedMs = now.getTime() - lastSession.startTime.getTime();
        const seconds = Math.floor(elapsedMs / 1000);
        
        // Set initial value
        setElapsedSeconds(seconds);
      } else {
        // No active session, convert total minutes to seconds
        setElapsedSeconds((task.timeTracking.totalTimeSpent || 0) * 60);
      }
    }
  }, [task]);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Task not found
        </Text>
      </View>
    );
  }

  const handleEditTask = () => {
    navigation.navigate('EditTask', { taskId: task.id });
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(task.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleUpdateStatus = (newStatus: Task['status']) => {
    if (task.status === newStatus) return;
    
    const updatedTask = { ...task, status: newStatus, updatedAt: new Date() };
    updateTask(updatedTask);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    const newComment: Comment = {
      id: Date.now().toString(),
      text: comment.trim(),
      createdAt: new Date(),
      userId: 'current-user-id', // In a real app, get from auth
      userName: 'Me', // In a real app, get from auth
    };
    
    const updatedTask = {
      ...task,
      comments: [...(task.comments || []), newComment],
      updatedAt: new Date(),
    };
    
    await updateTask(updatedTask);
    setComment('');
    setIsSubmitting(false);
  };
  
  const handleStartTimeTracking = async () => {
    await startTaskTimer(task.id);
    setIsTimeTracking(true);
  };
  
  const handleStopTimeTracking = async () => {
    await stopTaskTimer(task.id);
    setIsTimeTracking(false);
  };
  
  const handleAddToCalendar = async () => {
    if (!task.deadline) {
      Alert.alert(
        'No Deadline Set',
        'Please set a deadline for this task before adding it to your calendar.'
      );
      return;
    }
    
    try {
      const eventId = await calendarService.addTaskToCalendar(task);
      
      if (eventId) {
        // Update task with the calendar event ID
        const updatedTask = {
          ...task,
          calendarEventId: eventId,
          updatedAt: new Date(),
        };
        
        await updateTask(updatedTask);
        
        Alert.alert(
          'Success',
          'Task added to your calendar successfully!'
        );
      } else {
        Alert.alert(
          'Calendar Error',
          'Failed to add task to calendar. Please check calendar permissions.'
        );
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(
        'Error',
        'An error occurred while adding the task to your calendar.'
      );
    }
  };
  
  const handleViewInCalendar = async () => {
    if (!task.calendarEventId) return;
    
    // Open calendar app
    try {
      const today = new Date();
      const dateString = task.deadline ? 
        format(task.deadline, 'yyyy-MM-dd') : 
        format(today, 'yyyy-MM-dd');
      
      if (Platform.OS === 'ios') {
        Linking.openURL(`calshow:${task.deadline?.getTime() || today.getTime()}`);
      } else {
        // Android - this will just open the calendar app
        Linking.openURL(`content://com.android.calendar/time/${dateString}`);
      }
    } catch (error) {
      console.error('Error opening calendar:', error);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return theme.colors.priority.high;
      case Priority.MEDIUM:
        return theme.colors.priority.medium;
      default:
        return theme.colors.priority.low;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in-progress':
        return theme.colors.warning;
      default:
        return theme.colors.text;
    }
  };
  
  const getRecurrenceText = () => {
    if (!task.recurrence) return null;
    
    const { type, interval } = task.recurrence;
    if (type === RecurrenceType.NONE) return null;
    
    const intervalText = interval > 1 ? `${interval} ${type}s` : type;
    return `Repeats every ${intervalText}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Task Header */}
        <Animated.View 
          entering={FadeIn.delay(100)}
          style={[styles.card, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.taskHeader}>
            <View style={styles.titleRow}>
              <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
                {task.title}
              </Text>
              <TouchableOpacity onPress={handleEditTask}>
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsRow}>
              <View
                style={[
                  styles.tagContainer,
                  { backgroundColor: getPriorityColor(task.priority) },
                ]}
              >
                <Text style={styles.tagText}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
              {task.tags &&
                task.tags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.tagContainer,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
            </View>
          </View>

          {task.description && (
            <Text style={[styles.description, { color: theme.colors.text }]}>
              {task.description}
            </Text>
          )}
          
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.text} />
              <Text style={[styles.metaText, { color: theme.colors.text }]}>
                Created: {safeFormat(task.createdAt, 'MMM d, yyyy')}
              </Text>
            </View>
            
            {task.deadline && (
              <View style={styles.metaRow}>
                <Ionicons 
                  name="alarm-outline" 
                  size={16} 
                  color={isPast(task.deadline) && task.status !== 'completed' 
                    ? theme.colors.error 
                    : theme.colors.primary} 
                />
                <Text 
                  style={[
                    styles.metaText, 
                    { 
                      color: isPast(task.deadline) && task.status !== 'completed' 
                        ? theme.colors.error 
                        : theme.colors.primary,
                      fontWeight: '600' 
                    }
                  ]}
                >
                  Due: {safeFormat(task.deadline, 'MMM d, yyyy')}
                  {isToday(task.deadline) ? " (Today)" : ""}
                  {isPast(task.deadline) && task.status !== 'completed' ? " (Overdue)" : ""}
                </Text>
              </View>
            )}
            
            {task.startTime && (
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={theme.colors.text} />
                <Text style={[styles.metaText, { color: theme.colors.text }]}>
                  Scheduled: {safeFormat(task.startTime, 'MMM d, h:mm a')}
                  {task.duration ? ` (${task.duration} min)` : ''}
                </Text>
              </View>
            )}
            
            {getRecurrenceText() && (
              <View style={styles.metaRow}>
                <Ionicons name="repeat-outline" size={16} color={theme.colors.text} />
                <Text style={[styles.metaText, { color: theme.colors.text }]}>
                  {getRecurrenceText()}
                </Text>
              </View>
            )}
          </View>
          
          {/* Calendar Integration */}
          {task.deadline && (
            <View style={styles.calendarContainer}>
              {!task.calendarEventId ? (
                <TouchableOpacity
                  style={[
                    styles.calendarButton,
                    { borderColor: theme.colors.primary }
                  ]}
                  onPress={handleAddToCalendar}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.calendarButtonText, { color: theme.colors.primary }]}>
                    Add to Calendar
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.calendarButton,
                    { borderColor: theme.colors.success }
                  ]}
                  onPress={handleViewInCalendar}
                >
                  <Ionicons name="calendar" size={18} color={theme.colors.success} />
                  <Text style={[styles.calendarButtonText, { color: theme.colors.success }]}>
                    View in Calendar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>

        {/* Time Tracking */}
        <Animated.View 
          entering={FadeIn.delay(150)} 
          style={[styles.card, { backgroundColor: theme.colors.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Time Tracking
          </Text>
          
          <View style={styles.timeTrackingContainer}>
            <TimeTrackingButton
              isActive={isTimeTracking}
              onStartTracking={handleStartTimeTracking}
              onStopTracking={handleStopTimeTracking}
              elapsedTime={elapsedSeconds}
            />
            
            {task.timeTracking && task.timeTracking.totalTimeSpent > 0 && (
              <Text style={[styles.totalTimeText, { color: theme.colors.text }]}>
                Total time spent: {task.timeTracking.totalTimeSpent} minutes
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Status Section */}
        <Animated.View 
          entering={FadeIn.delay(200)}
          style={[styles.card, { backgroundColor: theme.colors.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Status
          </Text>
          
          <View style={styles.statusButtonsContainer}>
            {['todo', 'in-progress', 'completed'].map((status) => {
              const isActive = task.status === status;
              const statusTitle = status === 'in-progress' 
                ? 'In Progress' 
                : status.charAt(0).toUpperCase() + status.slice(1);
                
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: isActive 
                        ? getStatusColor(status as Task['status']) 
                        : 'transparent',
                      borderColor: getStatusColor(status as Task['status']),
                    },
                  ]}
                  onPress={() => handleUpdateStatus(status as Task['status'])}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: isActive ? '#fff' : getStatusColor(status as Task['status']) },
                    ]}
                  >
                    {statusTitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Assigned Users */}
        {task.assignedTo && task.assignedTo.length > 0 && (
          <Animated.View 
            entering={FadeIn.delay(300)}
            style={[styles.card, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Assigned To
            </Text>
            
            {task.assignedTo.map((user) => (
              <View key={user.id} style={styles.userRow}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.name.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {user.name}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Comments Section */}
        <Animated.View 
          entering={FadeIn.delay(400)}
          style={[styles.card, { backgroundColor: theme.colors.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Comments
          </Text>
          
          {task.comments && task.comments.length > 0 ? (
            task.comments.map((comment) => {
              // Ensure the date is a proper Date object before formatting
              const commentDate = typeof comment.createdAt === 'string' 
                ? parseISO(comment.createdAt) 
                : comment.createdAt;
                
              return (
                <View 
                  key={comment.id} 
                  style={[
                    styles.commentContainer, 
                    { backgroundColor: theme.isDark ? '#3c3c3e' : '#f5f5f5' }
                  ]}
                >
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUser, { color: theme.colors.text }]}>
                      {comment.userName}
                    </Text>
                    <Text style={[styles.commentDate, { color: theme.colors.text }]}>
                      {safeFormat(commentDate, 'MMM d, h:mm a')}
                    </Text>
                  </View>
                  <Text style={[styles.commentText, { color: theme.colors.text }]}>
                    {comment.text}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={[styles.noComments, { color: theme.colors.text }]}>
              No comments yet
            </Text>
          )}
          
          <View style={styles.addCommentContainer}>
            <TextInput
              placeholder="Add a comment..."
              placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
              value={comment}
              onChangeText={setComment}
              multiline
              style={[
                styles.commentInput,
                {
                  backgroundColor: theme.isDark ? '#3c3c3e' : '#f5f5f5',
                  color: theme.colors.text,
                },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: theme.colors.primary },
                !comment.trim() && { opacity: 0.6 },
              ]}
              onPress={handleAddComment}
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AnimatedButton
            title="Edit Task"
            onPress={handleEditTask}
            variant="primary"
            icon={<Ionicons name="create-outline" size={20} color="#fff" />}
            style={styles.editButton}
          />
          
          <AnimatedButton
            title="Delete Task"
            onPress={handleDeleteTask}
            variant="danger"
            icon={<Ionicons name="trash-outline" size={20} color="#fff" />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  taskHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  metaContainer: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
  },
  commentContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentUser: {
    fontWeight: 'bold',
  },
  commentDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 8,
    marginBottom: 24,
  },
  editButton: {
    marginBottom: 12,
  },
  errorText: {
    margin: 32,
    fontSize: 18,
    textAlign: 'center',
  },
  timeTrackingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  totalTimeText: {
    marginTop: 10,
    fontSize: 14,
    fontStyle: 'italic',
  },
  calendarContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 20,
  },
  calendarButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TaskDetailScreen;
