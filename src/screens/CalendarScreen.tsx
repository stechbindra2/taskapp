import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SectionList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useTaskContext } from '../contexts/TaskContext';
import { format, isToday, isSameDay, addDays, startOfDay, endOfDay, parseISO, isSameMonth, addHours, addMinutes } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import TaskCard from '../components/TaskCard';
import AnimatedButton from '../components/AnimatedButton';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Task } from '../types';

type CalendarScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const WeekDayButton = ({ 
  date, 
  isActive, 
  onPress,
  theme
}: {
  date: Date;
  isActive: boolean;
  onPress: () => void;
  theme: any;
}) => {
  const dayName = format(date, 'E');
  const dayNumber = format(date, 'd');
  const isCurrentDay = isToday(date);
  
  return (
    <TouchableOpacity
      style={[
        styles.dayButton,
        isActive && { 
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        !isActive && {
          backgroundColor: theme.colors.card,
          borderColor: isCurrentDay ? theme.colors.primary : theme.colors.border,
        }
      ]}
      onPress={onPress}
    >
      <Text 
        style={[
          styles.dayName, 
          { color: isActive ? '#fff' : theme.colors.text }
        ]}
      >
        {dayName}
      </Text>
      <Text 
        style={[
          styles.dayNumber, 
          { 
            color: isActive ? '#fff' : isCurrentDay ? theme.colors.primary : theme.colors.text,
            fontWeight: isCurrentDay ? 'bold' : 'normal',
          }
        ]}
      >
        {dayNumber}
      </Text>
      {isCurrentDay && !isActive && (
        <View 
          style={[
            styles.todayDot, 
            { backgroundColor: theme.colors.primary }
          ]} 
        />
      )}
    </TouchableOpacity>
  );
};

interface TimeBlock {
  hour: number;
  tasks: Task[];
}

const CalendarScreen = () => {
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const { theme } = useTheme();
  const { tasks } = useTaskContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'schedule'>('day');
  
  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      // Reset to today when screen is focused
      setSelectedDate(new Date());
      setWeekOffset(0);
    }, [])
  );

  // Get tasks for selected date
  const dailyTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    return isSameDay(task.deadline, selectedDate);
  });

  // Get next 7 days starting from today + weekOffset
  const weekDays = Array(7).fill(0).map((_, i) => {
    const baseDate = new Date();
    return addDays(baseDate, i + (weekOffset * 7));
  });

  const navigateToPreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const navigateToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const handleCreateTask = () => {
    navigation.navigate('CreateTask');
  };

  // Reset to current week
  const goToToday = () => {
    setSelectedDate(new Date());
    setWeekOffset(0);
  };

  // Time blocks for schedule view
  const timeBlocks = useMemo(() => {
    // Create time blocks for the day
    const blocks: TimeBlock[] = [];
    
    // Business hours (8 AM to 8 PM)
    for (let hour = 8; hour < 20; hour++) {
      blocks.push({
        hour,
        tasks: tasks.filter(task => {
          if (!task.startTime) return false;
          const taskHour = task.startTime.getHours();
          return isSameDay(task.startTime, selectedDate) && taskHour === hour;
        })
      });
    }
    
    return blocks;
  }, [tasks, selectedDate]);

  const renderScheduleView = () => {
    return (
      <View style={styles.scheduleContainer}>
        {timeBlocks.map((block) => (
          <View key={block.hour} style={styles.timeBlock}>
            <View style={styles.timeColumn}>
              <Text style={[styles.timeText, { color: theme.colors.text }]}>
                {format(new Date().setHours(block.hour, 0, 0, 0), 'h a')}
              </Text>
            </View>
            
            <View style={[styles.taskColumn, { borderLeftColor: theme.colors.border }]}>
              {block.tasks.length > 0 ? (
                block.tasks.map(task => {
                  // Calculate height based on duration
                  const durationInMinutes = task.duration || 60;
                  const heightPerMinute = 80 / 60; // 80 points height per hour
                  const blockHeight = Math.max(40, durationInMinutes * heightPerMinute);
                  
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={[
                        styles.scheduleTask,
                        { 
                          backgroundColor: theme.colors.primary,
                          height: blockHeight 
                        }
                      ]}
                      onPress={() => handleTaskPress(task.id)}
                    >
                      <Text style={styles.scheduleTaskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      {task.startTime && (
                        <Text style={styles.scheduleTaskTime}>
                          {format(task.startTime, 'h:mm a')}
                          {task.duration && ` (${task.duration} min)`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <TouchableOpacity
                  style={[
                    styles.emptyTimeBlock,
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(block.hour, 0, 0, 0);
                    navigation.navigate('CreateTask', { startTime: newDate } as any);
                  }}
                >
                  <Ionicons 
                    name="add" 
                    size={20} 
                    color={theme.colors.text} 
                    style={{ opacity: 0.3 }} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Calendar Header */}
      <Animated.View 
        entering={FadeIn.delay(100)}
        style={styles.calendarHeader}
      >
        <TouchableOpacity onPress={navigateToPreviousWeek}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.monthText, { color: theme.colors.text }]}>
          {weekOffset === 0 ? 'This Week' : format(weekDays[0], 'MMMM yyyy')}
        </Text>
        
        <TouchableOpacity onPress={navigateToNextWeek}>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* View Mode Selector */}
      <Animated.View 
        entering={FadeIn.delay(150)}
        style={[styles.viewModeSelector, { backgroundColor: theme.colors.card }]}
      >
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'day' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setViewMode('day')}
        >
          <Text style={{ 
            color: viewMode === 'day' ? '#fff' : theme.colors.text
          }}>
            Day
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'week' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setViewMode('week')}
        >
          <Text style={{ 
            color: viewMode === 'week' ? '#fff' : theme.colors.text
          }}>
            Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'schedule' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setViewMode('schedule')}
        >
          <Text style={{ 
            color: viewMode === 'schedule' ? '#fff' : theme.colors.text
          }}>
            Schedule
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Week Days */}
      <Animated.View 
        entering={FadeIn.delay(200)}
        style={styles.weekDaysContainer}
      >
        {weekDays.map((day, index) => (
          <WeekDayButton
            key={index}
            date={day}
            isActive={isSameDay(day, selectedDate)}
            onPress={() => setSelectedDate(day)}
            theme={theme}
          />
        ))}
      </Animated.View>

      {weekOffset !== 0 && (
        <TouchableOpacity 
          onPress={goToToday}
          style={[styles.todayButton, { borderColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.primary }}>Today</Text>
        </TouchableOpacity>
      )}

      {/* Selected Day and Tasks */}
      <Animated.View 
        entering={FadeIn.delay(300)}
        style={styles.selectedDayContainer}
      >
        <View style={styles.selectedDayHeader}>
          <Text style={[styles.selectedDayText, { color: theme.colors.text }]}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <TouchableOpacity 
            onPress={handleCreateTask}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {viewMode === 'day' && (
          dailyTasks.length > 0 ? (
            <FlatList
              data={dailyTasks}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TaskCard
                  task={item}
                  onPress={() => handleTaskPress(item.id)}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.tasksList}
            />
          ) : (
            <View style={[styles.emptyContainer, { borderColor: theme.colors.border }]}>
              <Ionicons name="calendar-outline" size={40} color={theme.colors.text} opacity={0.5} />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No tasks scheduled for this day
              </Text>
              <AnimatedButton
                title="Add a Task"
                onPress={handleCreateTask}
                style={styles.emptyButton}
                variant="outline"
              />
            </View>
          )
        )}
        
        {viewMode === 'week' && (
          <View style={styles.weekViewContainer}>
            {/* Week view implementation */}
          </View>
        )}
        
        {viewMode === 'schedule' && renderScheduleView()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  selectedDayContainer: {
    flex: 1,
    paddingTop: 16,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  selectedDayText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksList: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 32,
    marginBottom: 32,
    padding: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  viewModeSelector: {
    flexDirection: 'row',
    borderRadius: 20,
    alignSelf: 'center',
    padding: 4,
    marginVertical: 8,
  },
  viewModeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  scheduleContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  timeBlock: {
    flexDirection: 'row',
    height: 80, // 1 hour = 80 points height
  },
  timeColumn: {
    width: 50,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskColumn: {
    flex: 1,
    borderLeftWidth: 1,
    paddingLeft: 8,
  },
  scheduleTask: {
    borderRadius: 6,
    padding: 8,
    margin: 2,
  },
  scheduleTaskTitle: {
    color: '#fff',
    fontWeight: '500',
  },
  scheduleTaskTime: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  emptyTimeBlock: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    margin: 2,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekViewContainer: {
    flex: 1,
  },
});

export default CalendarScreen;
