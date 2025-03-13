import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Request camera permissions
 * @returns Promise resolving to whether permission was granted
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }
  return true;
};

/**
 * Request media library permissions
 * @returns Promise resolving to whether permission was granted
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }
  return true;
};

/**
 * Take a photo with camera
 * @returns Promise with ImagePicker result
 */
export const takePhotoWithCamera = async (options = {}): Promise<ImagePicker.ImagePickerResult> => {
  const hasPermission = await requestCameraPermission();
  
  if (!hasPermission) {
    throw new Error('Camera permission not granted');
  }
  
  return ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    ...options
  });
};

/**
 * Pick an image from media library
 * @returns Promise with ImagePicker result
 */
export const pickImageFromLibrary = async (options = {}): Promise<ImagePicker.ImagePickerResult> => {
  const hasPermission = await requestMediaLibraryPermission();
  
  if (!hasPermission) {
    throw new Error('Media library permission not granted');
  }
  
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    ...options
  });
};
