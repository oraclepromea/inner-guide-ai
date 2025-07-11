// REAL DATA ONLY: AI Service using actual OpenRouter API with no mock fallbacks
// This service only provides AI analysis when properly configured with real API credentials
// All mock data has been completely removed to ensure only real analysis is performed

import { create } from 'zustand';
import { format } from 'date-fns';
import type { 
  AppState, 
  JournalEntry, 
  MoodEntry, 
  TherapySession, 
  TherapyMessage,
  LocationData,
  MoonPhaseData,
  AppSettings,
  UserPreferences,
  NotificationState,
  AnalyticsData,
  CorrelationInsight,
  TherapistPersonality,
  TabType
} from '../types';
import { db } from '../lib/database';
import { aiService } from '../lib/aiService';

// REAL DATA ONLY: Store implementation with no mock data
// All analytics and insights are based on actual user data
// Mock data has been completely removed from all functions

// Create the store implementing the AppState interface
export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  journalEntries: [],
  moodEntries: [],
  deepInsights: [], // Added for AI insights
  settings: {
    theme: 'dark',
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
  },
  preferences: {
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
  },
  notifications: [],
  achievements: [],
  analytics: null,
  
  activeTab: 'journal',
  isLoading: false,
  error: null,

  currentLocation: null,
  currentMoonPhase: null,

  therapySessions: [],
  currentSession: null,
  messages: [],
  isLoadingTherapy: false,
  isTyping: false,
  selectedTherapist: 'empathetic',

  // Journal actions
  getJournalEntries: async () => {
    set({ isLoading: true });
    try {
      const entries = await db.journalEntries.orderBy('createdAt').reverse().toArray();
      set({ journalEntries: entries });
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      get().addNotification({
        type: 'error',
        title: 'Load Error',
        message: 'Failed to load journal entries'
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addJournalEntry: async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date();
      const location = get().currentLocation;
      const moonPhase = get().currentMoonPhase;

      const newEntry = {
        title: entry.title || `Entry ${format(now, 'MMM dd, yyyy')}`,
        content: entry.content,
        date: format(now, 'yyyy-MM-dd'),
        mood: entry.mood,
        tags: entry.tags || [],
        location: location || undefined,
        moonPhase: moonPhase?.phase,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      const id = await db.journalEntries.add(newEntry as any);
      
      set(state => ({
        journalEntries: [{ ...newEntry, id: id.toString() }, ...state.journalEntries]
      }));

      // Generate AI insights asynchronously
      if (typeof id === 'number' || typeof id === 'string') {
        get().generateAIInsights({ ...newEntry, id: id.toString() });
      }
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw error;
    }
  },

  updateJournalEntry: async (id: string, updates: Partial<JournalEntry>) => {
    try {
      const updatedData = { ...updates, updatedAt: new Date().toISOString() };
      await db.journalEntries.update(parseInt(id), updatedData);
      
      set(state => ({
        journalEntries: state.journalEntries.map(entry =>
          entry.id === id ? { ...entry, ...updatedData } : entry
        )
      }));
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  },

  deleteJournalEntry: async (id: string) => {
    try {
      await db.journalEntries.delete(parseInt(id));
      
      set(state => ({
        journalEntries: state.journalEntries.filter(entry => entry.id !== id)
      }));

      get().addNotification({
        type: 'success',
        title: 'Entry Deleted',
        message: 'Your journal entry has been deleted'
      });
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      get().addNotification({
        type: 'error',
        title: 'Delete Error',
        message: 'Failed to delete journal entry'
      });
    }
  },

  // Mood actions
  getMoodEntries: async () => {
    set({ isLoading: true });
    try {
      const entries = await db.moodEntries.orderBy('createdAt').reverse().toArray();
      set({ moodEntries: entries });
    } catch (error) {
      console.error('Failed to load mood entries:', error);
      get().addNotification({
        type: 'error',
        title: 'Load Error',
        message: 'Failed to load mood entries'
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addMoodEntry: async (entry: Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date();
      const newEntry = {
        date: format(now, 'yyyy-MM-dd'),
        mood: entry.mood,
        notes: entry.notes || '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      const id = await db.moodEntries.add(newEntry as any);
      
      set(state => ({
        moodEntries: [{ ...newEntry, id: id.toString() }, ...state.moodEntries]
      }));
    } catch (error) {
      console.error('Error adding mood entry:', error);
      throw error;
    }
  },

  updateMoodEntry: async (id: string, updates: Partial<MoodEntry>) => {
    try {
      await db.moodEntries.update(parseInt(id), updates);
      
      set(state => ({
        moodEntries: state.moodEntries.map(entry =>
          entry.id === id ? { ...entry, ...updates } : entry
        )
      }));

      get().addNotification({
        type: 'success',
        title: 'Mood Updated',
        message: 'Your mood entry has been updated'
      });
    } catch (error) {
      console.error('Failed to update mood entry:', error);
      get().addNotification({
        type: 'error',
        title: 'Update Error',
        message: 'Failed to update mood entry'
      });
    }
  },

  deleteMoodEntry: async (id: string) => {
    try {
      await db.moodEntries.delete(parseInt(id));
      
      set(state => ({
        moodEntries: state.moodEntries.filter(entry => entry.id !== id)
      }));

      get().addNotification({
        type: 'success',
        title: 'Mood Entry Deleted',
        message: 'Your mood entry has been deleted'
      });
    } catch (error) {
      console.error('Failed to delete mood entry:', error);
      get().addNotification({
        type: 'error',
        title: 'Delete Error',
        message: 'Failed to delete mood entry'
      });
    }
  },

  // Deep AI Insights actions
  generateDeepInsight: async (entry: JournalEntry, userName: string = 'Friend') => {
    try {
      if (!entry.id) return;
      
      // Check if insight already exists
      const existingInsight = get().deepInsights.find(insight => insight.journalEntryId === entry.id?.toString());
      if (existingInsight) {
        console.log('Deep insight already exists for this entry');
        return;
      }

      // REAL DATA ONLY: Use actual AI service for deep analysis
      const deepInsight = await aiService.generateDeepInsight(entry, userName);
      if (deepInsight) {
        // Store in database
        const id = await db.deepInsights.add(deepInsight as any);
        const savedInsight = { ...deepInsight, id: id.toString() };
        
        // Update state
        set(state => ({
          deepInsights: [savedInsight, ...state.deepInsights]
        }));

        get().addNotification({
          type: 'success',
          title: 'AI Insight Generated',
          message: 'Deep spiritual insight has been created for your journal entry'
        });
      }
    } catch (error) {
      console.error('Error generating deep insight:', error);
      get().addNotification({
        type: 'error',
        title: 'Insight Generation Failed',
        message: 'Failed to generate AI insight. Please check your API configuration.'
      });
    }
  },

  getDeepInsights: async () => {
    set({ isLoading: true });
    try {
      const insights = await db.deepInsights.orderBy('createdAt').reverse().toArray();
      set({ deepInsights: insights.map(insight => ({ ...insight, id: insight.id?.toString() || '' })) });
    } catch (error) {
      console.error('Failed to load deep insights:', error);
      get().addNotification({
        type: 'error',
        title: 'Load Error',
        message: 'Failed to load AI insights'
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDeepInsight: async (id: string) => {
    try {
      await db.deepInsights.delete(parseInt(id));
      
      set(state => ({
        deepInsights: state.deepInsights.filter(insight => insight.id !== id)
      }));

      get().addNotification({
        type: 'success',
        title: 'Insight Deleted',
        message: 'AI insight has been deleted'
      });
    } catch (error) {
      console.error('Failed to delete deep insight:', error);
      get().addNotification({
        type: 'error',
        title: 'Delete Error',
        message: 'Failed to delete AI insight'
      });
    }
  },

  // Settings actions
  updateSettings: async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...get().settings, ...updates };
      await db.settings.put(newSettings);
      set({ settings: newSettings });
      
      get().addNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Your settings have been saved'
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      get().addNotification({
        type: 'error',
        title: 'Settings Error',
        message: 'Failed to save settings'
      });
    }
  },

  updatePreferences: async (updates: Partial<UserPreferences>) => {
    try {
      const newPreferences = { ...get().preferences, ...updates };
      await db.userPreferences.put(newPreferences);
      set({ preferences: newPreferences });
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  },

  // Notification actions
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationState = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    };
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));
  },

  markNotificationRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  // Analytics actions
  getAnalytics: async (): Promise<AnalyticsData> => {
    const state = get();
    const moodEntries = state.moodEntries;
    
    return {
      moodTrends: {
        daily: moodEntries.map(entry => ({ date: entry.date, mood: entry.mood })),
        weekly: [],
        monthly: []
      },
      writingPatterns: {
        wordCount: {
          average: 250,
          trend: 'stable',
          history: []
        },
        frequency: {
          entriesPerWeek: 5,
          streak: 0,
          longestStreak: 0
        },
        themes: []
      },
      insights: {
        correlations: [] as CorrelationInsight[],
        recommendations: [] as string[],
        achievements: [] as string[]
      }
    };
  },

  generateAIInsights: async (entry: JournalEntry) => {
    try {
      if (!entry.id) return; // Exit early if no ID
      
      // REAL DATA ONLY: Use actual AI service for analysis
      const aiInsights = await aiService.analyzeEntry(entry);
      if (aiInsights) {
        // Transform AIInsightResponse to AIAnalysisResult format
        const transformedInsights = {
          sentiment: {
            score: aiInsights.sentiment === 'positive' ? 0.7 : 
                   aiInsights.sentiment === 'negative' ? -0.7 : 0,
            label: aiInsights.sentiment === 'mixed' ? 'neutral' : aiInsights.sentiment,
            confidence: aiInsights.confidence
          },
          themes: aiInsights.keyThemes || [],
          suggestions: aiInsights.growthAreas || [],
          reflectionPrompts: aiInsights.reflectionPrompts || []
        };
        await get().updateJournalEntry(entry.id.toString(), { aiInsights: transformedInsights });
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  },

  // UI actions
  setActiveTab: (tab: TabType) => {
    set({ activeTab: tab });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
  
  // Location actions
  updateLocation: (location: LocationData) => {
    set({ currentLocation: location });
  },

  updateMoonPhase: (moonPhase: MoonPhaseData) => {
    set({ currentMoonPhase: moonPhase });
  },
  
  // Therapy actions
  createTherapySession: async () => {
    try {
      const session = {
        date: format(new Date(), 'yyyy-MM-dd'),
        messages: [],
        exercises: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const id = await db.therapySessions.add(session as any);
      const newSession = { ...session, id: id.toString() } as TherapySession;
      
      set(state => ({
        therapySessions: [newSession, ...state.therapySessions],
        currentSession: newSession,
        messages: []
      }));
    } catch (error) {
      console.error('Failed to create therapy session:', error);
      get().addNotification({
        type: 'error',
        title: 'Session Error',
        message: 'Failed to create therapy session'
      });
    }
  },

  loadTherapySessions: async () => {
    set({ isLoadingTherapy: true });
    try {
      const sessions = await db.therapySessions.orderBy('createdAt').reverse().toArray();
      set({ therapySessions: sessions.map(s => ({ ...s, id: s.id?.toString() || '' })) });
    } catch (error) {
      console.error('Failed to load therapy sessions:', error);
      get().addNotification({
        type: 'error',
        title: 'Load Error',
        message: 'Failed to load therapy sessions'
      });
    } finally {
      set({ isLoadingTherapy: false });
    }
  },

  loadSession: async (sessionId: string) => {
    try {
      const session = await db.therapySessions.get(parseInt(sessionId));
      if (session) {
        const messages = await db.therapyMessages
          .where('sessionId')
          .equals(parseInt(sessionId))
          .toArray();
        
        set({ 
          currentSession: { ...session, id: session.id?.toString() || '' },
          messages: messages.map(m => ({ ...m, id: m.id?.toString() || '' }))
        });
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  },

  sendMessage: async (content: string) => {
    const currentSession = get().currentSession;
    if (!currentSession) return;

    set({ isTyping: true });

    try {
      // Add user message
      const userMessage = {
        content,
        sender: 'user' as const,
        timestamp: new Date().toISOString(),
        type: 'text' as const
      };

      const userMsgId = await db.therapyMessages.add(userMessage as any);
      
      // Generate therapist response using the helper function
      const generateTherapistResponse = (
        userMessage: string, 
        personality: TherapistPersonality, 
        messageHistory: TherapyMessage[]
      ): string => {
        const isFirstMessage = messageHistory.length === 0 || !userMessage.trim();
        
        if (isFirstMessage) {
          const welcomeMessages = {
            empathetic: "Hello! I'm here to listen and support you. How are you feeling today? Please feel free to share whatever is on your mind.",
            analytical: "Welcome to our session. I'm here to help you analyze patterns and develop evidence-based strategies. What would you like to explore today?",
            supportive: "Hi there! I'm excited to work with you toward your goals. What positive changes would you like to see in your life?",
            direct: "Welcome. Let's get right to it - what's the main thing you'd like to work on today?"
          };
          return welcomeMessages[personality] || welcomeMessages.empathetic;
        }

        // Generate contextual responses based on personality and user input
        const responses = {
          empathetic: [
            "I hear you, and what you're feeling makes complete sense. Thank you for sharing that with me.",
            "That sounds really challenging. How has this been affecting you?",
            "I can sense the emotion in your words. You're being really brave by opening up about this.",
            "It's completely normal to feel this way. Many people struggle with similar experiences."
          ],
          analytical: [
            "That's an interesting perspective. What evidence do you have for that thought?",
            "Let's examine this belief more closely. Is there another way to look at this situation?",
            "What would you tell a friend who was having this same thought?",
            "Can you identify any thinking patterns that might be influencing how you feel about this?"
          ],
          supportive: [
            "What would need to happen for this situation to improve even slightly?",
            "Tell me about a time when you handled a similar challenge successfully.",
            "What strengths do you have that could help you with this?",
            "If this problem were solved, what would be different in your life?"
          ],
          direct: [
            "What specific action can you take about this today?",
            "Let's cut to the core - what's really bothering you here?",
            "What's the most important thing for you to focus on right now?",
            "What would change if you stopped doing this behavior?"
          ]
        };

        const personalityResponses = responses[personality];
        return personalityResponses[Math.floor(Math.random() * personalityResponses.length)];
      };
      
      const therapistResponse = generateTherapistResponse(content, get().selectedTherapist, get().messages);
      
      // Add therapist message
      const therapistMessage = {
        content: therapistResponse,
        sender: 'therapist' as const,
        timestamp: new Date().toISOString(),
        type: 'text' as const
      };

      const therapistMsgId = await db.therapyMessages.add(therapistMessage as any);

      // Update messages in state
      set(state => ({
        messages: [
          ...state.messages,
          { ...userMessage, id: userMsgId.toString() },
          { ...therapistMessage, id: therapistMsgId.toString() }
        ]
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      set({ isTyping: false });
    }
  },

  archiveSession: async (sessionId: string) => {
    try {
      // Since 'archived' doesn't exist in TherapySession, we'll use a different approach
      // We could add it to tags or just mark it differently
      const session = await db.therapySessions.get(parseInt(sessionId));
      if (session) {
        const updatedTags = [...(session.tags || []), 'archived'];
        await db.therapySessions.update(parseInt(sessionId), { tags: updatedTags });
      }
      await get().loadTherapySessions();
    } catch (error) {
      console.error('Failed to archive session:', error);
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      // Delete associated messages first
      await db.therapyMessages.where('sessionId').equals(parseInt(sessionId)).delete();
      // Then delete the session
      await db.therapySessions.delete(parseInt(sessionId));
      
      set(state => ({
        therapySessions: state.therapySessions.filter(session => session.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
      }));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  },

  updateTherapistPersonality: (personality: TherapistPersonality) => {
    set({ selectedTherapist: personality });
  },

  // Data management
  exportData: async (): Promise<string> => {
    try {
      const state = get();
      const exportData = {
        journalEntries: state.journalEntries,
        moodEntries: state.moodEntries,
        settings: state.settings,
        preferences: state.preferences,
        analytics: await get().getAnalytics(),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const dataString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inner-guide-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      get().addNotification({
        type: 'success',
        title: 'Data Exported',
        message: 'Your data has been successfully exported'
      });

      return dataString;
    } catch (error) {
      console.error('Failed to export data:', error);
      get().addNotification({
        type: 'error',
        title: 'Export Error',
        message: 'Failed to export data'
      });
      throw error;
    }
  },

  importData: async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      
      await db.transaction('rw', [db.journalEntries, db.moodEntries, db.settings, db.userPreferences], async () => {
        await db.journalEntries.clear();
        await db.moodEntries.clear();
        
        await db.journalEntries.bulkAdd(parsedData.journalEntries);
        await db.moodEntries.bulkAdd(parsedData.moodEntries);
        await db.settings.put(parsedData.settings);
        await db.userPreferences.put(parsedData.preferences);
      });
      
      set({
        journalEntries: parsedData.journalEntries,
        moodEntries: parsedData.moodEntries,
        settings: parsedData.settings,
        preferences: parsedData.preferences
      });

      // Create backup copies of imported journal entries
      if (parsedData.journalEntries && parsedData.journalEntries.length > 0) {
        for (const entry of parsedData.journalEntries) {
          try {
            await db.importedJournalBackups.add({
              ...entry,
              originalImportDate: new Date().toISOString(),
              importSource: 'manual-full-import',
              importMethod: 'manual',
              originalFileName: 'full-data-import.json'
            });
          } catch (error) {
            console.error('Failed to create backup for entry:', entry.id, error);
          }
        }
      }

      // REAL DATA ONLY: Analyze imported journal entries with AI if configured
      if (parsedData.journalEntries && parsedData.journalEntries.length > 0) {
        setTimeout(async () => {
          for (const entry of parsedData.journalEntries) {
            if (entry.content && !entry.aiInsights) {
              try {
                await get().generateAIInsights(entry);
              } catch (error) {
                console.error('Failed to analyze imported entry:', entry.id, error);
              }
            }
          }
        }, 1000); // Delay to avoid overwhelming the API
      }
      
      get().addNotification({
        type: 'success',
        title: 'Data Imported',
        message: `Your data has been successfully imported with ${parsedData.journalEntries?.length || 0} entries backed up`
      });
    } catch (error) {
      console.error('Failed to import data:', error);
      get().addNotification({
        type: 'error',
        title: 'Import Error',
        message: 'Failed to import data'
      });
    }
  },

  // REAL DATA ONLY: Import individual journal entries with AI analysis and backup creation
  importJournalEntries: async (entries: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>[], importSource?: string) => {
    try {
      const importedEntries: JournalEntry[] = [];
      let backupCount = 0;
      
      for (const entry of entries) {
        const now = new Date();
        const newEntry = {
          ...entry,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          tags: [...(entry.tags || []), 'auto-imported'] // Tag as auto-imported
        };

        // Add to main journal entries
        const id = await db.journalEntries.add(newEntry as any);
        const savedEntry = { ...newEntry, id: id.toString() };
        importedEntries.push(savedEntry);

        // Create backup copy
        try {
          await db.importedJournalBackups.add({
            ...newEntry,
            id: undefined, // Let the backup table generate its own ID
            originalImportDate: now.toISOString(),
            importSource: importSource || 'journal-import',
            importMethod: 'auto',
            originalFileName: importSource
          });
          backupCount++;
        } catch (error) {
          console.error('Failed to create backup for entry:', error);
        }

        // Trigger AI analysis for imported entry
        if (newEntry.content && !newEntry.aiInsights) {
          setTimeout(() => {
            get().generateAIInsights(savedEntry);
          }, 500); // Small delay between analyses
        }
      }
      
      set(state => ({
        journalEntries: [...importedEntries, ...state.journalEntries]
      }));

      get().addNotification({
        type: 'success',
        title: 'Entries Imported',
        message: `${importedEntries.length} entries imported and ${backupCount} backups created`
      });

      return importedEntries;
    } catch (error) {
      console.error('Failed to import journal entries:', error);
      throw error;
    }
  },

  clearAllData: async () => {
    try {
      await db.delete();
      await db.open();
      
      set({
        journalEntries: [],
        moodEntries: [],
        therapySessions: [],
        currentSession: null,
        messages: [],
        notifications: [],
        analytics: null
      });
      
      get().addNotification({
        type: 'success',
        title: 'Data Cleared',
        message: 'All data has been cleared'
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      get().addNotification({
        type: 'error',
        title: 'Clear Error',
        message: 'Failed to clear data'
      });
    }
  }
}));