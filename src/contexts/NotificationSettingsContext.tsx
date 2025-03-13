import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

type ReminderTimes = {
  atTime: boolean;
  fifteenMinutes: boolean;
  thirtyMinutes: boolean;
  oneHour: boolean;
  oneDay: boolean;
};

type NotificationSettingsContextType = {
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  reminderTimes: ReminderTimes;
  toggleReminderTime: (key: keyof ReminderTimes) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  vibrationEnabled: boolean;
  toggleVibration: () => void;
};

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

const STORAGE_KEY = '@notification_settings';

export const NotificationSettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [reminderTimes, setReminderTimes] = useState<ReminderTimes>({
    atTime: true,
    fifteenMinutes: false,
    thirtyMinutes: true,
    oneHour: false,
    oneDay: false
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setNotificationsEnabled(settings.notificationsEnabled);
          setReminderTimes(settings.reminderTimes);
          setSoundEnabled(settings.soundEnabled);
          setVibrationEnabled(settings.vibrationEnabled);
        }
      } catch (error) {
        console.error('Error loading notification settings', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        const settings = {
          notificationsEnabled,
          reminderTimes,
          soundEnabled,
          vibrationEnabled
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving notification settings', error);
      }
    };

    saveSettings();
  }, [notificationsEnabled, reminderTimes, soundEnabled, vibrationEnabled]);

  // Request notification permissions when notifications are enabled
  useEffect(() => {
    const requestPermissions = async () => {
      if (notificationsEnabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          // If permissions are denied, disable notifications
          setNotificationsEnabled(false);
        }
      }
    };

    requestPermissions();
  }, [notificationsEnabled]);

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const toggleReminderTime = (key: keyof ReminderTimes) => {
    setReminderTimes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const toggleVibration = () => {
    setVibrationEnabled(prev => !prev);
  };

  return (
    <NotificationSettingsContext.Provider
      value={{
        notificationsEnabled,
        toggleNotifications,
        reminderTimes,
        toggleReminderTime,
        soundEnabled,
        toggleSound,
        vibrationEnabled,
        toggleVibration
      }}
    >
      {children}
    </NotificationSettingsContext.Provider>
  );
};

export const useNotificationSettings = () => {
  const context = useContext(NotificationSettingsContext);
  if (context === undefined) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
  }
  return context;
};
