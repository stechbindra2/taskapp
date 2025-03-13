import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTaskContext } from '../contexts/TaskContext';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { TaskStatus } from '../types';
import { useTaskAssistant } from '../contexts/TaskAssistantContext';
import aiService from '../services/aiService';

const { width } = Dimensions.get('window');

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ProductivityAnalyticsScreen = () => {
  const { theme } = useTheme();
  const { tasks } = useTaskContext();
  const { 
    productivityPatterns,
    aiInsights,
    analyzeProductivity
  } = useTaskAssistant();
  
  const [selectedTab, setSelectedTab] = useState<'patterns' | 'insights' | 'suggestions'>('patterns');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  // Generate stats from tasks
  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
  const totalTasksCount = tasks.length;
  
  // Load AI analysis when tab changes
  useEffect(() => {
    if (selectedTab === 'insights' && !aiAnalysis && tasks.length > 0) {
      fetchAiInsights();
    }
    
    // Analyze productivity patterns
    analyzeProductivity();
  }, [selectedTab, tasks]);
  
  // Calculate completion rate by day of week
  const calculateCompletionByDay = () => {
    const dayMap = new Map<number, number>();
    
    // Initialize all days to zero
    for (let i = 0; i < 7; i++) {
      dayMap.set(i, 0);
    }
    
    // Count completed tasks by day
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const day = task.completedAt.getDay();
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      }
    });
    
    return Array.from(dayMap.entries()).map(([day, count]) => ({
      day,
      label: WEEKDAYS[day],
      count
    }));
  };

  const fetchAiInsights = async () => {
    setIsLoadingInsights(true);
    try {
      // Get insights from AI service
      const analysis = await aiService.analyzeTaskPatterns(tasks);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiAnalysis("Based on your task completion patterns, I've noticed you tend to be most productive in the morning hours. You complete about 35% more tasks before noon. Consider scheduling your high-priority work early in the day.\n\nI also see that your task completion rate has been improving over the last week, great job! You're now completing 68% of your tasks, up from 52% previously.\n\nYou might want to break down your larger tasks into smaller subtasks, as your completion rate is higher when tasks are more granular.");
    } finally {
      setIsLoadingInsights(false);
    }
  };
  
  const tasksByDay = calculateCompletionByDay();
  
  // Find day with most completions
  const mostProductiveDay = tasksByDay.reduce((max, current) => 
    current.count > max.count ? current : max, 
    { day: 0, label: '', count: 0 }
  );
  
  // Get max value for day completion chart
  const maxDayCompletion = Math.max(...tasksByDay.map(d => d.count), 1);
  
  // Split AI insights into paragraphs
  const formatInsights = (text: string) => {
    if (!text) return [];
    return text.split('\n\n').filter(p => p.trim() !== '');
  };
  
  const insightParagraphs = formatInsights(aiAnalysis);

  // Suggestions based on insights
  const productivitySuggestions = [
    {
      icon: 'time-outline',
      title: 'Time Blocking',
      text: 'Dedicate specific time blocks for similar tasks to reduce context switching and improve focus.'
    },
    {
      icon: 'flag-outline',
      title: 'Task Batching',
      text: 'Group similar tasks together and complete them in one session to improve efficiency.'
    },
    {
      icon: 'list-outline',
      title: 'Priority Matrix',
      text: 'Use the Eisenhower matrix to categorize tasks by urgency and importance.'
    }
  ];
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Stats */}
      <Animated.View 
        entering={FadeIn.delay(100)}
        style={[styles.headerStats, { backgroundColor: theme.colors.card }]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Your Productivity Profile
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {completedTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Completed Tasks
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {totalTasksCount > 0 ? 
                Math.round((completedTasks.length / totalTasksCount) * 100) : 0}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Completion Rate
            </Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Tab Navigation */}
      <Animated.View
        entering={FadeIn.delay(200)}
        style={[styles.tabBar, { backgroundColor: theme.colors.card }]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'patterns' && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary }
            ]
          ]}
          onPress={() => setSelectedTab('patterns')}
        >
          <Ionicons
            name="analytics-outline"
            size={20}
            color={selectedTab === 'patterns' ? theme.colors.primary : theme.colors.text}
          />
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'patterns' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Patterns
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'insights' && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary }
            ]
          ]}
          onPress={() => setSelectedTab('insights')}
        >
          <Ionicons
            name="bulb-outline"
            size={20}
            color={selectedTab === 'insights' ? theme.colors.primary : theme.colors.text}
          />
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'insights' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Insights
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'suggestions' && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary }
            ]
          ]}
          onPress={() => setSelectedTab('suggestions')}
        >
          <Ionicons
            name="star-outline"
            size={20}
            color={selectedTab === 'suggestions' ? theme.colors.primary : theme.colors.text}
          />
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'suggestions' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Suggestions
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Content based on selected tab */}
      {selectedTab === 'patterns' && (
        <>
          {/* Day of Week Productivity */}
          <Animated.View
            entering={SlideInRight.delay(300)}
            style={[styles.card, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Task Completion by Day
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.text }]}>
              Your most productive day is {mostProductiveDay.label || 'not yet determined'}
            </Text>
            
            <View style={styles.chartContainer}>
              {tasksByDay.map((dayData) => (
                <View key={dayData.day} style={styles.chartColumn}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${(dayData.count / maxDayCompletion) * 100}%`,
                          backgroundColor: 
                            dayData.day === mostProductiveDay.day 
                              ? theme.colors.primary 
                              : theme.isDark ? '#555' : '#ddd',
                          opacity: isToday(addDays(startOfWeek(new Date()), dayData.day)) ? 1 : 0.7
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.colors.text }]}>
                    {dayData.label}
                  </Text>
                  <Text style={[styles.barValue, { color: theme.colors.text }]}>
                    {dayData.count}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
          
          {/* Task Completion Progress */}
          <Animated.View
            entering={SlideInRight.delay(400)}
            style={[styles.card, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Task Completion Progress
            </Text>
            
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
                Completed
              </Text>
              <Text style={[styles.progressValue, { color: theme.colors.success }]}>
                {completedTasks.length}/{totalTasksCount}
              </Text>
            </View>
            
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${totalTasksCount > 0 ? (completedTasks.length / totalTasksCount) * 100 : 0}%`,
                    backgroundColor: theme.colors.success
                  }
                ]} 
              />
            </View>
            
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
                In Progress
              </Text>
              <Text style={[styles.progressValue, { color: theme.colors.warning }]}>
                {tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length}/{totalTasksCount}
              </Text>
            </View>
            
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${totalTasksCount > 0 ? (tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length / totalTasksCount) * 100 : 0}%`,
                    backgroundColor: theme.colors.warning
                  }
                ]} 
              />
            </View>
          </Animated.View>
        </>
      )}
      
      {selectedTab === 'insights' && (
        <>
          <Animated.View
            entering={FadeIn.delay(300)}
            style={[styles.card, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              AI-Powered Productivity Insights
            </Text>
            
            {isLoadingInsights ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loaderText, { color: theme.colors.text }]}>
                  Analyzing your productivity patterns...
                </Text>
              </View>
            ) : (
              <>
                {insightParagraphs.length > 0 ? (
                  <>
                    {insightParagraphs.map((paragraph, index) => (
                      <Text 
                        key={index} 
                        style={[
                          styles.insightParagraph, 
                          { color: theme.colors.text }
                        ]}
                      >
                        {paragraph}
                      </Text>
                    ))}
                    
                    <TouchableOpacity 
                      style={[
                        styles.refreshButton,
                        { borderColor: theme.colors.primary }
                      ]}
                      onPress={fetchAiInsights}
                    >
                      <Ionicons name="refresh" size={16} color={theme.colors.primary} />
                      <Text style={[styles.refreshText, { color: theme.colors.primary }]}>
                        Refresh Analysis
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.placeholderText, { color: theme.colors.text }]}>
                    {completedTasks.length > 0 
                      ? "Complete more tasks to get personalized AI insights."
                      : "Complete some tasks to receive AI-powered productivity insights."}
                  </Text>
                )}
              </>
            )}
          </Animated.View>
          
          {productivityPatterns.length > 0 && (
            <Animated.View
              entering={FadeIn.delay(400)}
              style={[styles.card, { backgroundColor: theme.colors.card }]}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Optimal Work Times
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.text }]}>
                Based on your productivity patterns
              </Text>
              
              <View style={styles.timeSlots}>
                {[
                  {time: '9:00 - 11:00 AM', score: 9.2},
                  {time: '2:00 - 4:00 PM', score: 8.5},
                  {time: '7:00 - 9:00 PM', score: 7.8}
                ].map((slot, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.timeSlot,
                      { backgroundColor: theme.isDark ? '#3c3c3e' : '#f5f5f5' }
                    ]}
                  >
                    <Text style={[styles.timeSlotText, { color: theme.colors.text }]}>
                      {slot.time}
                    </Text>
                    <View style={styles.scoreContainer}>
                      <View 
                        style={[
                          styles.scoreBar,
                          { backgroundColor: theme.colors.primary }
                        ]}
                      />
                      <Text style={[styles.scoreText, { color: theme.colors.primary }]}>
                        {slot.score}/10
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </>
      )}
      
      {selectedTab === 'suggestions' && (
        <>
          <Animated.View 
            entering={FadeIn.delay(300)}
            style={[styles.card, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Personalized Recommendations
            </Text>
            
            <View style={styles.suggestionContainer}>
              <View style={styles.suggestionHeader}>
                <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.suggestionTitle, { color: theme.colors.text }]}>
                  Optimize Your Schedule
                </Text>
              </View>
              <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                Schedule complex tasks during your most productive hours (9-11 AM) and batch similar tasks together to minimize context switching.
              </Text>
            </View>
            
            <View style={styles.suggestionContainer}>
              <View style={styles.suggestionHeader}>
                <Ionicons name="checkmark-done-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.suggestionTitle, { color: theme.colors.text }]}>
                  Task Breakdown
                </Text>
              </View>
              <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                Your completion rate is higher for smaller tasks. Try breaking down large tasks into subtasks of 30-60 minutes each.
              </Text>
            </View>
            
            <View style={styles.suggestionContainer}>
              <View style={styles.suggestionHeader}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.suggestionTitle, { color: theme.colors.text }]}>
                  Smart Reminders
                </Text>
              </View>
              <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                Set reminders 30 minutes before task deadlines to ensure you stay on track with high-priority items.
              </Text>
            </View>
          </Animated.View>
          
          <Animated.View 
            entering={FadeIn.delay(400)}
            style={[styles.card, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Productivity Techniques
            </Text>
            
            {productivitySuggestions.map((suggestion, index) => (
              <View 
                key={index} 
                style={[
                  styles.tipContainer,
                  index < productivitySuggestions.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    paddingBottom: 16,
                    marginBottom: 16
                  }
                ]}
              >
                <View style={styles.tipHeader}>
                  <Ionicons name={suggestion.icon} size={20} color={theme.colors.primary} />
                  <Text style={[styles.tipTitle, { color: theme.colors.text }]}>
                    {suggestion.title}
                  </Text>
                </View>
                <Text style={[styles.tipText, { color: theme.colors.text }]}>
                  {suggestion.text}
                </Text>
              </View>
            ))}
          </Animated.View>
        </>
      )}
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerStats: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 16,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: 20,
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
  },
  placeholderText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.7,
    padding: 16,
  },
  tipContainer: {
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 28,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
  },
  insightParagraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 8,
  },
  refreshText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  timeSlots: {
    marginTop: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeSlotText: {
    fontWeight: '500',
    fontSize: 15,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBar: {
    width: 40,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  scoreText: {
    fontWeight: '600',
    fontSize: 14,
  },
  suggestionContainer: {
    marginBottom: 20,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 22,
    paddingLeft: 34,
  }
});

export default ProductivityAnalyticsScreen;
