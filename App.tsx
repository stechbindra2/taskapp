import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

// Import providers and navigation
import { ThemeProvider } from './src/contexts/ThemeContext';
import { TaskProvider } from './src/contexts/TaskContext';
import { TaskAssistantProvider } from './src/contexts/TaskAssistantContext';
import { NotificationSettingsProvider } from './src/contexts/NotificationSettingsContext';
import AppNavigator from './src/navigation';

// Configure notifications for the app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  // Request notification permissions on app start
  useEffect(() => {
    const requestNotificationPermissions = async () => {
      try {
        await Notifications.requestPermissionsAsync();
      } catch (error) {
        console.log('Error requesting notification permissions:', error);
      }
    };
    
    requestNotificationPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TaskProvider>
          <TaskAssistantProvider>
            <NotificationSettingsProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
              </NavigationContainer>
            </NotificationSettingsProvider>
          </TaskAssistantProvider>
        </TaskProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
