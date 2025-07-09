import { create } from 'zustand';
import type { 
  JournalEntry, 
  MoodEntry, 
  AppSettings, 
  UserPreferences, 
  NotificationState,
  AnalyticsData,
  Achievement,
  LocationData
} from '../types';
import { db } from '../lib/database';
import { getCurrentLocation, getMoonPhase, formatDate, formatTime } from '../utils';

// Removed unused interfaces and cleaned up imports

interface ExportData {
  journalEntries: JournalEntry[];
  moodEntries: MoodEntry[];
  settings: AppSettings;
  preferences: UserPreferences;
  analytics: AnalyticsData;
  exportedAt: string;
  version: string;
}

interface AppState {
  // Journal state
  journalEntries: JournalEntry[];
  isLoadingJournal: boolean;
  selectedEntry: JournalEntry | null;
  
  // Mood state
  moodEntries: MoodEntry[];
  isLoadingMood: boolean;
  
  // App settings
  settings: AppSettings;
  userPreferences: UserPreferences;
  
  // UI state
  activeTab: string;
  isAnalyzing: boolean;
  
  // Notifications
  notifications: NotificationState[];
  
  // Achievements
  achievements: Achievement[];
  
  // Analytics
  analyticsData: AnalyticsData | null;
  
  // Streaks
  journalStreak: number;
  moodStreak: number;
  
  // Actions
  initializeApp: () => Promise<void>;
  loadJournalEntries: () => Promise<void>;
  addJournalEntry: (content: string, entryData?: any) => Promise<void>;
  updateJournalEntry: (id: number, updates: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: number) => Promise<void>;
  
  loadMoodEntries: () => Promise<void>;
  addMoodEntry: (mood: number, moodLabel: string, notes?: string) => Promise<void>;
  updateMoodEntry: (id: number, updates: Partial<MoodEntry>) => Promise<void>;
  deleteMoodEntry: (id: number) => Promise<void>;
  
  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateUserPreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  
  // Notification actions
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Analytics actions
  getAnalytics: () => AnalyticsData;
  
  // UI actions
  setActiveTab: (tab: string) => void;
  setSelectedEntry: (entry: JournalEntry | null) => void;
  
  // Data management
  exportAllData: () => Promise<void>;
  importData: (data: ExportData) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  notifications: true,
  exportFormat: 'json',
  dataRetentionDays: 365,
  autoBackup: false,
  encryptData: false,
  language: 'en',
  timezone: 'UTC',
  privacyMode: false,
  analyticsEnabled: true,
  autoSave: true,
  enableLocation: true,
  reminderEnabled: false
};

