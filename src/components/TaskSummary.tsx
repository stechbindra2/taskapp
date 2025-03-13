import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay, isPast, isToday, isYesterday, addDays, isTomorrow } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { Task, Priority, TaskStatus } from '../types';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface TaskSummaryProps {
  task: Task;
  index: number;
  onPress: (task: Task) => void;
  compact?: boolean;
}

const TaskSummary = ({ task, index, onPress, compact = false }: TaskSummaryProps) => {
  const { theme } = useTheme();
  
  const getPriorityColor = () => {
    switch (task.priority) {
      case Priority.HIGH:
        return theme.colors.priority.high;
      case Priority.MEDIUM:
        return theme.colors.priority.medium;
      default:
        return theme.colors.priority.low;
    }
  };
  
  const getStatusIcon = () => {
    switch (task.status) {
      case TaskStatus.COMPLETED:
        return <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />;
      case TaskStatus.IN_PROGRESS:
        return <Ionicons name="time" size={18} color={theme.colors.warning} />;
      default:
        return <Ionicons name="ellipse-outline" size={18} color={theme.colors.text} />;
    }
  };
  
  const getFormattedDate = () => {
    if (!task.deadline) return null;
    
    if (isToday(task.deadline)) {
      return 'Today';
    } else if (isTomorrow(task.deadline)) {
      return 'Tomorrow';
    } else if (isYesterday(task.deadline)) {
      return 'Yesterday';
    } else {
      return format(task.deadline, 'MMM d');
    }
  };
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[
        styles.container,
        { backgroundColor: theme.colors.card },
        compact && styles.compactContainer
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={() => onPress(task)}
        activeOpacity={0.7}
      >
        {/* Status indicator */}
        <View style={styles.statusContainer}>{getStatusIcon()}</View>
        
        {/* Task info */}
        <View style={styles.infoContainer}>
          <Text 
            style={[
              styles.title, 
              { color: theme.colors.text },
              task.status === TaskStatus.COMPLETED && styles.completedText
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          
          {!compact && task.description && (
            <Text 
              style={[
                styles.description, 
                { color: theme.colors.text },
                task.status === TaskStatus.COMPLETED && styles.completedText
              ]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          )}
          
          {/* Meta Row */}
          <View style={styles.metaRow}>
            {task.deadline && (
              <View style={styles.deadlineContainer}>
                <Ionicons 
                  name="calendar-outline" 
                  size={12} 
                  color={(isPast(task.deadline) && task.status !== TaskStatus.COMPLETED) ? 
                    theme.colors.error : theme.colors.text} 
                />
                <Text 
                  style={[
                    styles.deadlineText, 
                    { 
                      color: (isPast(task.deadline) && task.status !== TaskStatus.COMPLETED) ? 
                        theme.colors.error : theme.colors.text,
                      fontWeight: isToday(task.deadline) ? 'bold' : 'normal'
                    }
                  ]}
                >
                  {getFormattedDate()}
                </Text>
              </View>
            )}
            
            {/* Tags */}
            {!compact && task.tags && task.tags.length > 0 && (
              <View style={styles.tagRow}>
                {task.tags.slice(0, 1).map(tag => (
                  <View 
                    key={tag} 
                    style={[styles.tag, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.tagText}>
                      {tag}
                    </Text>
                  </View>
                ))}
                {task.tags.length > 1 && (
                  <Text style={[styles.moreText, { color: theme.colors.text }]}>
                    +{task.tags.length - 1}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
        
        {/* Priority indicator */}
        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor() }
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  compactContainer: {
    marginBottom: 4,
    marginHorizontal: 2,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  statusContainer: {
    marginRight: 10,
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  deadlineText: {
    fontSize: 11,
    marginLeft: 3,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 9,
  },
  moreText: {
    fontSize: 10,
    opacity: 0.7,
  },
  priorityIndicator: {
    width: 5,
    borderRadius: 2.5,
    alignSelf: 'stretch',
    marginLeft: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
});

export default TaskSummary;
