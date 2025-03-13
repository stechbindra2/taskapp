import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useTaskContext } from '../contexts/TaskContext';
import { RootStackParamList, MainTabParamList } from '../navigation';
import { TaskStatus } from '../types';
import TaskCard from '../components/TaskCard';
import AnimatedButton from '../components/AnimatedButton';
import Animated, { FadeIn } from 'react-native-reanimated';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList & { Tasks: undefined } >;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const { tasks, getTasksByStatus } = useTaskContext();

  const recentTasks = [...tasks]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const upcomingTasks = [...tasks]
    .filter(task => task.deadline && task.status !== 'completed')
    .sort((a, b) => {
      if (a.deadline && b.deadline) {
        return a.deadline.getTime() - b.deadline.getTime();
      }
      return 0;
    })
    .slice(0, 3);

  const todosCount = getTasksByStatus(TaskStatus.TODO).length;
  const inProgressCount = getTasksByStatus(TaskStatus.IN_PROGRESS).length;
  const completedCount = getTasksByStatus(TaskStatus.COMPLETED).length;
  const totalTasks = tasks.length;

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  // Refresh the screen when focused
  useFocusEffect(
    useCallback(() => {
      // This will re-render the component when the screen is focused
    }, [])
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            Hello there 👋
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            {format(new Date(), 'EEEE, MMMM d')}
          </Text>
        </Animated.View>
      </View>

      <Animated.View 
        entering={FadeIn.delay(200)} 
        style={[styles.statsContainer, { borderColor: theme.colors.border }]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {todosCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Todo
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
              {inProgressCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              In Progress
            </Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {completedCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Completed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {totalTasks}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Total
            </Text>
          </View>
        </View>
      </Animated.View>

      <AnimatedButton
        title="Create New Task"
        onPress={() => navigation.navigate('CreateTask')}
        icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />}
        style={styles.createTaskButton}
      />

      <Animated.View entering={FadeIn.delay(300)}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Upcoming Tasks
          </Text>
          {upcomingTasks.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Tasks' as any)}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {upcomingTasks.length > 0 ? (
          <FlatList
            data={upcomingTasks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onPress={() => handleTaskPress(item.id)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.upcomingList}
          />
        ) : (
          <View style={[styles.emptyState, { borderColor: theme.colors.border }]}>
            <Ionicons name="calendar-outline" size={40} color={theme.colors.text} opacity={0.5} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
              No upcoming tasks
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400)}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Tasks
          </Text>
          {recentTasks.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Tasks' as any)}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTasks.length > 0 ? (
          recentTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task.id)}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { borderColor: theme.colors.border }]}>
            <Ionicons name="list-outline" size={40} color={theme.colors.text} opacity={0.5} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
              No tasks created yet
            </Text>
          </View>
        )}
      </Animated.View>
      
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  greetingContainer: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  statsContainer: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  createTaskButton: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
  upcomingList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  bottomSpace: {
    height: 100,
  },
});

export default HomeScreen;
