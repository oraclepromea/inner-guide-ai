// Core data types
export type TabType = 'journal' | 'mood' | 'analytics' | 'therapy' | 'settings';

// Therapy-related types
export type TherapistPersonality = 'empathetic' | 'analytical' | 'supportive' | 'direct';
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Journal and Mood Entry types
export interface JournalEntry {
  id?: string | number;
  title: string;
  content: string;
  date: string;
  time?: string;
  mood: number;
  tags: string[];
  location?: LocationData;
  moonPhase?: string;
  weather?: {
    temperature: number;
    condition: string;
    description: string;
  };
  aiInsights?: AIAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntry {
  id?: string | number;
  date: string;
  mood: number;
  notes?: string;
  factors?: string[];
  energy?: number;
  sleep?: number;
  stress?: number;
  anxiety?: number;
  createdAt: string;
  updatedAt: string;
}

// Location and Moon Phase types
export interface LocationData {
  city: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface MoonPhaseData {
  phase: string;
  emoji: string;
  illumination: number;
}

// AI Insights type
export interface EnhancedAIInsights {
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: Array<{ name: string; intensity: number }>;
  };
  themes: string[];
  suggestions: string[];
  reflectionPrompts: string[];
  writingPatterns: {
    complexity: 'simple' | 'moderate' | 'complex';
    tone: string;
    keyPhrases: string[];
    wordCount: number;
    readingLevel: string;
  };
  personalizedInsights: {
    recommendations: string[];
    trends: string[];
    concerns: string[];
  };
  createdAt: string;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string; code?: string }>;
  warnings: Array<{ field: string; message: string }>;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// Analytics types
export interface AnalyticsData {
  moodTrends: {
    daily: Array<{ date: string; mood: number }>;
    weekly: Array<{ week: string; averageMood: number }>;
    monthly: Array<{ month: string; averageMood: number }>;
  };
  writingPatterns: {
    wordCount: {
      average: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      history: Array<{ date: string; count: number }>;
    };
    frequency: {
      entriesPerWeek: number;
      streak: number;
      longestStreak: number;
    };
    themes: Array<{ theme: string; count: number; trend: string }>;
  };
  insights: {
    correlations: CorrelationInsight[];
    recommendations: string[];
    achievements: string[];
  };
}

export interface TrendAnalysis {
  period: string;
  moodTrend: 'improving' | 'declining' | 'stable';
  writingFrequency: 'increasing' | 'decreasing' | 'stable';
  emotionalPatterns: string[];
  recommendations: string[];
  insights: string[];
}

export interface AdvancedAnalytics {
  moodPredictions: PredictiveInsight[];
  correlations: CorrelationInsight[];
  seasonalPatterns: any[];
  personalityInsights: any[];
  recommendations: string[];
  personalGrowthMetrics: {
    emotionalIntelligence: number;
    selfAwareness: number;
    resilience: number;
    expressiveness: number;
  };
}

export interface PredictiveInsight {
  type: 'mood' | 'writing' | 'behavior';
  prediction: string;
  confidence: number;
  timeframe: string;
  factors: string[];
  date: string;
}

export interface CorrelationInsight {
  factor: string;  // Changed from factor1/factor2 to single factor
  correlation: number;
  description: string;
  significance: 'high' | 'medium' | 'low';
}

// Original AnalyticsData interface (keeping for backward compatibility)
export interface LegacyAnalyticsData {
  totalJournalEntries: number;
  totalMoodEntries: number;
  averageMood: number;
  moodTrend: number;
  journalStreak: number;
  moodStreak: number;
  totalWords: number;
  avgWordsPerEntry: number;
  topTags: Array<{ tag: string; count: number; percentage: number }>;
  moodDistribution: Array<{ mood: number; count: number; percentage: number }>;
  weeklyPatterns: Array<{ day: string; count: number }>;
  monthlyPatterns: Array<{ period: string; count: number }>;
  writingPatterns: Array<{ hour: number, count: number, averageWordCount: number }>;
  insights: Array<{
    id: string;
    type: 'trend' | 'achievement';
    title: string;
    description: string;
    data: any;
    confidence: number;
    createdAt: string;
  }>;
  personalGrowthMetrics: {
    emotionalIntelligence: number;
    selfAwareness: number;
    resilience: number;
    expressiveness: number;
  };
}

// Supporting types
export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: Emotion[];
}

