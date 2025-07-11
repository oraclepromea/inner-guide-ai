import Dexie, { type Table } from 'dexie';
import type { 
  JournalEntry, 
  MoodEntry, 
  AppSettings, 
  UserPreferences, 
  Achievement,
  TherapySession,
  TherapyMessage,
  PersonalGrowthProfile,
  TherapyGoal,
  ChatMessage
} from '../types';

// New interface for backup entries
export interface ImportedJournalBackup extends JournalEntry {
  originalImportDate: string;
  importSource: string;
  importMethod: 'manual' | 'auto';
  originalFileName?: string;
  checksum?: string;
}

export class InnerGuideDB extends Dexie {
  journalEntries!: Table<JournalEntry>;
  moodEntries!: Table<MoodEntry>;
  settings!: Table<AppSettings>;
  userPreferences!: Table<UserPreferences>;
  achievements!: Table<Achievement>;
  therapySessions!: Table<TherapySession>;
  therapyMessages!: Table<TherapyMessage>;
  personalGrowthProfile!: Table<PersonalGrowthProfile>;
  therapyGoals!: Table<TherapyGoal>;
  importedJournalBackups!: Table<ImportedJournalBackup>;

  constructor() {
    super('InnerGuideDB');
    this.version(4).stores({
      journalEntries: '++id, date, createdAt, updatedAt, tags',
      moodEntries: '++id, date, createdAt, updatedAt, mood',
      settings: '++id',
      userPreferences: '++id',
      achievements: '++id, type, unlockedAt',
      therapySessions: '++id, createdAt, updatedAt, therapistPersonality',
      therapyMessages: '++id, sessionId, sender, timestamp, type',
      personalGrowthProfile: '++userId, updatedAt',
      therapyGoals: '++id, category, targetDate, progress, createdAt',
      importedJournalBackups: '++id, originalImportDate, importSource, importMethod, date, createdAt, updatedAt, tags, checksum'
    });

    this.journalEntries.hook('creating', (_primKey: any, obj: any, _trans: any) => {
      const now = new Date().toISOString();
      obj.createdAt = now;
      obj.updatedAt = now;
      // Validate required fields
      if (!obj.content || obj.content.trim().length === 0) {
        throw new Error('Journal entry content cannot be empty');
      }
    });

    this.journalEntries.hook('updating', (modifications: any, _primKey: any, _obj: any, _trans: any) => {
      modifications.updatedAt = new Date().toISOString();
    });

    this.moodEntries.hook('creating', (_primKey: any, obj: any, _trans: any) => {
      const now = new Date().toISOString();
      obj.createdAt = now;
      obj.updatedAt = now;
      // Validate mood range
      if (obj.mood < 1 || obj.mood > 5) {
        throw new Error('Mood must be between 1 and 5');
      }
    });

    this.moodEntries.hook('updating', (modifications: any, _primKey: any, _obj: any, _trans: any) => {
      modifications.updatedAt = new Date().toISOString();
    });

    // Add therapy-related hooks
    this.therapySessions.hook('creating', (_primKey: any, obj: any, _trans: any) => {
      const now = new Date().toISOString();
      obj.createdAt = now;
      obj.updatedAt = now;
      if (!obj.messages) obj.messages = [];
      if (!obj.tags) obj.tags = [];
    });

    this.therapyGoals.hook('creating', (_primKey: any, obj: any, _trans: any) => {
      const now = new Date().toISOString();
      obj.createdAt = now;
      obj.updatedAt = now;
      if (!obj.milestones) obj.milestones = [];
      if (!obj.strategies) obj.strategies = [];
      if (!obj.obstacles) obj.obstacles = [];
    });

    this.therapyGoals.hook('updating', (modifications: any, _primKey: any, _obj: any, _trans: any) => {
      modifications.updatedAt = new Date().toISOString();
    });

    // Add backup table hooks
    this.importedJournalBackups.hook('creating', (_primKey: any, obj: any, _trans: any) => {
      const now = new Date().toISOString();
      obj.createdAt = obj.createdAt || now;
      obj.updatedAt = obj.updatedAt || now;
      obj.originalImportDate = obj.originalImportDate || now;
      
      // Generate checksum for duplicate detection
      if (!obj.checksum) {
        obj.checksum = this.generateChecksum(obj.content, obj.date);
      }
      
      // Validate required fields
      if (!obj.content || obj.content.trim().length === 0) {
        throw new Error('Backup entry content cannot be empty');
      }
      if (!obj.importSource) {
        throw new Error('Import source is required for backup entries');
      }
    });
  }

