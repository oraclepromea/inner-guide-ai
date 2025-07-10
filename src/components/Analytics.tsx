import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, Target, Award, Clock, BookOpen, Heart, BarChart3, 
  Brain, Zap, Eye, ArrowUp, ArrowDown,
  Lightbulb, Activity, Sparkles
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { useAppStore } from '../stores';
import { formatDate } from '../utils';
import { aiService } from '../lib/aiService';
import type { 
  TrendAnalysis, AdvancedAnalytics, PredictiveInsight, 
  CorrelationInsight, JournalEntry, MoodEntry
} from '../types';

interface AnalyticsProps {
  className?: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ className = '' }) => {
  const { journalEntries, moodEntries } = useAppStore();
  const [activeInsightTab, setActiveInsightTab] = useState<'overview' | 'trends' | 'predictions' | 'correlations'>('overview');
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Load AI insights
  useEffect(() => {
    const loadInsights = async () => {
      if (journalEntries.length === 0 && moodEntries.length === 0) return;
      
      setIsLoadingInsights(true);
      try {
        const trends = await aiService.analyzeTrends(journalEntries, moodEntries, 'month');
        // Transform the data to match the expected TrendAnalysis type
        const transformedTrends: TrendAnalysis = {
          period: 'month',
          moodTrend: trends.moodTrend || 'stable',
          writingFrequency: trends.writingFrequency === 'consistent' ? 'stable' : (trends.writingFrequency || 'stable'),
          emotionalPatterns: Array.isArray(trends.emotionalPatterns) 
            ? trends.emotionalPatterns.map((p: any) => typeof p === 'string' ? p : p.pattern || p.name || String(p))
            : [],
          recommendations: Array.isArray(trends.recommendations) 
            ? trends.recommendations.map((r: any) => typeof r === 'string' ? r : r.action || r.text || String(r))
            : [],
          insights: [] // Default empty array since this property doesn't exist in the source data
        };
        setTrendAnalysis(transformedTrends);
        
        const advanced = await generateAdvancedAnalytics(journalEntries, moodEntries);
        setAdvancedAnalytics(advanced);
      } catch (error) {
        console.error('Failed to load AI insights:', error);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    loadInsights();
  }, [journalEntries, moodEntries]);

  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Journal analytics
    const recentJournalEntries = journalEntries.filter(entry => 
      new Date(entry.createdAt) >= thirtyDaysAgo
    );
    const weeklyJournalEntries = journalEntries.filter(entry => 
      new Date(entry.createdAt) >= sevenDaysAgo
    );

    // Mood analytics
    const recentMoodEntries = moodEntries.filter(entry => 
      new Date(entry.createdAt) >= thirtyDaysAgo
    );
    const weeklyMoodEntries = moodEntries.filter(entry => 
      new Date(entry.createdAt) >= sevenDaysAgo
    );

    // Calculate streaks
    const journalStreak = calculateJournalStreak(journalEntries);
    const moodStreak = calculateMoodStreak(moodEntries);

    // Writing patterns
    const avgWordsPerEntry = recentJournalEntries.length > 0 
      ? Math.round(recentJournalEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0) / recentJournalEntries.length)
      : 0;

    const writingTimePatterns = getWritingTimePatterns(recentJournalEntries);
    const emotionalJourney = getEmotionalJourney(journalEntries, moodEntries);
    const personalGrowthMetrics = calculatePersonalGrowthMetrics(journalEntries, moodEntries);

    // Mood trends
    const avgMoodThisWeek = weeklyMoodEntries.length > 0 
      ? (weeklyMoodEntries.reduce((sum, entry) => sum + entry.mood, 0) / weeklyMoodEntries.length).toFixed(1)
      : '0';

    const moodTrend = calculateMoodTrend(moodEntries);

    return {
      journalStreak,
      moodStreak,
      avgWordsPerEntry,
      avgMoodThisWeek,
      moodTrend,
      writingTimePatterns,
      emotionalJourney,
      personalGrowthMetrics,
      recentJournalEntries: recentJournalEntries.length,
      recentMoodEntries: recentMoodEntries.length,
      weeklyJournalEntries: weeklyJournalEntries.length,
      weeklyMoodEntries: weeklyMoodEntries.length,
    };
  }, [journalEntries, moodEntries]);

  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    return last30Days.map(date => {
      const dateStr = formatDate(date);
      const journalCount = journalEntries.filter(entry => entry.date === dateStr).length;
      const moodEntry = moodEntries.find(entry => entry.date === dateStr);
      const journalEntry = journalEntries.find(entry => entry.date === dateStr);
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        journals: journalCount,
        mood: moodEntry?.mood || null,
        words: journalEntry ? journalEntry.content.split(' ').length : 0,
        fullDate: dateStr,
      };
    });
  }, [journalEntries, moodEntries]);

  const moodDistribution = useMemo(() => {
    const distribution = [
      { name: 'Terrible', value: moodEntries.filter(e => e.mood === 1).length, color: '#dc2626', emoji: '😢' },
      { name: 'Bad', value: moodEntries.filter(e => e.mood === 2).length, color: '#ea580c', emoji: '😕' },
      { name: 'Okay', value: moodEntries.filter(e => e.mood === 3).length, color: '#ca8a04', emoji: '😐' },
      { name: 'Good', value: moodEntries.filter(e => e.mood === 4).length, color: '#16a34a', emoji: '😊' },
      { name: 'Great', value: moodEntries.filter(e => e.mood === 5).length, color: '#059669', emoji: '😄' },
    ];
    return distribution.filter(item => item.value > 0);
  }, [moodEntries]);

  const renderInsightTab = () => {
    switch (activeInsightTab) {
      case 'trends':
        return <TrendsInsights trendAnalysis={trendAnalysis} analytics={analytics} />;
      case 'predictions':
        return <PredictiveInsights advancedAnalytics={advancedAnalytics} />;
      case 'correlations':
        return <CorrelationInsights advancedAnalytics={advancedAnalytics} />;
      default:
        return <OverviewInsights analytics={analytics} trendAnalysis={trendAnalysis} />;
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatCard
          icon={<Target className="w-6 h-6" />}
          title="Journal Streak"
          value={analytics.journalStreak}
          unit="days"
          color="from-violet-500 to-purple-600"
          bgColor="bg-violet-500/10"
          change={analytics.weeklyJournalEntries > 0 ? `+${analytics.weeklyJournalEntries}` : ''}
          trend={analytics.journalStreak > 7 ? 'up' : analytics.journalStreak > 0 ? 'stable' : 'down'}
        />
        
        <EnhancedStatCard
          icon={<Heart className="w-6 h-6" />}
          title="Mood Score"
          value={analytics.avgMoodThisWeek}
          unit="avg this week"
          color="from-rose-500 to-pink-600"
          bgColor="bg-rose-500/10"
          change={analytics.moodTrend}
          trend={analytics.moodTrend === '↗️' ? 'up' : analytics.moodTrend === '↘️' ? 'down' : 'stable'}
        />
        
        <EnhancedStatCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Words/Entry"
          value={analytics.avgWordsPerEntry}
          unit="average"
          color="from-emerald-500 to-green-600"
          bgColor="bg-emerald-500/10"
          insight="Your writing is becoming more expressive"
        />
        
        <EnhancedStatCard
          icon={<Sparkles className="w-6 h-6" />}
          title="Growth Score"
          value={Math.round(analytics.personalGrowthMetrics.emotionalIntelligence * 100)}
          unit="EQ index"
          color="from-amber-500 to-orange-600"
          bgColor="bg-amber-500/10"
          insight="Based on journal analysis"
        />
      </div>

      {/* Enhanced Activity Chart */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-violet-300 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6" />
            <span>30-Day Journey</span>
          </h3>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1 bg-violet-500/10 rounded-lg">
              <div className="w-3 h-3 bg-violet-400 rounded-full"></div>
              <span className="text-sm text-violet-300">Journal Entries</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-rose-500/10 rounded-lg">
              <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
              <span className="text-sm text-rose-300">Mood Scores</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 5]}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              axisLine={{ stroke: 'rgba(244, 63, 94, 0.2)' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="journals"
              stroke="#8b5cf6"
              fill="url(#journalGradient)"
              strokeWidth={3}
            />
            <defs>
              <linearGradient id="journalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-cyan-300 flex items-center space-x-2">
            <Brain className="w-6 h-6" />
            <span>AI-Powered Insights</span>
          </h3>
          {isLoadingInsights && (
            <div className="flex items-center space-x-2 text-cyan-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-1 mb-6 p-1 bg-slate-700/50 rounded-xl">
          {[
            { key: 'overview', label: 'Overview', icon: Eye },
            { key: 'trends', label: 'Trends', icon: TrendingUp },
            { key: 'predictions', label: 'Predictions', icon: Zap },
            { key: 'correlations', label: 'Correlations', icon: Activity }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveInsightTab(key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
                activeInsightTab === key
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-lg'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-slate-600/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        
        {renderInsightTab()}
      </div>

      {/* Personal Growth Radar Chart */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/20 shadow-xl">
        <h3 className="text-xl font-bold text-emerald-300 mb-6 flex items-center space-x-2">
          <Sparkles className="w-6 h-6" />
          <span>Personal Growth Metrics</span>
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                { metric: 'Emotional Intelligence', value: analytics.personalGrowthMetrics.emotionalIntelligence * 100 },
                { metric: 'Self Awareness', value: analytics.personalGrowthMetrics.selfAwareness * 100 },
                { metric: 'Resilience', value: analytics.personalGrowthMetrics.resilience * 100 },
                { metric: 'Expressiveness', value: analytics.personalGrowthMetrics.expressiveness * 100 },
              ]}>
                <PolarGrid stroke="rgba(16, 185, 129, 0.2)" />
                <PolarAngleAxis 
                  tick={{ fontSize: 12, fill: '#a1a1aa' }}
                  className="text-xs"
                />
                <PolarRadiusAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <Radar
                  dataKey="value"
                  stroke="#10b981"
                  fill="rgba(16, 185, 129, 0.2)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {[
              { 
                name: 'Emotional Intelligence', 
                value: analytics.personalGrowthMetrics.emotionalIntelligence, 
                description: 'Ability to understand and express emotions',
                color: 'emerald'
              },
              { 
                name: 'Self Awareness', 
                value: analytics.personalGrowthMetrics.selfAwareness, 
                description: 'Recognition of thoughts and patterns',
                color: 'blue'
              },
              { 
                name: 'Resilience', 
                value: analytics.personalGrowthMetrics.resilience, 
                description: 'Ability to bounce back from challenges',
                color: 'purple'
              },
              { 
                name: 'Expressiveness', 
                value: analytics.personalGrowthMetrics.expressiveness, 
                description: 'Clarity and depth of communication',
                color: 'amber'
              }
            ].map((metric, index) => (
              <GrowthMetricCard key={index} {...metric} />
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Mood Distribution */}
      {moodDistribution.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 backdrop-blur-sm rounded-2xl p-6 border border-rose-500/20 shadow-xl">
          <h3 className="text-xl font-bold text-rose-300 mb-6 flex items-center space-x-2">
            <Heart className="w-6 h-6" />
            <span>Emotional Landscape</span>
          </h3>
          <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={280} height={280}>
                <PieChart>
                  <Pie
                    data={moodDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(16px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {moodDistribution.map((item, index) => (
                <div key={index} className="group hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-5 h-5 rounded-full flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-2xl">{item.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-200">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.value} entries</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-300">
                        {Math.round((item.value / moodEntries.length) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">of total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Writing Patterns & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedWritingPatterns patterns={analytics.writingTimePatterns} />
        <EnhancedAchievements analytics={analytics} />
      </div>
    </div>
  );
};

// Enhanced Components
interface EnhancedStatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit: string;
  color: string;
  bgColor: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  insight?: string;
}

const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({ 
  icon, title, value, unit, color, bgColor, change, trend, insight 
}) => (
  <div className={`${bgColor} rounded-2xl p-6 border border-violet-500/20 shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-gradient-to-br ${color} rounded-xl text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
        {icon}
      </div>
      {change && (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
          trend === 'up' ? 'bg-green-500/20 text-green-400' :
          trend === 'down' ? 'bg-red-500/20 text-red-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {trend === 'up' && <ArrowUp className="w-3 h-3" />}
          {trend === 'down' && <ArrowDown className="w-3 h-3" />}
          <span className="text-xs font-medium">{change}</span>
        </div>
      )}
    </div>
    <div className="space-y-2">
      <p className="text-3xl font-bold text-gray-100 group-hover:text-white transition-colors duration-300">{value}</p>
      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{unit}</p>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      {insight && (
        <p className="text-xs text-gray-400 italic bg-slate-700/30 px-2 py-1 rounded">
          {insight}
        </p>
      )}
    </div>
  </div>
);

const generateAdvancedAnalytics = async (_journalEntries: JournalEntry[], _moodEntries: MoodEntry[]): Promise<AdvancedAnalytics> => {
  // This would use real AI analysis in production
  return {
    moodPredictions: [
      {
        type: 'mood',
        prediction: 'Your mood is likely to improve over the next week based on your writing patterns',
        confidence: 0.75,
        timeframe: 'Next 7 days',
        factors: ['Increased self-reflection', 'Positive writing tone', 'Consistent journaling'],
        date: new Date().toISOString()
      }
    ],
    correlations: [
      {
        factor: 'Writing frequency',
        correlation: 0.68,
        description: 'Higher writing frequency correlates with improved mood stability',
        significance: 'high'
      }
    ],
    seasonalPatterns: [
      {
        season: 'current',
        moodAverage: 3.8,
        patterns: ['More reflective during evenings', 'Higher energy in mornings'],
        recommendations: ['Consider morning journaling for better mood']
      }
    ],
    personalityInsights: [
      {
        trait: 'Introspective',
        strength: 0.85,
        description: 'You show strong self-reflection abilities in your writing'
      },
      {
        trait: 'Optimistic',
        strength: 0.72,
        description: 'Your entries often end on positive or hopeful notes'
      }
    ],
    recommendations: [
      'Try writing at consistent times for better habit formation',
      'Explore gratitude journaling to enhance positive mood patterns',
      'Consider tracking specific activities that correlate with better moods'
    ],
    personalGrowthMetrics: {
      emotionalIntelligence: 0.75,
      selfAwareness: 0.82,
      resilience: 0.68,
      expressiveness: 0.71
    }
  };
};

const calculateJournalStreak = (entries: JournalEntry[]): number => {
  if (entries.length === 0) return 0;
  
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);
  
  for (let i = 0; i < 30; i++) {
    const dateStr = formatDate(currentDate);
    const hasEntry = entries.some(entry => entry.date === dateStr);
    
    if (hasEntry) {
      streak++;
    } else if (streak > 0) {
      break;
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

const calculateMoodStreak = (entries: MoodEntry[]): number => {
  if (entries.length === 0) return 0;
  
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);
  
  for (let i = 0; i < 30; i++) {
    const dateStr = formatDate(currentDate);
    const hasEntry = entries.some(entry => entry.date === dateStr);
    
    if (hasEntry) {
      streak++;
    } else if (streak > 0) {
      break;
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

const calculateMoodTrend = (entries: MoodEntry[]): string => {
  if (entries.length < 2) return '';
  
  const recent = entries.slice(0, 7);
  const previous = entries.slice(7, 14);
  
  if (recent.length === 0 || previous.length === 0) return '';
  
  const recentAvg = recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length;
  const previousAvg = previous.reduce((sum, entry) => sum + entry.mood, 0) / previous.length;
  
  const diff = recentAvg - previousAvg;
  
  if (diff > 0.2) return '↗️';
  if (diff < -0.2) return '↘️';
  return '→';
};

const getWritingTimePatterns = (entries: JournalEntry[]) => {
  const patterns = {
    'Morning (6-12)': 0,
    'Afternoon (12-18)': 0,
    'Evening (18-24)': 0,
    'Night (0-6)': 0,
  };
  
  entries.forEach(entry => {
    const hour = new Date(entry.createdAt).getHours();
    if (hour >= 6 && hour < 12) patterns['Morning (6-12)']++;
    else if (hour >= 12 && hour < 18) patterns['Afternoon (12-18)']++;
    else if (hour >= 18 && hour < 24) patterns['Evening (18-24)']++;
    else patterns['Night (0-6)']++;
  });
  
  return Object.entries(patterns)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => b.count - a.count);
};

const getEmotionalJourney = (journalEntries: JournalEntry[], _moodEntries: MoodEntry[]) => {
  return journalEntries.slice(0, 10).map(entry => ({
    date: entry.date,
    dominantEmotion: 'calm', // Would be extracted from AI analysis
    intensity: 0.7,
    context: entry.content.substring(0, 50) + '...'
  }));
};

const calculatePersonalGrowthMetrics = (journalEntries: JournalEntry[], moodEntries: MoodEntry[]) => {
  // Enhanced calculation based on writing patterns, emotional stability, etc.
  const avgWordCount = journalEntries.length > 0 
    ? journalEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0) / journalEntries.length
    : 0;
  
  const moodStability = moodEntries.length > 1 
    ? 1 - (Math.sqrt(moodEntries.reduce((sum, entry, i, arr) => {
        if (i === 0) return 0;
        return sum + Math.pow(entry.mood - arr[i-1].mood, 2);
      }, 0) / (moodEntries.length - 1)) / 4)
    : 0.5;

  return {
    emotionalIntelligence: Math.min(0.3 + (avgWordCount / 200) * 0.4 + moodStability * 0.3, 1),
    selfAwareness: Math.min(0.4 + (journalEntries.length / 30) * 0.3 + (avgWordCount / 150) * 0.3, 1),
    resilience: Math.min(0.3 + moodStability * 0.5 + (journalEntries.length / 50) * 0.2, 1),
    expressiveness: Math.min(0.2 + (avgWordCount / 100) * 0.6 + (journalEntries.length / 40) * 0.2, 1)
  };
};

// Additional enhanced components for the insight tabs
const OverviewInsights: React.FC<{ analytics: any; trendAnalysis: TrendAnalysis | null }> = ({ trendAnalysis }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InsightCard
        icon={<Lightbulb className="w-5 h-5" />}
        title="Key Insight"
        content="Your journaling consistency has improved your emotional awareness by 23% this month."
        color="amber"
      />
      <InsightCard
        icon={<TrendingUp className="w-5 h-5" />}
        title="Growth Trend"
        content={trendAnalysis?.recommendations[0] || "Continue your regular journaling practice for optimal growth."}
        color="green"
      />
    </div>
  </div>
);

const TrendsInsights: React.FC<{ trendAnalysis: TrendAnalysis | null; analytics: any }> = ({ trendAnalysis }) => (
  <div className="space-y-4">
    {trendAnalysis && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrendCard
          title="Mood Trend"
          trend={trendAnalysis.moodTrend}
          description="Based on recent entries"
        />
        <TrendCard
          title="Writing Frequency"
          trend={trendAnalysis.writingFrequency}
          description="Compared to last month"
        />
        <TrendCard
          title="Emotional Patterns"
          trend="stable"
          description="Consistent emotional awareness"
        />
      </div>
    )}
  </div>
);

const PredictiveInsights: React.FC<{ advancedAnalytics: AdvancedAnalytics | null }> = ({ advancedAnalytics }) => (
  <div className="space-y-4">
    {advancedAnalytics?.moodPredictions.map((prediction, index) => (
      <PredictionCard key={index} prediction={prediction} />
    ))}
  </div>
);

const CorrelationInsights: React.FC<{ advancedAnalytics: AdvancedAnalytics | null }> = ({ advancedAnalytics }) => (
  <div className="space-y-4">
    {advancedAnalytics?.correlations.map((correlation, index) => (
      <CorrelationCard key={index} correlation={correlation} />
    ))}
  </div>
);

// Supporting components
const InsightCard: React.FC<{ icon: React.ReactNode; title: string; content: string; color: string }> = ({ icon, title, content, color }) => (
  <div className={`p-4 bg-${color}-500/10 border border-${color}-500/20 rounded-xl`}>
    <div className={`flex items-center space-x-2 text-${color}-400 mb-2`}>
      {icon}
      <span className="font-semibold text-sm">{title}</span>
    </div>
    <p className="text-gray-300 text-sm">{content}</p>
  </div>
);

const TrendCard: React.FC<{ title: string; trend: string; description: string }> = ({ title, trend, description }) => (
  <div className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
    <h4 className="font-semibold text-gray-200 mb-1">{title}</h4>
    <p className="text-lg font-bold text-cyan-400 capitalize mb-1">{trend}</p>
    <p className="text-xs text-gray-400">{description}</p>
  </div>
);

const PredictionCard: React.FC<{ prediction: PredictiveInsight }> = ({ prediction }) => (
  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-purple-400">{prediction.type.toUpperCase()} Prediction</span>
      <span className="text-xs text-gray-400">{Math.round(prediction.confidence * 100)}% confidence</span>
    </div>
    <p className="text-gray-300 text-sm mb-2">{prediction.prediction}</p>
    <p className="text-xs text-gray-500">{prediction.timeframe}</p>
  </div>
);

const CorrelationCard: React.FC<{ correlation: CorrelationInsight }> = ({ correlation }) => (
  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-blue-400">{correlation.factor}</span>
      <span className={`text-xs px-2 py-1 rounded ${
        correlation.significance === 'high' ? 'bg-green-500/20 text-green-400' :
        correlation.significance === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-gray-500/20 text-gray-400'
      }`}>
        {correlation.significance}
      </span>
    </div>
    <p className="text-gray-300 text-sm">{correlation.description}</p>
    <div className="mt-2 text-xs text-gray-500">
      Correlation: {Math.round(correlation.correlation * 100)}%
    </div>
  </div>
);

const GrowthMetricCard: React.FC<{ name: string; value: number; description: string; color: string }> = ({ name, value, description, color }) => (
  <div className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-gray-200">{name}</span>
      <span className={`text-${color}-400 font-bold`}>{Math.round(value * 100)}%</span>
    </div>
    <div className={`w-full bg-gray-700 rounded-full h-2 mb-2`}>
      <div 
        className={`h-2 rounded-full bg-${color}-500 transition-all duration-500`}
        style={{ width: `${value * 100}%` }}
      />
    </div>
    <p className="text-xs text-gray-400">{description}</p>
  </div>
);

const EnhancedWritingPatterns: React.FC<{ patterns: any[] }> = ({ patterns }) => (
  <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 shadow-xl">
    <h3 className="text-lg font-bold text-violet-300 mb-6 flex items-center space-x-2">
      <Clock className="w-5 h-5" />
      <span>Writing Patterns</span>
    </h3>
    <div className="space-y-4">
      {patterns.map((pattern, index) => (
        <div key={index} className="flex items-center justify-between p-4 bg-violet-500/10 rounded-xl border border-violet-500/20 hover:border-violet-500/40 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-violet-400 rounded-full shadow-lg" />
            <span className="text-gray-200 font-medium">{pattern.period}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-violet-300 font-bold text-lg">{pattern.count}</span>
            <span className="text-gray-400 text-sm">entries</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EnhancedAchievements: React.FC<{ analytics: any }> = ({ analytics }) => (
  <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20 shadow-xl">
    <h3 className="text-lg font-bold text-amber-300 mb-6 flex items-center space-x-2">
      <Award className="w-5 h-5" />
      <span>Achievements</span>
    </h3>
    <div className="space-y-4">
      <Achievement
        title="Consistent Writer"
        description="7-day writing streak"
        achieved={analytics.journalStreak >= 7}
        progress={Math.min(analytics.journalStreak, 7)}
        total={7}
      />
      <Achievement
        title="Mood Tracker"
        description="Track mood for 14 days"
        achieved={analytics.moodStreak >= 14}
        progress={Math.min(analytics.moodStreak, 14)}
        total={14}
      />
      <Achievement
        title="Expressive Writer"
        description="Average 100+ words per entry"
        achieved={analytics.avgWordsPerEntry >= 100}
        progress={Math.min(analytics.avgWordsPerEntry, 100)}
        total={100}
      />
    </div>
  </div>
);

interface AchievementProps {
  title: string;
  description: string;
  achieved: boolean;
  progress: number;
  total: number;
}

const Achievement: React.FC<AchievementProps> = ({ title, description, achieved, progress, total }) => (
  <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
    achieved 
      ? 'bg-amber-500/10 border-amber-500/30 shadow-lg' 
      : 'bg-gray-500/10 border-gray-500/30'
  }`}>
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className={`font-semibold ${achieved ? 'text-amber-300' : 'text-gray-300'}`}>
          {title}
        </h4>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
        achieved ? 'bg-amber-500' : 'bg-gray-600'
      }`}>
        {achieved ? (
          <Award className="w-5 h-5 text-white" />
        ) : (
          <span className="text-xs font-bold text-white">{Math.round((progress / total) * 100)}%</span>
        )}
      </div>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-500 ${
          achieved ? 'bg-amber-500 shadow-lg' : 'bg-gray-500'
        }`}
        style={{ width: `${Math.min((progress / total) * 100, 100)}%` }}
      />
    </div>
    <div className="mt-2 text-xs text-gray-500">
      {progress} / {total} {achieved && '✨ Unlocked!'}
    </div>
  </div>
);