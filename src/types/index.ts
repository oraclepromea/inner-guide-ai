// Core data types
export type TabType = 'journal' | 'mood' | 'analytics' | 'settings';

export interface JournalEntry {
  id?: number;
  date: string;
  time: string;
  content: string;
  mood?: number;
  tags?: string[];
  location?: LocationData;
  moonPhase?: MoonPhaseData;
  createdAt: string;
  updatedAt: string;
  wordCount?: number;
  readingTime?: number;
  attachments?: Attachment[];
  sentiment?: SentimentAnalysis;
  aiInsights?: EnhancedAIInsights;
}

export interface MoodEntry {
  id?: number;
  date: string;
  mood: number;
  moodLabel: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  factors?: MoodFactor[];
  activities?: string[];
  weather?: WeatherData;
}

// Location and Moon Phase types
export interface LocationData {
  city: string;
  country: string;
  flag: string;
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
  activeTab: 'journal' | 'mood' | 'analytics' | 'settings';
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

// Error handling
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userAction?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
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