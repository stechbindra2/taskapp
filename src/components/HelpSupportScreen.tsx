import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Linking,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface HelpSupportScreenProps {
  onClose: () => void;
}

type FAQItem = {
  question: string;
  answer: string;
  expanded: boolean;
};

const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      question: "How do I create a new task?",
      answer: "Tap on the + button on the home screen or tasks screen to create a new task. Fill in the required details and tap 'Create Task'.",
      expanded: false
    },
    {
      question: "How do I set a recurring task?",
      answer: "When creating or editing a task, toggle on 'Recurring task' and select your desired recurrence pattern.",
      expanded: false
    },
    {
      question: "How do I track time spent on a task?",
      answer: "Open a task and tap the play button in the Time Tracking section to start a timer. Tap the stop button to end tracking.",
      expanded: false
    },
    {
      question: "Can I sync tasks with my calendar?",
      answer: "Yes! When viewing a task with a deadline, tap 'Add to Calendar' to sync it with your device calendar.",
      expanded: false
    },
    {
      question: "How do I edit or delete a task?",
      answer: "Open the task and tap the edit button (pencil icon) to modify it, or scroll down and tap 'Delete Task' to remove it.",
      expanded: false
    }
  ]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const toggleExpand = (index: number) => {
    const updated = [...faqItems];
    updated[index].expanded = !updated[index].expanded;
    setFaqItems(updated);
  };

  const openEmailSupport = () => {
    Linking.openURL('mailto:support@taskapp.com?subject=Task App Support Request')
      .catch(() => {
        Alert.alert('Error', 'Could not open email client');
      });
  };

  const submitSupportRequest = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSending(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setName('');
      setEmail('');
      setMessage('');
      Alert.alert(
        'Message Sent', 
        'Thank you for contacting us. We will get back to you shortly.',
        [{ text: 'OK', onPress: onClose }]
      );
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Help & Support
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'faq' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
          ]} 
          onPress={() => setActiveTab('faq')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'faq' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            FAQ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'contact' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
          ]} 
          onPress={() => setActiveTab('contact')}
        >
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'contact' ? theme.colors.primary : theme.colors.text }
            ]}
          >
            Contact Us
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {activeTab === 'faq' ? (
          // FAQ Tab Content
          <View>
            {faqItems.map((item, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInDown.delay(index * 100).springify()}
                style={[
                  styles.faqItem, 
                  { borderBottomColor: theme.colors.border }
                ]}
              >
                <TouchableOpacity 
                  style={styles.faqQuestion} 
                  onPress={() => toggleExpand(index)}
                >
                  <Text style={[styles.questionText, { color: theme.colors.text }]}>
                    {item.question}
                  </Text>
                  <Ionicons 
                    name={item.expanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.text} 
                  />
                </TouchableOpacity>
                
                {item.expanded && (
                  <Text style={[styles.answerText, { color: theme.colors.text }]}>
                    {item.answer}
                  </Text>
                )}
              </Animated.View>
            ))}
            
            <View style={styles.helpfulLinks}>
              <Text style={[styles.helpfulLinksTitle, { color: theme.colors.text }]}>
                Helpful Links
              </Text>
              
              <TouchableOpacity 
                style={styles.helpfulLink}
                onPress={() => Linking.openURL('https://taskapp.com/tutorial')}
              >
                <Ionicons name="videocam-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.helpfulLinkText, { color: theme.colors.primary }]}>
                  Video Tutorials
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.helpfulLink}
                onPress={() => Linking.openURL('https://taskapp.com/docs')}
              >
                <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.helpfulLinkText, { color: theme.colors.primary }]}>
                  Documentation
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.helpfulLink}
                onPress={() => Linking.openURL('https://taskapp.com/community')}
              >
                <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.helpfulLinkText, { color: theme.colors.primary }]}>
                  Community Forum
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Contact Us Tab Content
          <View>
            <Text style={[styles.contactText, { color: theme.colors.text }]}>
              Need help with something not covered in our FAQ? Reach out to our support team.
            </Text>
            
            <View style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
                <TextInput 
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: theme.isDark ? '#2c2c2e' : '#f5f5f5',
                      color: theme.colors.text,
                      borderColor: theme.colors.border
                    }
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
                <TextInput 
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: theme.isDark ? '#2c2c2e' : '#f5f5f5',
                      color: theme.colors.text,
                      borderColor: theme.colors.border
                    }
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Your email address"
                  placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Message</Text>
                <TextInput 
                  style={[
                    styles.input, 
                    styles.textArea,
                    { 
                      backgroundColor: theme.isDark ? '#2c2c2e' : '#f5f5f5',
                      color: theme.colors.text,
                      borderColor: theme.colors.border
                    }
                  ]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="How can we help you?"
                  placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.emailButton, 
                    { borderColor: theme.colors.primary }
                  ]}
                  onPress={openEmailSupport}
                >
                  <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
                  <Text style={[styles.emailButtonText, { color: theme.colors.primary }]}>
                    Email Support
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={submitSupportRequest}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Submit Request
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    paddingLeft: 4,
    opacity: 0.8,
  },
  helpfulLinks: {
    marginTop: 24,
  },
  helpfulLinksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  helpfulLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  helpfulLinkText: {
    marginLeft: 8,
    fontSize: 15,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  formContainer: {
    marginTop: 8,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  emailButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default HelpSupportScreen;
