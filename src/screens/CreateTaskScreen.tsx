import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useTaskContext } from '../contexts/TaskContext';
import { Task } from '../types';
import TaskForm from '../components/TaskForm';
import { useTheme } from '../contexts/ThemeContext';

type CreateTaskScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type EditTaskScreenRouteProp = RouteProp<RootStackParamList, 'EditTask'>;

const CreateTaskScreen = () => {
  const navigation = useNavigation<CreateTaskScreenNavigationProp>();
  const route = useRoute();
  const { addTask, getTaskById, updateTask } = useTaskContext();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<Task>>();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if we're in edit mode
  const isEditMode = route.name === 'EditTask';

  useEffect(() => {
    const loadTask = async () => {
      if (isEditMode) {
        // Get taskId from route params
        const { taskId } = route.params as { taskId: string };
        const taskToEdit = getTaskById(taskId);
        
        if (taskToEdit) {
          setInitialValues(taskToEdit);
        } else {
          Alert.alert('Error', 'Task not found');
          navigation.goBack();
        }
      }
      setIsLoading(false);
    };
    
    loadTask();
  }, [isEditMode, route.params, getTaskById, navigation]);

  const handleSubmit = async (taskData: Partial<Task>) => {
    setLoading(true);
    
    try {
      if (isEditMode && initialValues?.id) {
        // Update existing task
        const updatedTask = {
          ...initialValues,
          ...taskData,
          updatedAt: new Date(),
        } as Task;
        
        await updateTask(updatedTask);
        Alert.alert('Success', 'Task updated successfully');
      } else {
        // Create new task
        const newTask: Task = {
          id: Date.now().toString(),
          ...taskData,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'current-user-id', // In a real app, get from auth
        } as Task;
        
        await addTask(newTask);
        Alert.alert('Success', 'Task created successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'An error occurred while saving the task');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TaskForm 
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isLoading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateTaskScreen;