export interface Emotion {
  name: string;
  intensity: number;
}

export interface MoodFactor {
  name: string;
  impact: number; // -5 to 5
  category: 'work' | 'relationships' | 'health' | 'sleep' | 'exercise' | 'other';
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  pressure: number;
}

export interface AppSettings {
  id?: number;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  exportFormat: 'json' | 'csv' | 'pdf';
  dataRetentionDays: number;
  autoBackup: boolean;
  encryptData: boolean;
  language: string;
  timezone: string;
  privacyMode: boolean;
  analyticsEnabled: boolean;
  autoSave: boolean;
  enableLocation: boolean;
  reminderEnabled: boolean;
}

export interface UserPreferences {
  id?: number;
  reminderTime?: string;
  journalPrompts: string[];
  moodTriggers: string[];
  goals: Goal[];
  favoriteQuotes: string[];
  customTags: string[];
  writingTargets: WritingTarget;
  onboardingCompleted: boolean;
  lastActiveDate: string;
  dateFormat: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: 'writing' | 'mood' | 'mindfulness' | 'custom';
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

export interface WritingTarget {
  dailyWordCount: number;
  weeklyEntries: number;
  monthlyGoals: string[];
}

export interface Achievement {
  id?: number;
  type: 'writing_streak' | 'mood_consistency' | 'word_count' | 'tags_used' | 'custom';
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// UI State types
export interface TabState {
  activeTab: 'journal' | 'mood' | 'analytics' | 'therapy' | 'settings';
  journalView: 'list' | 'calendar' | 'timeline';
  moodView: 'chart' | 'calendar' | 'stats';
  analyticsView: 'overview' | 'trends' | 'insights';
}

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  timestamp?: string;
}

export interface NotificationState {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
  autoClose?: boolean;
  duration?: number;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
}

// Search and Filter types
export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface SearchFilters {
  query?: string;
  tags?: string[];
  mood?: MoodValue;
  dateRange?: DateRange;
  sortBy?: SortableField;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export type SortableField = 'date' | 'mood' | 'wordCount' | 'createdAt' | 'updatedAt' | 'title';

// Performance optimization types
export interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}

// Component state types
export interface UIState {
  sidebarCollapsed: boolean;
  activeFilters: SearchFilters;
  viewMode: 'grid' | 'list' | 'timeline';
  selectedEntries: string[];
}

// Export/Import types
export interface ExportData {
  journalEntries: JournalEntry[];
  moodEntries: MoodEntry[];
  settings: AppSettings;
  preferences: UserPreferences;
  achievements: Achievement[];
  exportMetadata: {
    version: string;
    exportedAt: string;
    totalEntries: number;
    format: string;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'markdown';
  includeJournalEntries: boolean;
  includeMoodEntries: boolean;
  includeSettings: boolean;
  includeAnalytics: boolean;
  dateRange?: DateRange;
  password?: string;
  compression?: boolean;
}

export interface ImportResult {
  success: boolean;
  journalEntriesImported: number;
  moodEntriesImported: number;
  settingsImported: boolean;
  analyticsImported: boolean;
  errors: Array<{
    type: string;
    message: string;
    item?: any;
  }>;
  warnings: string[];
  summary: {
    totalProcessed: number;
    successfulImports: number;
    failedImports: number;
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncOperationResult<T> = {
  success: boolean;
  data?: T;
  error?: AppError;
  timestamp: string;
  duration?: number;
};

// Component prop types
export interface BaseComponentProps {
  className?: string;
  testId?: string;
  'aria-label'?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

// Hook return types
export interface UsePaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export interface UseSearchResult<T> {
  query: string;
  setQuery: (query: string) => void;
  filteredItems: T[];
  isSearching: boolean;
}

// Therapy types
export interface TherapySession {
  id?: string | number;
  date: string;
  messages: TherapyMessage[];
  exercises: TherapyExercise[];
  summary?: string;
  mood?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TherapyExercise {
  id?: string | number;
  title: string;
  description: string;
  type: 'breathing' | 'mindfulness' | 'cognitive' | 'reflection';
  duration?: number;
  completed: boolean;
  completedAt?: string;
  userResponse?: string;
}

export interface TherapyMessage {
  id?: string | number;
  content: string;
  sender: 'user' | 'therapist';
  timestamp: string;
  type?: 'text' | 'exercise' | 'insight';
}

export interface TherapyGoal {
  id?: number;
  title: string;
  description: string;
  category: 'emotional' | 'behavioral' | 'cognitive' | 'relational' | 'lifestyle';
  targetDate?: string;
  progress: number; // 0-100
  milestones: GoalMilestone[];
  strategies: string[];
  obstacles: string[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'paused';
}

export interface GoalMilestone {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  evidence?: string;
}

export interface PersonalGrowthProfile {
  id?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  emotionalPatterns: {
    frequency: Record<string, number>;
    weeklyVariation: Record<string, number[]>;
    monthlyTrends: Record<string, number>;
  };
  recurringThemes: {
    topics: string[];
    positive: string[];
    challenges: string[];
    relationships: string[];
    work: string[];
    health: string[];
  };
  progressMetrics: {
    resilience: number;
    selfAwareness: number;
    emotionalRange: number;
    copingEffectiveness: number;
    communicationSkills: number;
    stressManagement: number;
  };
  conversationInsights: {
    totalSessions: number;
    averageSessionLength: number;
    preferredTopics: string[];
    mostHelpfulInterventions: string[];
    growthAreas: string[];
  };
  goalTracking: {
    activeGoals: TherapyGoal[];
    completedGoals: TherapyGoal[];
    goalAchievementRate: number;
  };
}

// App state interface
export interface AppState {
  // Data
  journalEntries: JournalEntry[];
  moodEntries: MoodEntry[];
  settings: AppSettings;
  preferences: UserPreferences;
  notifications: NotificationState[];
  achievements: Achievement[];
  
  // UI State
  activeTab: TabType;
  isLoading: boolean;
  error: string | null;
  
  // Location and Moon Phase
  currentLocation: LocationData | null;
  currentMoonPhase: MoonPhaseData | null;
  
  // Therapy State
  therapySessions: TherapySession[];
  currentSession: TherapySession | null;
  messages: TherapyMessage[];
  isLoadingTherapy: boolean;
  isTyping: boolean;
  selectedTherapist: TherapistPersonality;
  
  // Analytics State
  analytics: AnalyticsData | null;

  // Actions (these will be implemented in the store)
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  getJournalEntries: () => Promise<void>;
  
  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMoodEntry: (id: string, updates: Partial<MoodEntry>) => Promise<void>;
  deleteMoodEntry: (id: string) => Promise<void>;
  getMoodEntries: () => Promise<void>;
  
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  getAnalytics: () => Promise<AnalyticsData>;
  generateAIInsights: (entry: JournalEntry) => Promise<void>;
  
  setActiveTab: (tab: TabType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  updateLocation: (location: LocationData) => void;
  updateMoonPhase: (moonPhase: MoonPhaseData) => void;
  
  createTherapySession: () => Promise<void>;
  loadTherapySessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  archiveSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateTherapistPersonality: (personality: TherapistPersonality) => void;
  
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  importJournalEntries: (entries: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>[], importSource?: string) => Promise<JournalEntry[]>;
  clearAllData: () => Promise<void>;
}

export interface AIAnalysisResult {
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  themes: string[];
  suggestions: string[];
  reflectionPrompts: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}