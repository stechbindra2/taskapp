import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types';

class NotificationService {
  constructor() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async scheduleTaskReminder(task: Task): Promise<string[]> {
    if (!task.deadline) return [];

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return [];

      const notificationIds: string[] = [];

      // Schedule notification for 30 minutes before deadline
      const thirtyMinBefore = new Date(task.deadline);
      thirtyMinBefore.setMinutes(thirtyMinBefore.getMinutes() - 30);
      
      if (thirtyMinBefore > new Date()) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task Reminder',
            body: `"${task.title}" is due in 30 minutes`,
            data: { taskId: task.id },
          },
          trigger: thirtyMinBefore,
        });
        notificationIds.push(id);
      }

      // Schedule notification for task deadline
      if (task.deadline > new Date()) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task Due Now',
            body: `"${task.title}" is due now`,
            data: { taskId: task.id },
          },
          trigger: task.deadline,
        });
        notificationIds.push(id);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return [];
    }
  }

  async cancelTaskReminders(notificationIds: string[]): Promise<void> {
    try {
      await Promise.all(
        notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
      );
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}

export default new NotificationService();
