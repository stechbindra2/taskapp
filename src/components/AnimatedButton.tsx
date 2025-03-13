import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

type AnimatedButtonProps = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
};

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  title, 
  onPress, 
  style, 
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  
  const getBackgroundColor = () => {
    if (disabled) return theme.isDark ? '#555' : '#ccc';
    
    switch(variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'danger':
        return theme.colors.error;
      case 'outline':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return theme.isDark ? '#aaa' : '#666';
    
    return variant === 'outline' ? 
      theme.colors.primary : 
      '#fff';
  };
  
  const getBorderColor = () => {
    if (disabled) return theme.isDark ? '#555' : '#ccc';
    
    return variant === 'outline' ? 
      theme.colors.primary : 
      getBackgroundColor();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.button,
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && icon}
          <Text style={[
            styles.text, 
            { color: getTextColor() }, 
            icon && { marginLeft: 8 },
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnimatedButton;
