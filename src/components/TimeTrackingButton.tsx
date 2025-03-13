import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

type TimeTrackingButtonProps = {
  isActive: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  elapsedTime?: number; // in seconds
};

const TimeTrackingButton: React.FC<TimeTrackingButtonProps> = ({
  isActive,
  onStartTracking,
  onStopTracking,
  elapsedTime = 0,
}) => {
  const { theme } = useTheme();
  const [timeElapsed, setTimeElapsed] = useState(elapsedTime);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hrs > 0 ? `${hrs}:` : '',
      mins.toString().padStart(2, '0'),
      ':',
      secs.toString().padStart(2, '0')
    ].join('');
  };

  // Start/stop timer
  useEffect(() => {
    if (isActive && !timer) {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      setTimer(interval);
    } else if (!isActive && timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isActive]);

  // Reset timer when elapsed time prop changes
  useEffect(() => {
    setTimeElapsed(elapsedTime);
  }, [elapsedTime]);

  return (
    <View style={styles.container}>
      <Text style={[styles.timeText, { color: theme.colors.text }]}>
        {formatTime(timeElapsed)}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isActive 
              ? theme.colors.error 
              : theme.colors.success
          }
        ]}
        onPress={isActive ? onStopTracking : onStartTracking}
      >
        <Ionicons
          name={isActive ? 'stop' : 'play'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

export default TimeTrackingButton;
