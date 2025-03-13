import { 
  format, 
  parseISO, 
  isToday as dateFnsIsToday, 
  isPast as dateFnsIsPast,
  isTomorrow as dateFnsIsTomorrow,
  isYesterday as dateFnsIsYesterday
} from 'date-fns';

/**
 * Safely formats a date using the provided format string
 * @param date The date to format
 * @param formatStr The format string
 * @returns The formatted date string or empty string if invalid
 */
export const formatDate = (date: Date | string | undefined, formatStr: string): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Checks if the provided date is today
 */
export const isToday = (date: Date | string | undefined): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateFnsIsToday(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Checks if the provided date is in the past
 */
export const isPast = (date: Date | string | undefined): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateFnsIsPast(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Checks if the provided date is tomorrow
 */
export const isTomorrow = (date: Date | string | undefined): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateFnsIsTomorrow(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Checks if the provided date is yesterday
 */
export const isYesterday = (date: Date | string | undefined): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateFnsIsYesterday(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Gets a relative description of the date (Today, Tomorrow, Yesterday or formatted date)
 */
export const getRelativeDateDescription = (date: Date | string | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (isToday(dateObj)) return 'Today';
    if (isTomorrow(dateObj)) return 'Tomorrow';
    if (isYesterday(dateObj)) return 'Yesterday';
    
    return formatDate(dateObj, 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
};
