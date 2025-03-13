import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useTaskContext } from '../contexts/TaskContext';
import { useTheme } from '../contexts/ThemeContext';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import aiService from '../services/aiService';

type SmartAssistantScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
}

const SmartAssistantScreen = () => {
  const navigation = useNavigation<SmartAssistantScreenNavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { tasks } = useTaskContext();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Add initial greeting message
  useEffect(() => {
    const initialMessage = {
      id: '1',
      content: `${getTimeBasedGreeting()}! I'm your smart assistant. I can help you optimize your tasks and improve your productivity. How can I help you today?`,
      sender: 'assistant' as const,
    };
    setMessages([initialMessage]);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // This is the crucial function that needs improvement
  const formatAssistantResponse = (text: string): string => {
    // Log the response for debugging
    console.log('Raw AI response:', text);
    
    try {
      // Remove the "boxed" format that appears in some responses
      if (text.includes('\\boxed{')) {
        text = text.replace('\\boxed{', '').replace('}', '');
      }
      
      // Check for various JSON patterns
      if (text.includes('"response"')) {
        // Try to extract from JSON object containing a response field
        const match = text.match(/"response"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        if (match && match[1]) {
          return match[1].replace(/\\n/g, '\n').replace(/\\\"/g, '"');
        }
        
        // Try to extract from JSON object with 'response' field using JSON.parse
        try {
          // First, find where JSON possibly starts and ends
          const jsonStartIndex = text.indexOf('{');
          const jsonEndIndex = text.lastIndexOf('}') + 1;
          
          if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            const possibleJson = text.substring(jsonStartIndex, jsonEndIndex);
            const parsed = JSON.parse(possibleJson);
            
            if (parsed.response) {
              return parsed.response;
            }
          }
        } catch (e) {
          console.log('Failed to parse JSON:', e);
        }
      }
      
      // Handle code blocks
      if (text.includes('```')) {
        // Remove code block markers and any language identifier
        text = text.replace(/```(?:json|javascript|typescript)?\s*/g, '').replace(/```\s*$/g, '');
      }
      
      // Remove JSON syntax decorations
      text = text.replace(/{\s*".*":\s*"/g, '').replace(/"\s*}\s*$/g, '');
      
      // Clean up any remaining newline escapes
      text = text.replace(/\\n/g, '\n');
      
      // If we've mangled the text too much, just use the original
      if (text.trim().length < 10) {
        return text;
      }
      
      return text;
    } catch (error) {
      console.error('Error formatting response:', error);
      return text;
    }
  };

  const handleSendMessage = async () => {
    if (!query.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: query.trim(),
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // Get AI response
      const response = await aiService.getAssistantResponse(userMessage.content, tasks);
      
      // Format the response to remove JSON wrappers
      const formattedResponse = formatAssistantResponse(response);
      console.log('Formatted response:', formattedResponse);

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: formattedResponse,
        sender: 'assistant',
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Scroll to bottom after adding new messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message if AI fails
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm using pre-programmed responses right now as I couldn't connect to my AI backend. I'll still try to be helpful!",
        sender: 'assistant',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <Animated.View 
        entering={FadeIn.delay(100)}
        style={[
          styles.header,
          { 
            backgroundColor: theme.colors.card,
            paddingTop: insets.top || 16
          }
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Smart Assistant
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.text, opacity: 0.7 }]}>
          AI-powered productivity insights
        </Text>
      </Animated.View>

      {/* Chat Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={[styles.messagesContainer, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <Animated.View
            key={message.id}
            entering={FadeInRight.delay(index * 100).springify()}
            style={[
              styles.messageContainer,
              message.sender === 'user' ? styles.userMessage : styles.assistantMessage,
              {
                backgroundColor: message.sender === 'user' 
                  ? theme.colors.primary 
                  : theme.isDark ? '#3c3c3e' : '#f0f0f0'
              }
            ]}
          >
            {/* Add assistant icon for AI messages */}
            {message.sender === 'assistant' && (
              <View style={styles.iconContainer}>
                <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
              </View>
            )}
            <Text
              style={[
                styles.messageText,
                { color: message.sender === 'user' ? '#fff' : theme.colors.text }
              ]}
            >
              {message.content}
            </Text>
          </Animated.View>
        ))}
        
        {isLoading && (
          <Animated.View
            entering={FadeIn}
            style={[
              styles.messageContainer,
              styles.assistantMessage,
              { backgroundColor: theme.isDark ? '#3c3c3e' : '#f0f0f0' }
            ]}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>Thinking...</Text>
            </View>
          </Animated.View>
        )}
        
        <View style={styles.spacer} />
      </ScrollView>

      {/* Analytics Button */}
      <AnimatedButton
        title="View Productivity Analytics"
        onPress={() => navigation.navigate('ProductivityAnalytics')}
        style={styles.analyticsButton}
        icon={<Ionicons name="analytics-outline" size={20} color="#fff" />}
      />

      {/* Message Input */}
      <Animated.View
        entering={FadeIn.delay(500)}
        style={[
          styles.inputContainer,
          { 
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1
          }
        ]}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ask your assistant..."
          placeholderTextColor={theme.isDark ? '#777777' : '#aaaaaa'}
          style={[
            styles.input,
            {
              backgroundColor: theme.isDark ? '#3c3c3e' : '#f5f5f5',
              color: theme.colors.text,
            },
          ]}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendButton, 
            { backgroundColor: theme.colors.primary },
            !query.trim() && { opacity: 0.5 }
          ]}
          onPress={handleSendMessage}
          disabled={!query.trim() || isLoading}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingTop: 8,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 6,
    marginTop: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontStyle: 'italic',
  },
  loader: {
    padding: 8,
  },
  spacer: {
    height: 60,
  },
  analyticsButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 48,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    position: 'absolute',
    right: 24,
    bottom: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SmartAssistantScreen;
