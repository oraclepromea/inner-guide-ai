import type { ValidationResult, AppError, JournalEntry, MoodEntry } from '../types';

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Date formatting utilities
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

// Format date for display
export const formatDisplayDate = (date: Date | string): string => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  return targetDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Text analysis utilities
export const getWordCount = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const getReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  const wordCount = getWordCount(text);
  return Math.ceil(wordCount / wordsPerMinute);
};

export const extractKeywords = (text: string, maxKeywords: number = 10): string[] => {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
};

// Moon phase calculations
export const getMoonPhase = (date: Date = new Date()): {
  phase: string;
  illumination: number;
  emoji: string;
  description: string;
} => {
  // Julian day calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let a = Math.floor((14 - month) / 12);
  let y = year - a;
  let m = month + 12 * a - 3;
  
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  // Moon phase calculation
  let daysSinceNewMoon = ((jd - 2451549.5) / 29.53058867) % 1;
  if (daysSinceNewMoon < 0) daysSinceNewMoon += 1;
  
  const illumination = Math.round((1 - Math.cos(daysSinceNewMoon * 2 * Math.PI)) * 50);
  
  // Determine phase
  let phase: string;
  let emoji: string;
  let description: string;
  
  if (daysSinceNewMoon < 0.0625 || daysSinceNewMoon >= 0.9375) {
    phase = 'new';
    emoji = '🌑';
    description = 'New Moon - Time for new beginnings and setting intentions';
  } else if (daysSinceNewMoon < 0.1875) {
    phase = 'waxing-crescent';
    emoji = '🌒';
    description = 'Waxing Crescent - Growth and building energy';
  } else if (daysSinceNewMoon < 0.3125) {
    phase = 'first-quarter';
    emoji = '🌓';
    description = 'First Quarter - Time for decision making and taking action';
  } else if (daysSinceNewMoon < 0.4375) {
    phase = 'waxing-gibbous';
    emoji = '🌔';
    description = 'Waxing Gibbous - Refinement and adjustment period';
  } else if (daysSinceNewMoon < 0.5625) {
    phase = 'full';
    emoji = '🌕';
    description = 'Full Moon - Peak energy, completion, and release';
  } else if (daysSinceNewMoon < 0.6875) {
    phase = 'waning-gibbous';
    emoji = '🌖';
    description = 'Waning Gibbous - Gratitude and sharing wisdom';
  } else if (daysSinceNewMoon < 0.8125) {
    phase = 'last-quarter';
    emoji = '🌗';
    description = 'Last Quarter - Letting go and forgiveness';
  } else {
    phase = 'waning-crescent';
    emoji = '🌘';
    description = 'Waning Crescent - Rest and reflection';
  }
  
  return { phase, illumination, emoji, description };
};

// Location utilities
export const getCurrentLocation = (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  country?: string;
  flag: string;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          // Attempt reverse geocoding with a simple approach
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            resolve({
              latitude,
              longitude,
              accuracy,
              city: data.city || data.locality,
              country: data.countryName,
              flag: getCountryFlag(data.countryCode || 'US')
            });
          } else {
            resolve({ latitude, longitude, accuracy, flag: '🌍' });
          }
        } catch {
          // If reverse geocoding fails, just return coordinates
          resolve({ latitude, longitude, accuracy, flag: '🌍' });
        }
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

// Helper function to get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  const flagMap: Record<string, string> = {
    'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'SP': '🇪🇸', 'JP': '🇯🇵', 'KR': '🇰🇷',
    'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽', 'RU': '🇷🇺'
  };
  return flagMap[countryCode.toUpperCase()] || '🌍';
};

