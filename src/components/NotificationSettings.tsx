import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNotificationSettings } from '../contexts/NotificationSettingsContext';

interface NotificationSettingsProps {
  onClose: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { 
    notificationsEnabled, 
    reminderTimes,
    toggleReminderTime,
    soundEnabled,
    toggleSound,
    vibrationEnabled,
    toggleVibration
  } = useNotificationSettings();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Notification Settings
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Reminder Times
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>
          When should we remind you about upcoming tasks?
        </Text>

        {Object.entries(reminderTimes).map(([key, value]) => {
          let label = '';
          switch (key) {
            case 'atTime': label = 'At time of task'; break;
            case 'fifteenMinutes': label = '15 minutes before'; break;
            case 'thirtyMinutes': label = '30 minutes before'; break;
            case 'oneHour': label = '1 hour before'; break;
            case 'oneDay': label = '1 day before'; break;
          }
          
          return (
            <View key={key} style={[styles.option, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.optionText, { color: theme.colors.text }]}>
                {label}
              </Text>
              <Switch
                value={Boolean(value)}
                onValueChange={() => toggleReminderTime(key as keyof typeof reminderTimes)}
                trackColor={{ false: '#ccc', true: theme.colors.primary }}
                thumbColor="#fff"
                disabled={!notificationsEnabled}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Alert Settings
        </Text>
        
        <View style={[styles.option, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.optionText, { color: theme.colors.text }]}>
            Sound
          </Text>
          <Switch
            value={Boolean(soundEnabled)}
            onValueChange={toggleSound}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
            thumbColor="#fff"
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={[styles.option, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.optionText, { color: theme.colors.text }]}>
            Vibration
          </Text>
          <Switch
            value={Boolean(vibrationEnabled)}
            onValueChange={toggleVibration}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
            thumbColor="#fff"
            disabled={!notificationsEnabled}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
        onPress={onClose}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  optionText: {
    fontSize: 15,
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationSettings;
