import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import EditTaskScreen from '../screens/CreateTaskScreen'; // Reuse CreateTaskScreen for editing
import SmartAssistantScreen from '../screens/SmartAssistantScreen';
import ProductivityAnalyticsScreen from '../screens/ProductivityAnalyticsScreen';
import { useTheme } from '../contexts/ThemeContext';

// Define navigation types
export type RootStackParamList = {
  Main: undefined;
  TaskDetail: { taskId: string };
  CreateTask: { startTime?: Date }; // Add startTime as optional param
  EditTask: { taskId: string };
  ProductivityAnalytics: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Assistant: undefined;
  Calendar: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const MainTabs = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.isDark ? '#888' : '#aaa',
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Assistant"
        component={SmartAssistantScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            // Use "bulb-outline" instead of "sparkles-outline" which doesn't exist
            <Ionicons name="bulb-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
        cardStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen} 
        options={{ title: "Task Details" }}
      />
      <Stack.Screen 
        name="CreateTask" 
        component={CreateTaskScreen} 
        options={{ title: "Create Task" }}
      />
      <Stack.Screen 
        name="EditTask" 
        component={EditTaskScreen} 
        options={{ title: "Edit Task" }}
      />
      <Stack.Screen 
        name="ProductivityAnalytics" 
        component={ProductivityAnalyticsScreen} 
        options={{ title: "Productivity Analytics" }}
      />
    </Stack.Navigator>
  );
};

export default Navigation;