  private generateChecksum(content: string, date: string): string {
    // Simple checksum generation for duplicate detection
    const str = `${content.trim()}-${date}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const db = new InnerGuideDB();

// Enhanced database utilities with caching
class DatabaseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

export const dbCache = new DatabaseCache();

// Enhanced database operations with caching and error handling
export const dbOperations = {
  // Journal operations
  async getJournalEntries(limit = 50, offset = 0) {
    const cacheKey = `journal_entries_${limit}_${offset}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const entries = await db.journalEntries
        .orderBy('createdAt')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
      
      dbCache.set(cacheKey, entries, 2 * 60 * 1000); // 2 minutes TTL
      return entries;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw new Error('Failed to load journal entries');
    }
  },

  async searchJournalEntries(query: string, limit = 20) {
    const cacheKey = `search_${query}_${limit}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const entries = await db.journalEntries
        .where('content')
        .startsWithIgnoreCase(query)
        .or('tags')
        .anyOf(query.split(' '))
        .limit(limit)
        .toArray();
      
      dbCache.set(cacheKey, entries, 1 * 60 * 1000); // 1 minute TTL
      return entries;
    } catch (error) {
      console.error('Error searching journal entries:', error);
      throw new Error('Failed to search journal entries');
    }
  },

  async addJournalEntry(entry: Omit<JournalEntry, 'id'>) {
    try {
      const id = await db.journalEntries.add(entry);
      dbCache.clear(); // Clear cache on write operations
      return { ...entry, id };
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw new Error('Failed to add journal entry');
    }
  },

  async updateJournalEntry(id: number, updates: Partial<JournalEntry>) {
    try {
      await db.journalEntries.update(id, updates);
      dbCache.clear(); // Clear cache on write operations
      return await db.journalEntries.get(id);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw new Error('Failed to update journal entry');
    }
  },

  async deleteJournalEntry(id: number) {
    try {
      await db.journalEntries.delete(id);
      dbCache.clear(); // Clear cache on write operations
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw new Error('Failed to delete journal entry');
    }
  },

  // Mood operations
  async getMoodEntries(limit = 100, offset = 0) {
    const cacheKey = `mood_entries_${limit}_${offset}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const entries = await db.moodEntries
        .orderBy('createdAt')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
      
      dbCache.set(cacheKey, entries, 2 * 60 * 1000); // 2 minutes TTL
      return entries;
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      throw new Error('Failed to load mood entries');
    }
  },

  async addMoodEntry(entry: Omit<MoodEntry, 'id'>) {
    try {
      const id = await db.moodEntries.add(entry);
      dbCache.clear(); // Clear cache on write operations
      return { ...entry, id };
    } catch (error) {
      console.error('Error adding mood entry:', error);
      throw new Error('Failed to add mood entry');
    }
  },

  // Analytics operations
  async getAnalyticsData(days = 30) {
    const cacheKey = `analytics_${days}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const [journalEntries, moodEntries] = await Promise.all([
        db.journalEntries
          .where('createdAt')
          .above(cutoffDate.toISOString())
          .toArray(),
        db.moodEntries
          .where('createdAt')
          .above(cutoffDate.toISOString())
          .toArray()
      ]);

      const analytics = {
        totalJournalEntries: journalEntries.length,
        totalMoodEntries: moodEntries.length,
        averageMood: moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length || 0,
        moodTrend: this.calculateMoodTrend(moodEntries),
        writingStreak: this.calculateWritingStreak(journalEntries),
        topTags: this.getTopTags(journalEntries),
        wordCount: journalEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0)
      };

      dbCache.set(cacheKey, analytics, 10 * 60 * 1000); // 10 minutes TTL
      return analytics;
    } catch (error) {
      console.error('Error generating analytics:', error);
      throw new Error('Failed to generate analytics');
    }
  },

  // Helper methods
  calculateMoodTrend(moodEntries: MoodEntry[]) {
    if (moodEntries.length < 2) return 0;
    
    const sortedEntries = moodEntries.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const midpoint = Math.floor(sortedEntries.length / 2);
    const firstHalf = sortedEntries.slice(0, midpoint);
    const secondHalf = sortedEntries.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.mood, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  },

  calculateWritingStreak(journalEntries: JournalEntry[]) {
    if (journalEntries.length === 0) return 0;
    
    const sortedEntries = journalEntries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    let streak = 1;
    let currentDate = new Date(sortedEntries[0].createdAt);
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].createdAt);
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }
    
    return streak;
  },

  getTopTags(journalEntries: JournalEntry[]) {
    const tagCounts = new Map<string, number>();
    
    journalEntries.forEach(entry => {
      entry.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  },

  // Therapy operations
  async getTherapySessions(limit = 20, offset = 0) {
    const cacheKey = `therapy_sessions_${limit}_${offset}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const sessions = await db.therapySessions
        .orderBy('startTime')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
      
      dbCache.set(cacheKey, sessions, 2 * 60 * 1000);
      return sessions;
    } catch (error) {
      console.error('Error fetching therapy sessions:', error);
      throw new Error('Failed to load therapy sessions');
    }
  },

  async createTherapySession(session: Omit<TherapySession, 'id'>) {
    try {
      const id = await db.therapySessions.add(session);
      dbCache.clear();
      return { ...session, id };
    } catch (error) {
      console.error('Error creating therapy session:', error);
      throw new Error('Failed to create therapy session');
    }
  },

  async updateTherapySession(id: number, updates: Partial<TherapySession>) {
    try {
      await db.therapySessions.update(id, updates);
      dbCache.clear();
      return await db.therapySessions.get(id);
    } catch (error) {
      console.error('Error updating therapy session:', error);
      throw new Error('Failed to update therapy session');
    }
  },

  async deleteTherapySession(id: number) {
    try {
      // Delete associated messages first
      await db.therapyMessages.where('sessionId').equals(id).delete();
      // Then delete the session
      await db.therapySessions.delete(id);
      dbCache.clear();
    } catch (error) {
      console.error('Error deleting therapy session:', error);
      throw new Error('Failed to delete therapy session');
    }
  },

  async getTherapyMessages(sessionId: number) {
    const cacheKey = `therapy_messages_${sessionId}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const messages = await db.therapyMessages
        .where('sessionId')
        .equals(sessionId)
        .sortBy('timestamp');
      
      dbCache.set(cacheKey, messages, 1 * 60 * 1000);
      return messages;
    } catch (error) {
      console.error('Error fetching therapy messages:', error);
      throw new Error('Failed to load therapy messages');
    }
  },

  async addTherapyMessage(message: Omit<TherapyMessage, 'id'>) {
    try {
      const id = await db.therapyMessages.add(message);
      dbCache.clear();
      return { ...message, id };
    } catch (error) {
      console.error('Error adding therapy message:', error);
      throw new Error('Failed to add therapy message');
    }
  },

  async addChatMessage(message: Omit<ChatMessage, 'id'>) {
    try {
      // Since chatMessages table doesn't exist, we'll use therapyMessages instead
      const therapyMessage: Omit<TherapyMessage, 'id'> = {
        content: message.content,
        sender: message.role === 'user' ? 'user' : 'therapist',
        timestamp: message.timestamp,
        type: 'text'
      };
      const id = await db.therapyMessages.add(therapyMessage as any);
      dbCache.clear();
      return { ...message, id: id.toString() };
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw new Error('Failed to add chat message');
    }
  },

  async getChatMessages(sessionId: string) {
    const cacheKey = `chat_messages_${sessionId}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const messages = await db.therapyMessages
        .where('sessionId')
        .equals(parseInt(sessionId))
        .sortBy('timestamp');
      
      // Convert to ChatMessage format
      const chatMessages = messages.map(msg => ({
        id: msg.id?.toString() || '',
        content: msg.content,
        role: msg.sender === 'user' ? 'user' : 'assistant',
        timestamp: msg.timestamp
      }));
      
      dbCache.set(cacheKey, chatMessages, 1 * 60 * 1000);
      return chatMessages;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw new Error('Failed to load chat messages');
    }
  },

  async getPersonalGrowthProfile(userId: string = 'default') {
    const cacheKey = `growth_profile_${userId}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      let profile = await db.personalGrowthProfile
        .where('userId')
        .equals(userId)
        .first();

      if (!profile) {
        // Create default profile
        profile = {
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emotionalPatterns: {
            frequency: {},
            weeklyVariation: {},
            monthlyTrends: {}
          },
          recurringThemes: {
            topics: [],
            positive: [],
            challenges: [],
            relationships: [],
            work: [],
            health: []
          },
          progressMetrics: {
            resilience: 0,
            selfAwareness: 0,
            emotionalRange: 0,
            copingEffectiveness: 0,
            communicationSkills: 0,
            stressManagement: 0
          },
          conversationInsights: {
            totalSessions: 0,
            averageSessionLength: 0,
            preferredTopics: [],
            mostHelpfulInterventions: [],
            growthAreas: []
          },
          goalTracking: {
            activeGoals: [],
            completedGoals: [],
            goalAchievementRate: 0
          }
        };
        
        await db.personalGrowthProfile.add(profile);
      }
      
      dbCache.set(cacheKey, profile, 5 * 60 * 1000);
      return profile;
    } catch (error) {
      console.error('Error fetching growth profile:', error);
      throw new Error('Failed to load personal growth profile');
    }
  },

  async updatePersonalGrowthProfile(userId: string, updates: Partial<PersonalGrowthProfile>) {
    try {
      await db.personalGrowthProfile
        .where('userId')
        .equals(userId)
        .modify({ ...updates, updatedAt: new Date().toISOString() });
      
      dbCache.delete(`growth_profile_${userId}`);
      return await this.getPersonalGrowthProfile(userId);
    } catch (error) {
      console.error('Error updating growth profile:', error);
      throw new Error('Failed to update personal growth profile');
    }
  },

  async getTherapyGoals(category?: string) {
    const cacheKey = `therapy_goals_${category || 'all'}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      let query = db.therapyGoals.orderBy('createdAt').reverse();
      
      if (category) {
        query = db.therapyGoals.where('category').equals(category);
      }
      
      const goals = await query.toArray();
      dbCache.set(cacheKey, goals, 2 * 60 * 1000);
      return goals;
    } catch (error) {
      console.error('Error fetching therapy goals:', error);
      throw new Error('Failed to load therapy goals');
    }
  },

  async addTherapyGoal(goal: Omit<TherapyGoal, 'id'>) {
    try {
      const id = await db.therapyGoals.add(goal);
      dbCache.clear();
      return { ...goal, id };
    } catch (error) {
      console.error('Error adding therapy goal:', error);
      throw new Error('Failed to add therapy goal');
    }
  },

  async updateTherapyGoal(id: string, updates: Partial<TherapyGoal>) {
    try {
      await db.therapyGoals.update(id, updates);
      dbCache.clear();
      return await db.therapyGoals.get(id);
    } catch (error) {
      console.error('Error updating therapy goal:', error);
      throw new Error('Failed to update therapy goal');
    }
  },

  // Imported Journal Backup operations
  async createJournalBackup(
    entry: Omit<JournalEntry, 'id'>, 
    importSource: string, 
    importMethod: 'manual' | 'auto',
    originalFileName?: string
  ): Promise<ImportedJournalBackup> {
    try {
      const backupEntry: Omit<ImportedJournalBackup, 'id'> = {
        ...entry,
        originalImportDate: new Date().toISOString(),
        importSource,
        importMethod,
        originalFileName
      };
      
      const id = await db.importedJournalBackups.add(backupEntry);
      dbCache.clear();
      return { ...backupEntry, id };
    } catch (error) {
      console.error('Error creating journal backup:', error);
      throw new Error('Failed to create journal backup');
    }
  },

  async getImportedBackups(limit = 50, offset = 0) {
    const cacheKey = `imported_backups_${limit}_${offset}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const backups = await db.importedJournalBackups
        .orderBy('originalImportDate')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
      
      dbCache.set(cacheKey, backups, 2 * 60 * 1000);
      return backups;
    } catch (error) {
      console.error('Error fetching imported backups:', error);
      throw new Error('Failed to load imported backups');
    }
  },

  async getBackupsByImportSource(importSource: string) {
    const cacheKey = `backups_by_source_${importSource}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const backups = await db.importedJournalBackups
        .where('importSource')
        .equals(importSource)
        .sortBy('originalImportDate');
      
      dbCache.set(cacheKey, backups, 2 * 60 * 1000);
      return backups;
    } catch (error) {
      console.error('Error fetching backups by source:', error);
      throw new Error('Failed to load backups by source');
    }
  },

  async getBackupsByMethod(importMethod: 'manual' | 'auto') {
    const cacheKey = `backups_by_method_${importMethod}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const backups = await db.importedJournalBackups
        .where('importMethod')
        .equals(importMethod)
        .sortBy('originalImportDate');
      
      dbCache.set(cacheKey, backups, 2 * 60 * 1000);
      return backups;
    } catch (error) {
      console.error('Error fetching backups by method:', error);
      throw new Error('Failed to load backups by method');
    }
  },

  async searchImportedBackups(query: string, limit = 20) {
    const cacheKey = `search_backups_${query}_${limit}`;
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const backups = await db.importedJournalBackups
        .where('content')
        .startsWithIgnoreCase(query)
        .or('importSource')
        .startsWithIgnoreCase(query)
        .limit(limit)
        .toArray();
      
      dbCache.set(cacheKey, backups, 1 * 60 * 1000);
      return backups;
    } catch (error) {
      console.error('Error searching imported backups:', error);
      throw new Error('Failed to search imported backups');
    }
  },

  async deleteBackup(id: number) {
    try {
      await db.importedJournalBackups.delete(id);
      dbCache.clear();
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw new Error('Failed to delete backup');
    }
  },

  async getBackupStats() {
    const cacheKey = 'backup_stats';
    const cached = dbCache.get(cacheKey);
    if (cached) return cached;

    try {
      const [totalBackups, manualBackups, autoBackups, sources] = await Promise.all([
        db.importedJournalBackups.count(),
        db.importedJournalBackups.where('importMethod').equals('manual').count(),
        db.importedJournalBackups.where('importMethod').equals('auto').count(),
        db.importedJournalBackups.orderBy('importSource').uniqueKeys()
      ]);

      const stats = {
        totalBackups,
        manualBackups,
        autoBackups,
        uniqueSources: sources.length,
        sources: sources as string[]
      };

      dbCache.set(cacheKey, stats, 5 * 60 * 1000);
      return stats;
    } catch (error) {
      console.error('Error fetching backup stats:', error);
      throw new Error('Failed to load backup statistics');
    }
  },

  async restoreFromBackup(backupId: number): Promise<JournalEntry> {
    try {
      const backup = await db.importedJournalBackups.get(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Create new journal entry from backup (excluding backup-specific fields)
      const journalEntry: Omit<JournalEntry, 'id'> = {
        title: backup.title || `Imported Entry ${new Date().toLocaleString()}`,
        content: backup.content,
        date: backup.date || new Date().toISOString().split('T')[0],
        mood: backup.mood || 3,
        tags: backup.tags || ['imported'],
        location: backup.location,
        moonPhase: backup.moonPhase,
        aiInsights: backup.aiInsights,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const id = await db.journalEntries.add(journalEntry);
      dbCache.clear();
      return { ...journalEntry, id };
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw new Error('Failed to restore from backup');
    }
  },

  generateChecksum(content: string, date: string): string {
    // Simple checksum generation for duplicate detection
    const str = `${content.trim()}-${date}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  },

  async checkBackupDuplicate(content: string, date: string): Promise<boolean> {
    try {
      const checksum = this.generateChecksum(content, date);
      const existingBackup = await db.importedJournalBackups
        .where('checksum')
        .equals(checksum)
        .first();
      
      return !!existingBackup;
    } catch (error) {
      console.error('Error checking backup duplicate:', error);
      return false;
    }
  }
};