const defaultUserPreferences: UserPreferences = {
  reminderTime: '09:00',
  journalPrompts: [],
  moodTriggers: [],
  goals: [],
  favoriteQuotes: [],
  customTags: [],
  writingTargets: {
    dailyWordCount: 250,
    weeklyEntries: 5,
    monthlyGoals: []
  },
  onboardingCompleted: false,
  lastActiveDate: new Date().toISOString(),
  dateFormat: 'MM/DD/YYYY'
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  journalEntries: [],
  isLoadingJournal: false,
  selectedEntry: null,
  
  moodEntries: [],
  isLoadingMood: false,
  
  settings: defaultSettings,
  userPreferences: defaultUserPreferences,
  
  activeTab: 'journal',
  isAnalyzing: false,
  
  notifications: [],
  achievements: [],
  analyticsData: null,
  
  journalStreak: 0,
  moodStreak: 0,

  // Initialize app
  initializeApp: async () => {
    set({ isLoadingJournal: true, isLoadingMood: true });
    
    try {
      await Promise.all([
        get().loadJournalEntries(),
        get().loadMoodEntries()
      ]);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      get().addNotification({
        type: 'error',
        title: 'App Error',
        message: 'Failed to load app data'
      });
    } finally {
      set({ isLoadingJournal: false, isLoadingMood: false });
    }
  },
  
  // Journal actions
  loadJournalEntries: async () => {
    set({ isLoadingJournal: true });
    try {
      const entries = await db.journalEntries.orderBy('createdAt').reverse().toArray();
      set({ journalEntries: entries });
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      get().addNotification({
        type: 'error',
        title: 'Loading Error',
        message: 'Failed to load journal entries.'
      });
    } finally {
      set({ isLoadingJournal: false });
    }
  },
  
  addJournalEntry: async (content: string, entryData?: any) => {
    try {
      const now = new Date();
      
      // Use custom date/time if provided, otherwise use current
      let entryDateTime = now;
      if (entryData?.date && entryData?.time) {
        const dateTimeString = `${entryData.date}T${entryData.time}:00`;
        entryDateTime = new Date(dateTimeString);
      }
      
      // Get location from entryData or fallback to geolocation
      let location: LocationData | undefined = undefined;
      if (entryData?.city && entryData?.country) {
        location = {
          city: entryData.city,
          country: entryData.country,
          flag: entryData.flag || '🌍',
          coordinates: undefined
        };
      } else if (get().settings.enableLocation) {
        try {
          const locationData = await getCurrentLocation();
          if (locationData.city && locationData.country) {
            location = {
              city: locationData.city,
              country: locationData.country,
              flag: locationData.flag,
              coordinates: {
                lat: locationData.latitude,
                lng: locationData.longitude
              }
            };
          }
        } catch (error) {
          console.log('Location detection failed:', error);
          // Continue without location
        }
      }
      
      const moonPhase = getMoonPhase(entryDateTime);
      
      const entry: JournalEntry = {
        content,
        date: formatDate(entryDateTime),
        time: formatTime(entryDateTime),
        location,
        moonPhase,
        tags: entryData?.tags || [],
        mood: entryData?.mood,
        createdAt: entryDateTime.toISOString(),
        updatedAt: entryDateTime.toISOString(),
        wordCount: content.split(' ').length,
        readingTime: Math.ceil(content.split(' ').length / 200)
      };
      
      const id = await db.journalEntries.add(entry);
      const newEntry = { ...entry, id };
      
      set(state => ({
        journalEntries: [newEntry, ...state.journalEntries]
      }));
      
      // Add success notification
      get().addNotification({
        type: 'success',
        title: 'Entry Added',
        message: 'Your journal entry has been saved successfully!'
      });
      
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save your journal entry. Please try again.'
      });
    }
  },
  
  updateJournalEntry: async (id: number, updates: Partial<JournalEntry>) => {
    try {
      const updatedEntry = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await db.journalEntries.update(id, updatedEntry);
      
      set(state => ({
        journalEntries: state.journalEntries.map(entry => 
          entry.id === id ? { ...entry, ...updatedEntry } : entry
        )
      }));
    } catch (error) {
      console.error('Failed to update journal entry:', error);
    }
  },
  
  deleteJournalEntry: async (id: number) => {
    try {
      await db.journalEntries.delete(id);
      
      set(state => ({
        journalEntries: state.journalEntries.filter(entry => entry.id !== id),
        selectedEntry: state.selectedEntry?.id === id ? null : state.selectedEntry
      }));
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    }
  },
  
  // Mood actions
  loadMoodEntries: async () => {
    set({ isLoadingMood: true });
    try {
      const entries = await db.moodEntries.orderBy('date').reverse().toArray();
      set({ moodEntries: entries });
    } catch (error) {
      console.error('Failed to load mood entries:', error);
      get().addNotification({
        type: 'error',
        title: 'Loading Error',
        message: 'Failed to load mood entries.'
      });
    } finally {
      set({ isLoadingMood: false });
    }
  },
  
  addMoodEntry: async (mood: number, moodLabel: string, notes?: string) => {
    try {
      const now = new Date();
      const entry: MoodEntry = {
        date: formatDate(now),
        mood,
        moodLabel,
        notes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      const id = await db.moodEntries.add(entry);
      const newEntry = { ...entry, id };
      
      set(state => ({
        moodEntries: [newEntry, ...state.moodEntries]
      }));
      
      // Add success notification
      get().addNotification({
        type: 'success',
        title: 'Mood Logged',
        message: `Mood "${moodLabel}" has been recorded!`
      });
      
    } catch (error) {
      console.error('Failed to add mood entry:', error);
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save your mood entry. Please try again.'
      });
    }
  },
  
  updateMoodEntry: async (id: number, updates: Partial<MoodEntry>) => {
    try {
      const updatedEntry = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await db.moodEntries.update(id, updatedEntry);
      
      set(state => ({
        moodEntries: state.moodEntries.map(entry => 
          entry.id === id ? { ...entry, ...updatedEntry } : entry
        )
      }));
    } catch (error) {
      console.error('Failed to update mood entry:', error);
    }
  },
  
  deleteMoodEntry: async (id: number) => {
    try {
      await db.moodEntries.delete(id);
      
      set(state => ({
        moodEntries: state.moodEntries.filter(entry => entry.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete mood entry:', error);
    }
  },
  
  // Settings actions
  updateSettings: async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...get().settings, ...updates };
      set({ settings: newSettings });
      
      // Save to database
      await db.settings.clear();
      await db.settings.add(newSettings);
      
      get().addNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Your settings have been saved successfully!'
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      get().addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save settings. Please try again.'
      });
    }
  },

  updateUserPreferences: async (updates: Partial<UserPreferences>) => {
    try {
      const newPreferences = { ...get().userPreferences, ...updates };
      set({ userPreferences: newPreferences });
      
      // Save to database
      await db.userPreferences.clear();
      await db.userPreferences.add(newPreferences);
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  },

  // Notification actions
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationState = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    set(state => ({
      notifications: [newNotification, ...state.notifications]
    }));
    
    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        get().removeNotification(newNotification.id);
      }, notification.duration);
    }
  },

  markNotificationAsRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    }));
  },

  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(notif => notif.id !== id)
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // Analytics computation
  getAnalytics: () => {
    const journalEntries = get().journalEntries;
    const moodEntries = get().moodEntries;
    
    const totalEntries = journalEntries.length + moodEntries.length;

    // Generate mock analytics data
    const writingPatterns = {
      wordCount: {
        average: journalEntries.length > 0 
          ? journalEntries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0) / journalEntries.length 
          : 0,
        trend: 'stable' as const,
        history: journalEntries.map(entry => ({
          date: entry.date,
          count: entry.wordCount || 0
        }))
      },
      frequency: {
        entriesPerWeek: totalEntries / 4, // Rough estimate
        streak: get().journalStreak,
        longestStreak: get().journalStreak
      },
      themes: [
        { theme: 'personal growth', count: 5, trend: 'increasing' },
        { theme: 'work stress', count: 3, trend: 'stable' }
      ]
    };

    const insights = {
      correlations: [],
      recommendations: [
        'Try writing in the morning for better consistency',
        'Consider adding more detail to shorter entries'
      ],
      achievements: []
    };

    return {
      moodTrends: {
        daily: moodEntries.map(entry => ({ date: entry.date, mood: entry.mood })),
        weekly: [],
        monthly: []
      },
      writingPatterns,
      insights
    } as AnalyticsData;
  },

  // UI actions
  setActiveTab: (tab: string) => {
    set({ activeTab: tab });
  },

  setSelectedEntry: (entry: JournalEntry | null) => {
    set({ selectedEntry: entry });
  },
  
  // Data management
  exportAllData: async () => {
    const { journalEntries, moodEntries, settings, userPreferences } = get();
    const analyticsData = get().getAnalytics();
    
    const exportData = {
      journalEntries,
      moodEntries,
      settings,
      preferences: userPreferences,
      analytics: analyticsData,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inner-guide-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: async (data: ExportData) => {
    try {
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      const { journalEntries = [], moodEntries = [], settings: importedSettings, preferences } = data;
      
      // Clear existing data
      await db.journalEntries.clear();
      await db.moodEntries.clear();
      
      // Import journal entries
      if (Array.isArray(journalEntries)) {
        await db.journalEntries.bulkAdd(journalEntries);
      }
      
      // Import mood entries
      if (Array.isArray(moodEntries)) {
        await db.moodEntries.bulkAdd(moodEntries);
      }
      
      // Import settings
      if (importedSettings) {
        await db.settings.clear();
        await db.settings.add(importedSettings);
        set({ settings: importedSettings });
      }
      
      // Import preferences
      if (preferences) {
        await db.userPreferences.clear();
        await db.userPreferences.add(preferences);
        set({ userPreferences: preferences });
      }
      
      // Refresh state
      await get().loadJournalEntries();
      await get().loadMoodEntries();
      
      get().addNotification({
        type: 'success',
        title: 'Import Successful',
        message: 'Your data has been successfully imported.'
      });
    } catch (error) {
      console.error('Import failed:', error);
      get().addNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'There was an error importing your data. Please check the file format.'
      });
      throw error;
    }
  },

  clearAllData: async () => {
    try {
      await db.journalEntries.clear();
      await db.moodEntries.clear();
      await db.settings.clear();
      await db.userPreferences.clear();
      
      set({
        journalEntries: [],
        moodEntries: [],
        settings: defaultSettings,
        userPreferences: defaultUserPreferences,
        achievements: [],
        analyticsData: null,
        journalStreak: 0,
        moodStreak: 0
      });
      
      get().addNotification({
        type: 'success',
        title: 'Data Cleared',
        message: 'All data has been cleared successfully!'
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      get().addNotification({
        type: 'error',
        title: 'Clear Failed',
        message: 'Failed to clear data. Please try again.'
      });
    }
  }
}));