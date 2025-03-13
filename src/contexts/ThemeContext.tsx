import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  priority: {
    high: string;
    medium: string;
    low: string;
  };
};

type Theme = {
  isDark: boolean;
  colors: ThemeColors;
};

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
};

const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#007AFF', // iOS blue
    secondary: '#5856D6', // iOS purple
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E1E1E1',
    error: '#FF3B30', // iOS red
    success: '#34C759', // iOS green
    warning: '#FF9500', // iOS orange
    priority: {
      high: '#FF3B30',
      medium: '#FF9500',
      low: '#34C759',
    },
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#0A84FF', // iOS blue (dark)
    secondary: '#5E5CE6', // iOS purple (dark)
    background: '#1C1C1E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    border: '#38383A',
    error: '#FF453A', // iOS red (dark)
    success: '#30D158', // iOS green (dark)
    warning: '#FF9F0A', // iOS orange (dark)
    priority: {
      high: '#FF453A',
      medium: '#FF9F0A',
      low: '#30D158',
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        } else {
          // Use device color scheme as default
          const colorScheme = Appearance.getColorScheme();
          setIsDark(colorScheme === 'dark');
          
          // Listen for device theme changes
          Appearance.addChangeListener(({ colorScheme }) => {
            setIsDark(colorScheme === 'dark');
          });
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    
    loadThemePreference();
  }, []);

  // Save theme preference whenever it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('Failed to save theme preference', error);
      }
    };
    
    saveThemePreference();
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
