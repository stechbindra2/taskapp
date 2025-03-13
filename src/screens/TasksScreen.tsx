import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useTaskContext } from '../contexts/TaskContext';
import { useTheme } from '../contexts/ThemeContext';
import { Priority, TaskStatus, Task } from '../types';
import TaskCard from '../components/TaskCard';
import Animated, { FadeIn } from 'react-native-reanimated';

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const TasksScreen = () => {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const { tasks } = useTaskContext();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TaskStatus | 'all'>('all');
  const [activePriority, setActivePriority] = useState<Priority | 'all'>('all');

  // Refresh screen when focused
  useFocusEffect(
    useCallback(() => {
      // This will re-render the component when the screen is focused
    }, [])
  );

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const handleAddTask = () => {
    navigation.navigate('CreateTask');
  };

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by status
    if (activeFilter !== 'all' && task.status !== activeFilter) {
      return false;
    }
    
    // Filter by priority
    if (activePriority !== 'all' && task.priority !== activePriority) {
      return false;
    }
    
    // Search by title or description
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  // Sort tasks by creation date (newest first)
  const sortedTasks = [...filteredTasks].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const FilterButton = ({ 
    title, 
    value, 
    active, 
    setter 
  }: { 
    title: string;
    value: string;
    active: string;
    setter: React.Dispatch<React.SetStateAction<any>>;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { 
          backgroundColor: active === value ? theme.colors.primary : theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => setter(value)}
    >
      <Text
        style={{
          color: active === value ? '#fff' : theme.colors.text,
          fontWeight: active === value ? '600' : 'normal',
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <Animated.View 
        entering={FadeIn.delay(100)}
        style={[
          styles.searchContainer,
          { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }
        ]}
      >
        <Ionicons name="search" size={20} color={theme.colors.text} style={styles.searchIcon} />
        <TextInput
          placeholder="Search tasks..."
          placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: theme.colors.text }]}
          clearButtonMode="while-editing"
        />
      </Animated.View>

      {/* Status Filter */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.filterContainer}>
        <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Status:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <FilterButton 
            title="All" 
            value="all" 
            active={activeFilter}
            setter={setActiveFilter}
          />
          <FilterButton 
            title="Todo" 
            value={TaskStatus.TODO} 
            active={activeFilter}
            setter={setActiveFilter}
          />
          <FilterButton 
            title="In Progress" 
            value={TaskStatus.IN_PROGRESS} 
            active={activeFilter}
            setter={setActiveFilter}
          />
          <FilterButton 
            title="Completed" 
            value={TaskStatus.COMPLETED}
            active={activeFilter}
            setter={setActiveFilter}
          />
        </ScrollView>
      </Animated.View>

      {/* Priority Filter */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.filterContainer}>
        <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Priority:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <FilterButton 
            title="All" 
            value="all" 
            active={activePriority}
            setter={setActivePriority}
          />
          <FilterButton 
            title="Low" 
            value={Priority.LOW} 
            active={activePriority}
            setter={setActivePriority}
          />
          <FilterButton 
            title="Medium" 
            value={Priority.MEDIUM} 
            active={activePriority}
            setter={setActivePriority}
          />
          <FilterButton 
            title="High" 
            value={Priority.HIGH}
            active={activePriority}
            setter={setActivePriority}
          />
        </ScrollView>
      </Animated.View>

      {/* Tasks List */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.listContainer}>
        {sortedTasks.length > 0 ? (
          <FlatList
            data={sortedTasks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TaskCard task={item} onPress={handleTaskPress} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={[styles.emptyContainer, { borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={50} color={theme.colors.text} opacity={0.5} />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              {searchQuery || activeFilter !== 'all' || activePriority !== 'all'
                ? 'No tasks match your filters'
                : 'No tasks yet. Create your first task!'}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddTask}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  searchContainer: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filtersRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterLabel: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingBottom: 100, // Extra space at bottom for FAB
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 32,
    marginTop: 40,
    padding: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default TasksScreen;
