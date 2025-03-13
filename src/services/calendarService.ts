import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';
import { Task } from '../types';

class CalendarService {
  private deviceCalendarId: string | null = null;

  async requestCalendarPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  async setupCalendar(): Promise<boolean> {
    try {
      const hasPermission = await this.requestCalendarPermissions();

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Calendar access is required to sync tasks with your calendar',
          [{ text: 'OK' }]
        );
        return false;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => 
        (Platform.OS === 'ios' && cal.allowsModifications) ||
        (Platform.OS === 'android' && cal.accessLevel === Calendar.CalendarAccessLevel.OWNER)
      );

      if (defaultCalendar) {
        this.deviceCalendarId = defaultCalendar.id;
        return true;
      }

      // Create a calendar if needed
      if (Platform.OS === 'android') {
        const newCalendarId = await this.createCalendar();
        if (newCalendarId) {
          this.deviceCalendarId = newCalendarId;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error setting up calendar:', error);
      return false;
    }
  }

  async createCalendar(): Promise<string | null> {
    try {
      // Fix the type issue by handling both iOS and Android separately
      let defaultCalendarSource: { id: string; type: string; name: string };
      
      if (Platform.OS === 'ios') {
        const calendar = await Calendar.getDefaultCalendarAsync();
        defaultCalendarSource = {
          id: calendar.id,
          type: calendar.type || 'local',
          name: calendar.title || 'TaskApp'
        };
      } else {
        defaultCalendarSource = { 
          id: 'local', 
          type: 'local', 
          name: 'TaskApp' 
        };
      }

      const newCalendar = await Calendar.createCalendarAsync({
        title: 'TaskApp Calendar',
        color: '#3498db',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendarSource.id,
        source: {
          id: defaultCalendarSource.id,
          type: defaultCalendarSource.type,
          name: defaultCalendarSource.name
        } as Calendar.Source,
        name: 'taskapp',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
      
      return newCalendar;
    } catch (error) {
      console.error('Error creating calendar:', error);
      return null;
    }
  }

  async addTaskToCalendar(task: Task): Promise<string | null> {
    if (!task.deadline) return null;

    try {
      if (!this.deviceCalendarId) {
        const isSetup = await this.setupCalendar();
        if (!isSetup) return null;
      }

      // Create event end time (deadline + 1 hour)
      const endTime = new Date(task.deadline);
      endTime.setHours(endTime.getHours() + 1);

      const eventDetails = {
        title: task.title,
        notes: task.description || '',
        startDate: task.deadline,
        endDate: endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -30 }], // 30 minute reminder
      };

      const eventId = await Calendar.createEventAsync(
        this.deviceCalendarId!, 
        eventDetails
      );

      return eventId;
    } catch (error) {
      console.error('Error adding task to calendar:', error);
      return null;
    }
  }

  async updateTaskInCalendar(task: Task, eventId: string): Promise<boolean> {
    if (!task.deadline || !eventId) return false;

    try {
      if (!this.deviceCalendarId) {
        const isSetup = await this.setupCalendar();
        if (!isSetup) return false;
      }

      // Create event end time (deadline + 1 hour)
      const endTime = new Date(task.deadline);
      endTime.setHours(endTime.getHours() + 1);

      await Calendar.updateEventAsync(eventId, {
        title: task.title,
        notes: task.description || '',
        startDate: task.deadline,
        endDate: endTime,
      });

      return true;
    } catch (error) {
      console.error('Error updating task in calendar:', error);
      return false;
    }
  }

  async removeTaskFromCalendar(eventId: string): Promise<boolean> {
    try {
      if (!this.deviceCalendarId) {
        const isSetup = await this.setupCalendar();
        if (!isSetup) return false;
      }

      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('Error removing task from calendar:', error);
      return false;
    }
  }
}

export default new CalendarService();
