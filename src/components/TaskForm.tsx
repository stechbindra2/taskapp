import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal
} from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Priority, TaskStatus, Task, RecurrenceType } from '../types';
import AnimatedButton from './AnimatedButton';
import DateTimePicker from '@react-native-community/datetimepicker';

type TaskFormProps = {
  initialValues?: Partial<Task>;
  onSubmit: (taskData: Partial<Task>) => void;
  isLoading?: boolean;
};

const TaskForm: React.FC<TaskFormProps> = ({ 
  initialValues, 
  onSubmit, 
  isLoading = false 
}) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [priority, setPriority] = useState<Priority>(initialValues?.priority || Priority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(initialValues?.status || TaskStatus.TODO);
  const [deadline, setDeadline] = useState<Date | undefined>(initialValues?.deadline);
  const [hasTimeSpecific, setHasTimeSpecific] = useState(!!initialValues?.startTime);
  const [startTime, setStartTime] = useState<Date | undefined>(initialValues?.startTime || new Date());
  const [duration, setDuration] = useState<number>(initialValues?.duration || 60); // Default to 60 minutes
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(!!initialValues?.recurrence);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initialValues?.recurrence?.type || RecurrenceType.NONE
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(
    initialValues?.recurrence?.interval || 1
  );
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  const handleSubmit = () => {
    if (!title.trim()) return;

    const taskData: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      deadline,
      tags: tags.length > 0 ? tags : undefined
    };

    // Add time-specific data if enabled
    if (hasTimeSpecific && startTime) {
      taskData.startTime = startTime;
      taskData.duration = duration;
    }

    // Add recurrence data if enabled
    if (isRecurring && recurrenceType !== RecurrenceType.NONE) {
      taskData.recurrence = {
        type: recurrenceType,
        interval: recurrenceInterval,
      };
    }

    onSubmit(taskData);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.HIGH:
        return theme.colors.priority.high;
      case Priority.MEDIUM:
        return theme.colors.priority.medium;
      default:
        return theme.colors.priority.low;
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const renderRecurrenceOptions = () => (
    <Modal 
      visible={showRecurrenceModal} 
      onRequestClose={() => setShowRecurrenceModal(false)}
      transparent={true}
      animationType="slide"
    >
      <View style={[styles.modalOverlay]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Recurrence Settings
          </Text>
          
          <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Repeat</Text>
          <View style={styles.recurrenceOptions}>
            {Object.values(RecurrenceType).map((type) => {
              if (type === RecurrenceType.NONE) return null;
              
              const isSelected = type === recurrenceType;
              const typeName = type.charAt(0).toUpperCase() + type.slice(1);
              
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.recurrenceOption,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                      borderColor: theme.colors.primary
                    }
                  ]}
                  onPress={() => setRecurrenceType(type)}
                >
                  <Text style={{ 
                    color: isSelected ? '#fff' : theme.colors.primary,
                    fontWeight: isSelected ? '600' : 'normal'
                  }}>
                    {typeName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Every</Text>
          <View style={styles.numberPickerContainer}>
            <TouchableOpacity 
              style={[styles.numberButton, { borderColor: theme.colors.border }]}
              onPress={() => recurrenceInterval > 1 && setRecurrenceInterval(recurrenceInterval - 1)}
            >
              <Text style={{ color: theme.colors.text }}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.numberValue, { color: theme.colors.text }]}>
              {recurrenceInterval}
            </Text>
            <TouchableOpacity 
              style={[styles.numberButton, { borderColor: theme.colors.border }]}
              onPress={() => setRecurrenceInterval(recurrenceInterval + 1)}
            >
              <Text style={{ color: theme.colors.text }}>+</Text>
            </TouchableOpacity>
            <Text style={[styles.numberLabel, { color: theme.colors.text }]}>
              {recurrenceType === RecurrenceType.DAILY ? 'days' : 
               recurrenceType === RecurrenceType.WEEKLY ? 'weeks' : 'months'}
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: 'transparent' }]}
              onPress={() => setShowRecurrenceModal(false)}
            >
              <Text style={{ color: theme.colors.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowRecurrenceModal(false)}
            >
              <Text style={{ color: '#fff' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDurationPicker = () => (
    <Modal
      visible={showDurationPicker}
      onRequestClose={() => setShowDurationPicker(false)}
      transparent={true}
      animationType="slide"
    >
      <View style={[styles.modalOverlay]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Set Duration
          </Text>
          
          <View style={styles.durationPickerContainer}>
            {[30, 60, 90, 120].map(mins => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.durationOption,
                  { 
                    backgroundColor: duration === mins ? theme.colors.primary : 'transparent',
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={() => setDuration(mins)}
              >
                <Text style={{ 
                  color: duration === mins ? '#fff' : theme.colors.text,
                  fontWeight: duration === mins ? '600' : 'normal'
                }}>
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Custom Duration</Text>
          <View style={styles.numberPickerContainer}>
            <TouchableOpacity 
              style={[styles.numberButton, { borderColor: theme.colors.border }]}
              onPress={() => duration > 15 && setDuration(duration - 15)}
            >
              <Text style={{ color: theme.colors.text }}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.numberValue, { color: theme.colors.text }]}>
              {duration}
            </Text>
            <TouchableOpacity 
              style={[styles.numberButton, { borderColor: theme.colors.border }]}
              onPress={() => setDuration(duration + 15)}
            >
              <Text style={{ color: theme.colors.text }}>+</Text>
            </TouchableOpacity>
            <Text style={[styles.numberLabel, { color: theme.colors.text }]}>minutes</Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowDurationPicker(false)}
            >
              <Text style={{ color: '#fff' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Task Title*</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
            style={[
              styles.input,
              { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }
            ]}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description"
            placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[
              styles.input,
              styles.textarea,
              { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }
            ]}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Priority</Text>
          <View style={styles.optionsContainer}>
            {Object.values(Priority).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.optionButton,
                  { 
                    backgroundColor: priority === p ? 
                      getPriorityColor(p) : 
                      theme.isDark ? '#2c2c2e' : '#f8f9fa',
                    borderColor: getPriorityColor(p)
                  }
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: priority === p ? '#fff' : getPriorityColor(p) }
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Status</Text>
          <View style={styles.optionsContainer}>
            {Object.values(TaskStatus).map((s) => {
              const statusLabel = s === 'in-progress' ? 'In Progress' : 
                s.charAt(0).toUpperCase() + s.slice(1);
                
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.optionButton,
                    { 
                      backgroundColor: status === s ? 
                        theme.colors.primary : 
                        theme.isDark ? '#2c2c2e' : '#f8f9fa',
                      borderColor: theme.colors.primary
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: status === s ? '#fff' : theme.colors.primary }
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Tags</Text>
          
          <View style={styles.tagInputContainer}>
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tags..."
              placeholderTextColor={theme.isDark ? '#777' : '#aaa'}
              style={[
                styles.tagInput,
                { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }
              ]}
              returnKeyType="done"
              onSubmitEditing={addTag}
            />
            <TouchableOpacity 
              style={[styles.addTagButton, { backgroundColor: theme.colors.primary }]}
              onPress={addTag}
              disabled={!newTag.trim()}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <View 
                  key={tag} 
                  style={[
                    styles.tagChip,
                    { backgroundColor: theme.colors.primary }
                  ]}
                >
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Deadline</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.datePickerButton,
              { 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              }
            ]}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {deadline ? format(deadline, 'MMM dd, yyyy') : 'Set deadline'}
            </Text>
          </TouchableOpacity>
          
          {deadline && (
            <TouchableOpacity
              onPress={() => setDeadline(undefined)}
              style={styles.clearDateButton}
            >
              <Text style={{ color: theme.colors.error }}>
                Clear deadline
              </Text>
            </TouchableOpacity>
          )}
          
          {showDatePicker && (
            <DateTimePicker
              value={deadline || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <View style={styles.toggleRow}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Time-specific task</Text>
            <Switch
              value={hasTimeSpecific}
              onValueChange={setHasTimeSpecific}
              trackColor={{ false: '#ccc', true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
          
          {hasTimeSpecific && (
            <>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={[
                  styles.datePickerButton,
                  { 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    marginTop: 8
                  }
                ]}
              >
                <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  {startTime ? format(startTime, 'h:mm a') : 'Set start time'}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
              
              <TouchableOpacity
                onPress={() => setShowDurationPicker(true)}
                style={[
                  styles.datePickerButton,
                  { 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    marginTop: 8
                  }
                ]}
              >
                <Ionicons name="hourglass-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.dateText, { color: theme.colors.text }]}>
                  Duration: {duration} minutes
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <View style={styles.formGroup}>
          <View style={styles.toggleRow}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Recurring task</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: '#ccc', true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
          
          {isRecurring && (
            <TouchableOpacity
              onPress={() => setShowRecurrenceModal(true)}
              style={[
                styles.datePickerButton,
                { 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  marginTop: 8
                }
              ]}
            >
              <Ionicons name="repeat-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.dateText, { color: theme.colors.text }]}>
                {recurrenceType === RecurrenceType.NONE ? 'Set recurrence' : 
                 `${recurrenceType.charAt(0).toUpperCase() + recurrenceType.slice(1)}, every ${recurrenceInterval} ${recurrenceInterval > 1 ? recurrenceType + 's' : recurrenceType}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {renderRecurrenceOptions()}
        {renderDurationPicker()}
      </ScrollView>
      
      <View style={styles.footer}>
        <AnimatedButton
          title={initialValues?.id ? "Update Task" : "Create Task"}
          onPress={handleSubmit}
          disabled={!title.trim()}
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textarea: {
    height: 120,
    paddingVertical: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  optionText: {
    fontWeight: '500',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    width: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    color: '#fff',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  recurrenceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  recurrenceOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  numberPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  numberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  numberValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  numberLabel: {
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  durationPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  durationOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
});

export default TaskForm;
