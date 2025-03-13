import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTaskContext } from '../contexts/TaskContext';
import AnimatedButton from '../components/AnimatedButton';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationSettings from '../components/NotificationSettings';
import HelpSupportScreen from '../components/HelpSupportScreen';
import { useNotificationSettings } from '../contexts/NotificationSettingsContext';

// User profile data type
interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
  phone: string;
  bio: string;
  joinedDate: string;
}

const ProfileScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const { tasks } = useTaskContext();
  const { notificationsEnabled, toggleNotifications } = useNotificationSettings();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: null,
    phone: '(555) 123-4567',
    bio: 'Productivity enthusiast and task management pro.',
    joinedDate: 'January 2023',
  });

  // Profile edit form state
  const [editForm, setEditForm] = useState<Omit<UserProfile, 'joinedDate'>>({
    name: '',
    email: '',
    avatar: null,
    phone: '',
    bio: '',
  });
  
  // Load user profile data from AsyncStorage
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem('@user_profile');
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, []);
  
  // Save user profile to AsyncStorage when it changes
  useEffect(() => {
    const saveUserProfile = async () => {
      try {
        await AsyncStorage.setItem('@user_profile', JSON.stringify(userProfile));
      } catch (error) {
        console.error('Error saving user profile:', error);
      }
    };
    
    saveUserProfile();
  }, [userProfile]);

  // Initialize edit form when opening edit profile modal
  useEffect(() => {
    if (showEditProfile) {
      setEditForm({
        name: userProfile.name,
        email: userProfile.email,
        avatar: userProfile.avatar,
        phone: userProfile.phone,
        bio: userProfile.bio,
      });
    }
  }, [showEditProfile]);
  
  const completedTasksCount = tasks.filter(task => task.status === 'completed').length;
  const pendingTasksCount = tasks.filter(task => task.status !== 'completed').length;
  const completionRate = tasks.length > 0 
    ? Math.round((completedTasksCount / tasks.length) * 100) 
    : 0;

  const handleShareTasks = async () => {
    try {
      // Create a temporary file with task data
      const fileUri = `${FileSystem.cacheDirectory}my_tasks.json`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(tasks, null, 2)
      );
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          UTI: 'public.json',
          dialogTitle: 'Share your tasks data'
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing tasks:', error);
      Alert.alert('Error', 'Could not share tasks data');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: () => {
            // In a real app, this would call auth service logout
            Alert.alert('Logged Out', 'You have been successfully logged out.');
          }
        },
      ]
    );
  };

  // Image picker function
  const pickImage = async () => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to change your profile picture');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        setEditForm({ ...editForm, avatar: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera permissions to take a profile picture');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        setEditForm({ ...editForm, avatar: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo');
    }
  };

  // Handle saving profile changes
  const handleSaveProfile = async () => {
    // Basic validation
    if (!editForm.name.trim() || !editForm.email.trim()) {
      Alert.alert('Invalid Input', 'Name and email are required');
      return;
    }
    
    if (!editForm.email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setUserProfile({
        ...userProfile,
        name: editForm.name,
        email: editForm.email,
        avatar: editForm.avatar,
        phone: editForm.phone,
        bio: editForm.bio,
      });
      
      setIsLoading(false);
      setShowEditProfile(false);
      
      // Show success message
      Alert.alert('Success', 'Your profile has been updated successfully');
    }, 500);
  };

  // Function to render avatar with placeholder for missing images
  const renderAvatar = () => {
    if (userProfile.avatar) {
      return (
        <Image 
          source={{ uri: userProfile.avatar }} 
          style={styles.avatar}
          onError={() => console.log("Failed to load avatar")}
        />
      );
    } else {
      return (
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.avatarInitial}>
            {userProfile.name ? userProfile.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
      );
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <Animated.View 
        entering={FadeIn.delay(100)} 
        style={[styles.header, { backgroundColor: theme.colors.card }]}
      >
        <View style={styles.profileContainer}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={() => setShowEditProfile(true)}
          >
            {renderAvatar()}
            <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {userProfile.name}
            </Text>
            <Text style={[styles.email, { color: theme.colors.text }]}>
              {userProfile.email}
            </Text>
            <Text style={[styles.joinedDate, { color: theme.colors.text }]}>
              Member since {userProfile.joinedDate}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowEditProfile(true)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {userProfile.bio && (
          <Text style={[styles.bio, { color: theme.colors.text }]}>
            {userProfile.bio}
          </Text>
        )}
      </Animated.View>

      {/* Statistics */}
      <Animated.View 
        entering={FadeIn.delay(200)} 
        style={[styles.statsCard, { backgroundColor: theme.colors.card }]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Task Statistics
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {tasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Total Tasks
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {completedTasksCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Completed
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
              {pendingTasksCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Pending
            </Text>
          </View>
        </View>
        
        {tasks.length > 0 && (
          <View style={styles.completionContainer}>
            <View style={styles.completionLabelRow}>
              <Text style={[styles.completionLabel, { color: theme.colors.text }]}>
                Completion Rate
              </Text>
              <Text style={[styles.completionPercent, { color: theme.colors.primary }]}>
                {completionRate}%
              </Text>
            </View>
            
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${completionRate}%`,
                    backgroundColor: theme.colors.primary
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </Animated.View>

      {/* Settings */}
      <Animated.View 
        entering={FadeIn.delay(300)} 
        style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Settings
        </Text>
        
        <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="moon-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={theme.isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>
        
        <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Enable Notifications
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
            thumbColor="#fff"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
          onPress={() => setShowNotificationSettings(true)}
        >
          <View style={styles.settingLabelContainer}>
            <Ionicons name="options-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Notification Settings
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
          onPress={handleShareTasks}
        >
          <View style={styles.settingLabelContainer}>
            <Ionicons name="share-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Share Tasks Data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Buttons */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.buttonContainer}>
        <AnimatedButton
          title="Help & Support"
          onPress={() => setShowHelpSupport(true)}
          variant="outline"
          icon={<Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />}
          style={styles.supportButton}
        />
        
        <AnimatedButton
          title="Log Out"
          onPress={handleLogout}
          variant="outline"
          icon={<Ionicons name="log-out-outline" size={20} color={theme.colors.error} />}
          style={[styles.logoutButton, { borderColor: theme.colors.error }]}
          textStyle={{ color: theme.colors.error }}
        />
      </Animated.View>
      
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.colors.text }]}>
          Version 1.0.0
        </Text>
      </View>

      {/* Notification Settings Modal */}
      <Modal
        isVisible={showNotificationSettings}
        onBackdropPress={() => setShowNotificationSettings(false)}
        onBackButtonPress={() => setShowNotificationSettings(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        isVisible={showHelpSupport}
        onBackdropPress={() => setShowHelpSupport(false)}
        onBackButtonPress={() => setShowHelpSupport(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <HelpSupportScreen onClose={() => setShowHelpSupport(false)} />
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isVisible={showEditProfile}
        onBackdropPress={() => !isLoading && setShowEditProfile(false)}
        onBackButtonPress={() => !isLoading && setShowEditProfile(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <View style={[styles.editProfileContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Edit Profile
            </Text>
            <TouchableOpacity 
              onPress={() => !isLoading && setShowEditProfile(false)}
              disabled={isLoading}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.editFormContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Image */}
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity style={styles.avatarPreview} onPress={pickImage}>
                {editForm.avatar ? (
                  <Image source={{ uri: editForm.avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.avatarInitial}>
                      {editForm.name ? editForm.name[0].toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.imageActions}>
                  <TouchableOpacity 
                    style={[styles.imageAction, { backgroundColor: theme.colors.primary }]} 
                    onPress={pickImage}
                  >
                    <Ionicons name="images-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.imageAction, { backgroundColor: theme.colors.primary }]} 
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Form Fields */}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Full Name *</Text>
              <TextInput
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                style={[
                  styles.fieldInput, 
                  { 
                    backgroundColor: theme.isDark ? '#2c2c2e' : '#f5f5f5',
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }
                ]}
                placeholder="Your full name"
                placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Email Address *</Text>
              <TextInput
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                style={[
                  styles.fieldInput, 
                  { 
                    backgroundColor: theme.isDark ? '#2c2c2e' : '#f5f5f5',
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }
                ]}
                placeholder="Your email address"
                placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Phone Number</Text>
              <TextInput
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                style={[
                  styles.fieldInput, 
                  { 
                    backgroundColor: theme.isDark ? '#2c2c2e' : '#f5f5f5',
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }
                ]}
                placeholder="Your phone number (optional)"
                placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Bio</Text>
              <TextInput
                value={editForm.bio}
                onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                style={[
                  styles.fieldInput, 
                  styles.bioInput,
                  { 
                    backgroundColor: theme.isDark ? '#2c2c2e' : '#f5f5f5',
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }
                ]}
                placeholder="Tell us about yourself (optional)"
                placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
          
          <AnimatedButton
            title="Save Changes"
            onPress={handleSaveProfile}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  joinedDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  bio: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    marginTop: 0,
  },
  settingsCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  completionContainer: {
    marginTop: 8,
  },
  completionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 14,
  },
  completionPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  supportButton: {
    marginBottom: 12,
  },
  logoutButton: {
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  versionText: {
    fontSize: 12,
    opacity: 0.5,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  editProfileContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  editFormContent: {
    padding: 16,
    paddingBottom: 24,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarPreview: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
  },
  imageAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    height: 48,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  saveButton: {
    margin: 16,
  },
});

export default ProfileScreen;
