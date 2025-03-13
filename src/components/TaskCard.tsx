import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { Task, Priority } from '../types';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

type TaskCardProps = {
  task: Task;
  onPress: (task: Task) => void;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const { theme } = useTheme();
  
  const getPriorityColor = (priority: Priority) => {
    switch(priority) {
      case Priority.HIGH:
        return theme.colors.priority.high;
      case Priority.MEDIUM:
        return theme.colors.priority.medium;
      default:
        return theme.colors.priority.low;
    }
  };

  const getStatusIcon = () => {
    switch(task.status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />;
      case 'in-progress':
        return <Ionicons name="time" size={24} color={theme.colors.warning} />;
      default:
        return <Ionicons name="ellipse-outline" size={24} color={theme.colors.text} />;
    }
  };

  return (
    <Animated.View 
      entering={FadeInRight} 
      exiting={FadeOutLeft}
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border 
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.content} 
        onPress={() => onPress(task)}
        activeOpacity={0.7}
      >
        <View style={styles.statusContainer}>
          {getStatusIcon()}
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {task.title}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
              <Text style={styles.priorityText}>
                {task.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {task.description && (
            <Text 
              style={[styles.description, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}
          
          <View style={styles.footer}>
            {task.deadline && (
              <View style={styles.deadlineContainer}>
                <Ionicons name="calendar" size={14} color={theme.colors.primary} />
                <Text style={[styles.deadlineText, { color: theme.colors.text }]}>
                  {format(task.deadline, 'MMM dd, yyyy')}
                </Text>
              </View>
            )}
            
            {task.assignedTo && task.assignedTo.length > 0 && (
              <View style={styles.assignedContainer}>
                <Ionicons name="people" size={14} color={theme.colors.primary} />
                <Text style={[styles.assignedText, { color: theme.colors.text }]}>
                  {task.assignedTo.length} assigned
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  statusContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  deadlineText: {
    fontSize: 12,
    marginLeft: 4,
  },
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default TaskCard;
