import Dexie, { type Table } from 'dexie';
import type { 
  JournalEntry, 
  MoodEntry, 
  AppSettings, 
  UserPreferences, 
  TherapySession,
  TherapyMessage,
  DeepAIInsight
} from '../types';

// New interface for backup entries
export interface ImportedJournalBackup extends Omit<JournalEntry, 'id'> {
  id?: number;
  originalImportDate: string;
  importSource: string;
  importMethod: 'auto' | 'manual';
  originalFileName?: string;
}

export class InnerGuideDatabase extends Dexie {
  journalEntries!: Table<JournalEntry>;
  moodEntries!: Table<MoodEntry>;
  deepInsights!: Table<DeepAIInsight>; // Added for AI insights
  therapySessions!: Table<TherapySession>;
  therapyMessages!: Table<TherapyMessage>;
  settings!: Table<AppSettings>;
  userPreferences!: Table<UserPreferences>;
  importedJournalBackups!: Table<ImportedJournalBackup>;

  constructor() {
    super('InnerGuideDatabase');
    
    this.version(1).stores({
      journalEntries: '++id, date, createdAt, mood, [date+mood]',
      moodEntries: '++id, date, createdAt, mood',
      therapySessions: '++id, date, createdAt',
      therapyMessages: '++id, sessionId, timestamp, sender',
      settings: '++id',
      userPreferences: '++id',
      importedJournalBackups: '++id, originalImportDate, importSource, date, createdAt'
    });

    // Version 2: Add deep insights table
    this.version(2).stores({
      journalEntries: '++id, date, createdAt, mood, [date+mood]',
      moodEntries: '++id, date, createdAt, mood',
      deepInsights: '++id, journalEntryId, createdAt, primaryEmotion, intensity', // New table
      therapySessions: '++id, date, createdAt',
      therapyMessages: '++id, sessionId, timestamp, sender',
      settings: '++id',
      userPreferences: '++id',
      importedJournalBackups: '++id, originalImportDate, importSource, date, createdAt'
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

export const db = new InnerGuideDatabase();

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
        .orderBy('createdAt')
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

  async addChatMessage(message: Omit<TherapyMessage, 'id'>) {
    try {
      const id = await db.therapyMessages.add(message as any);
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
      
      dbCache.set(cacheKey, messages, 1 * 60 * 1000);
      return messages;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw new Error('Failed to load chat messages');
    }
  },

  async getPersonalGrowthProfile(_userId: string = 'default') {
    // This feature is not yet implemented
    // Return a basic profile structure for future use
    return {
      userId: _userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emotionalPatterns: { frequency: {}, weeklyVariation: {}, monthlyTrends: {} },
      recurringThemes: { topics: [], positive: [], challenges: [], relationships: [], work: [], health: [] },
      progressMetrics: { resilience: 0, selfAwareness: 0, emotionalRange: 0, copingEffectiveness: 0, communicationSkills: 0, stressManagement: 0 },
      conversationInsights: { totalSessions: 0, averageSessionLength: 0, preferredTopics: [], mostHelpfulInterventions: [], growthAreas: [] },
      goalTracking: { activeGoals: [], completedGoals: [], goalAchievementRate: 0 }
    };
  },

  async updatePersonalGrowthProfile(_userId: string, _updates: any) {
    // This feature is not yet implemented
    console.log('Personal growth profile update not yet implemented');
    return null;
  },

  async getTherapyGoals(_category?: string) {
    // This feature is not yet implemented
    // Return empty array for now
    return [];
  },

  async addTherapyGoal(_goal: any) {
    // This feature is not yet implemented
    console.log('Therapy goals not yet implemented');
    return null;
  },

  async updateTherapyGoal(_id: string, _updates: any) {
    // This feature is not yet implemented
    console.log('Therapy goal updates not yet implemented');
    return null;
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
  },

  // Migration utility to fix existing journal entry dates
  async migrateJournalEntryDates(): Promise<{ updated: number; errors: number }> {
    try {
      console.log('🔄 Starting journal entry date migration...');
      
      const allEntries = await db.journalEntries.toArray();
      let updated = 0;
      let errors = 0;
      
      for (const entry of allEntries) {
        try {
          // Check if the entry needs migration (createdAt doesn't match the intended date)
          const entryDate = entry.date;
          const createdAt = new Date(entry.createdAt);
          
          // If the dates don't match (different days), we need to migrate
          const createdAtDate = createdAt.toISOString().split('T')[0];
          
          if (createdAtDate !== entryDate) {
            // Calculate correct createdAt from entry.date and entry.time
            let correctCreatedAt: string;
            
            if (entry.time) {
              // Combine date and time for accurate timestamp
              const combinedDateTime = new Date(`${entryDate}T${entry.time}`);
              correctCreatedAt = isNaN(combinedDateTime.getTime()) 
                ? new Date(`${entryDate}T00:00:00`).toISOString()
                : combinedDateTime.toISOString();
            } else {
              // Use the entry date at midnight if no time specified
              correctCreatedAt = new Date(`${entryDate}T00:00:00`).toISOString();
            }
            
            // Update the entry with correct createdAt
            await db.journalEntries.update(entry.id!, {
              createdAt: correctCreatedAt,
              updatedAt: new Date().toISOString() // Keep current time for updatedAt
            });
            
            updated++;
            console.log(`✅ Updated entry ${entry.id}: ${createdAtDate} → ${entryDate}`);
          }
        } catch (error) {
          console.error(`❌ Error updating entry ${entry.id}:`, error);
          errors++;
        }
      }
      
      // Clear cache after migration
      dbCache.clear();
      
      console.log(`🎉 Migration complete: ${updated} entries updated, ${errors} errors`);
      return { updated, errors };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw new Error('Failed to migrate journal entry dates');
    }
  }
};