export const getLocationInfo = async (): Promise<{ city: string; country: string; flag: string }> => {
  try {
    // In a real app, you'd use a geocoding service
    // This is a mock implementation
    const mockLocations = [
      { city: 'New York', country: 'United States', flag: '🇺🇸' },
      { city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
      { city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
      { city: 'Paris', country: 'France', flag: '🇫🇷' },
      { city: 'Sydney', country: 'Australia', flag: '🇦🇺' }
    ];
    
    return mockLocations[Math.floor(Math.random() * mockLocations.length)];
  } catch (error) {
    return { city: 'Unknown', country: 'Unknown', flag: '🌍' };
  }
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateJournalEntry = (entry: Partial<JournalEntry>): ValidationResult => {
  const errors: Array<{ field: string; message: string; code?: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];
  
  if (!entry.content || entry.content.trim().length === 0) {
    errors.push({ field: 'content', message: 'Content is required', code: 'REQUIRED' });
  }
  
  if (entry.content && entry.content.length > 10000) {
    errors.push({ field: 'content', message: 'Content must be less than 10,000 characters', code: 'MAX_LENGTH' });
  }
  
  if (entry.mood && (entry.mood < 1 || entry.mood > 5)) {
    errors.push({ field: 'mood', message: 'Mood must be between 1 and 5', code: 'INVALID_RANGE' });
  }
  
  if (entry.tags && entry.tags.some(tag => tag.length > 50)) {
    errors.push({ field: 'tags', message: 'Tags must be less than 50 characters each', code: 'TAG_TOO_LONG' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateMoodEntry = (entry: Partial<MoodEntry>): ValidationResult => {
  const errors: Array<{ field: string; message: string; code?: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];
  
  if (!entry.mood || entry.mood < 1 || entry.mood > 5) {
    errors.push({ field: 'mood', message: 'Mood rating between 1 and 5 is required', code: 'REQUIRED' });
  }
  
  if (entry.notes && entry.notes.length > 1000) {
    errors.push({ field: 'notes', message: 'Notes must be less than 1,000 characters', code: 'MAX_LENGTH' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Data transformation utilities
export const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+="[^"]*"/gi, '');
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// Color utilities for mood visualization
export const getMoodColor = (mood: number): { bg: string; border: string; text: string } => {
  const colors = {
    1: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300' },
    2: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300' },
    3: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
    4: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
    5: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300' }
  };
  return colors[mood as keyof typeof colors] || colors[3];
};

export const getMoodEmoji = (mood: number): string => {
  const emojis = {
    1: '😢',
    2: '😔',
    3: '😐',
    4: '😊',
    5: '😄'
  };
  return emojis[mood as keyof typeof emojis] || '😐';
};

export const getMoodLabel = (mood: number): string => {
  const labels = {
    1: 'Very Sad',
    2: 'Sad',
    3: 'Neutral',
    4: 'Happy',
    5: 'Very Happy'
  };
  return labels[mood as keyof typeof labels] || 'Neutral';
};

// Error handling utilities
export const createAppError = (code: string, message: string, details?: any): AppError => {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
};

export const handleAsyncError = <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<T | null> => {
  return operation().catch((error) => {
    console.error(errorMessage, error);
    return null;
  });
};

// Storage utilities
export const clearAllData = async (): Promise<void> => {
  try {
    // This would be implemented with the database service
    localStorage.clear();
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Failed to clear data:', error);
    throw createAppError('CLEAR_DATA_FAILED', 'Failed to clear all data', error);
  }
};

// Data export/import utilities
export const exportToJSON = (data: any): string => {
  return JSON.stringify(data, null, 2);
};

export const importFromJSON = <T>(jsonString: string): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw createAppError('INVALID_JSON', 'Invalid JSON format', error);
  }
};

// Theme utilities
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: 'light' | 'dark' | 'system'): void => {
  const actualTheme = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', actualTheme === 'dark');
};

// Chart data utilities
export const prepareChartData = (moodEntries: any[]): any[] => {
  return moodEntries.map(entry => ({
    date: entry.date,
    mood: entry.mood,
    label: getMoodLabel(entry.mood)
  }));
};

// Date range utilities
export const getDateRange = (period: 'week' | 'month' | 'year' | 'all'): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2020); // Set to a very early date
      break;
  }
  
  return { start, end };
};