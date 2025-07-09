import Dexie, { type Table } from 'dexie';
import type { JournalEntry, MoodEntry, AppSettings, UserPreferences, Achievement } from '../types';

export class InnerGuideDB extends Dexie {
  journalEntries!: Table<JournalEntry>;
  moodEntries!: Table<MoodEntry>;
  settings!: Table<AppSettings>;
  userPreferences!: Table<UserPreferences>;
  achievements!: Table<Achievement>;

  constructor() {
    super('InnerGuideDB');
    this.version(1).stores({
      journalEntries: '++id, date, createdAt, updatedAt, tags',
      moodEntries: '++id, date, createdAt, updatedAt, mood',
      settings: '++id',
      userPreferences: '++id',
      achievements: '++id, type, unlockedAt'
    });

    // Add hooks for data validation and automatic timestamps
    this.journalEntries.hook('creating', (_primKey, obj, _trans) => {
      const now = new Date().toISOString();
      obj.createdAt = now;
      obj.updatedAt = now;
      // Validate required fields
      if (!obj.content || obj.content.trim().length === 0) {
        throw new Error('Journal entry content cannot be empty');
      }
    });

    this.journalEntries.hook('updating', (modifications: Partial<JournalEntry>, _primKey, _obj, _trans) => {
      modifications.updatedAt = new Date().toISOString();
    });

    this.moodEntries.hook('creating', (_primKey, obj, _trans) => {
      const now = new Date().toISOString();
      obj.createdAt = now;
      obj.updatedAt = now;
      // Validate mood range
      if (obj.mood < 1 || obj.mood > 5) {
        throw new Error('Mood must be between 1 and 5');
      }
    });

    this.moodEntries.hook('updating', (modifications: Partial<MoodEntry>, _primKey, _obj, _trans) => {
      modifications.updatedAt = new Date().toISOString();
    });
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
  }
};