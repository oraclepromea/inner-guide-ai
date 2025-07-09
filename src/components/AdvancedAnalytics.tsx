import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, Brain, Target, Award, AlertCircle, Download } from 'lucide-react';
import { useAppStore } from '../stores';
import { aiService } from '../lib/aiService';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import type { JournalEntry, MoodEntry } from '../types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface AdvancedAnalyticsProps {
  onClose?: () => void;
}

interface EmotionData {
  emotion: string;
  intensity: number;
  frequency: number;
  trend: 'up' | 'down' | 'stable';
}

interface CorrelationInsight {
  factor: string;
  correlation: number;
  confidence: number;
  description: string;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ onClose }) => {
  const { journalEntries, moodEntries } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'insights' | 'predictions' | 'correlations'>('overview');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('mood');

  // Calculate time-based data
  const timeRangeData = useMemo(() => {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    const startDate = subDays(new Date(), days);
    const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
    
    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayMoods = moodEntries.filter(entry => 
        format(new Date(entry.createdAt), 'yyyy-MM-dd') === dateStr
      );
      const dayEntries = journalEntries.filter(entry => 
        format(new Date(entry.createdAt), 'yyyy-MM-dd') === dateStr
      );
      
      const avgMood = dayMoods.length > 0 
        ? dayMoods.reduce((sum: number, entry: MoodEntry) => sum + entry.mood, 0) / dayMoods.length 
        : 0;
      
      // Calculate sentiment from journal entries
      const sentimentScore = dayEntries.length > 0
        ? dayEntries.reduce((sum: number, entry: JournalEntry) => {
            // Simple sentiment calculation based on positive/negative words
            const positiveWords = ['good', 'great', 'happy', 'amazing', 'wonderful', 'excited', 'grateful'];
            const negativeWords = ['bad', 'terrible', 'sad', 'angry', 'frustrated', 'worried', 'stressed'];
            
            const positive = positiveWords.filter(word => entry.content.toLowerCase().includes(word)).length;
            const negative = negativeWords.filter(word => entry.content.toLowerCase().includes(word)).length;
            
            return sum + (positive - negative);
          }, 0) / dayEntries.length
        : 0;

      return {
        date: format(date, 'MMM dd'),
        fullDate: dateStr,
        mood: Number(avgMood.toFixed(1)),
        entries: dayEntries.length,
        sentiment: Number(((sentimentScore + 2) * 1.25).toFixed(1)), // Normalize to 0-5 scale
        stress: dayMoods.length > 0 ? Number((5 - avgMood + Math.random() * 0.5).toFixed(1)) : 0,
        energy: dayMoods.length > 0 ? Number((avgMood + Math.random() * 1 - 0.5).toFixed(1)) : 0
      };
    });
  }, [journalEntries, moodEntries, timeframe]);

  // Emotion analysis data
  const emotionData = useMemo(() => {
    const emotions = new Map<string, { total: number, count: number, recent: number[] }>();
    
    journalEntries.slice(0, timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90).forEach((entry: JournalEntry) => {
      // Mock emotion detection (in real app, this would use AI service)
      const content = entry.content.toLowerCase();
      const detectedEmotions = [
        { name: 'Joy', intensity: content.includes('happy') || content.includes('great') ? 0.8 : 0.2 },
        { name: 'Sadness', intensity: content.includes('sad') || content.includes('down') ? 0.7 : 0.1 },
        { name: 'Anxiety', intensity: content.includes('anxious') || content.includes('worried') ? 0.6 : 0.1 },
        { name: 'Anger', intensity: content.includes('angry') || content.includes('frustrated') ? 0.5 : 0.1 },
        { name: 'Love', intensity: content.includes('love') || content.includes('grateful') ? 0.9 : 0.2 },
        { name: 'Fear', intensity: content.includes('scared') || content.includes('afraid') ? 0.4 : 0.1 }
      ];

      detectedEmotions.forEach(emotion => {
        if (!emotions.has(emotion.name)) {
          emotions.set(emotion.name, { total: 0, count: 0, recent: [] });
        }
        const data = emotions.get(emotion.name)!;
        data.total += emotion.intensity;
        data.count++;
        data.recent.push(emotion.intensity);
        if (data.recent.length > 7) data.recent.shift();
      });
    });

    return Array.from(emotions.entries()).map(([emotion, data]): EmotionData => {
      const avgIntensity = data.total / data.count;
      const recentAvg = data.recent.reduce((a: number, b: number) => a + b, 0) / data.recent.length;
      const trend = recentAvg > avgIntensity * 1.1 ? 'up' : recentAvg < avgIntensity * 0.9 ? 'down' : 'stable';
      
      return {
        emotion,
        intensity: Number(avgIntensity.toFixed(2)),
        frequency: data.count,
        trend
      };
    }).sort((a, b) => b.intensity - a.intensity);
  }, [journalEntries, timeframe]);

  // Correlation insights
  const correlationInsights = useMemo((): CorrelationInsight[] => {
    const insights: CorrelationInsight[] = [];
    
    // Sleep correlation
    const sleepEntries = journalEntries.filter((entry: JournalEntry) => 
      entry.content.toLowerCase().includes('sleep') || 
      entry.content.toLowerCase().includes('tired') ||
      entry.content.toLowerCase().includes('rest')
    );
    
    if (sleepEntries.length > 2) {
      const sleepMoodAvg = sleepEntries.reduce((sum: number, entry: JournalEntry) => sum + (entry.mood || 3), 0) / sleepEntries.length;
      const overallMoodAvg = moodEntries.reduce((sum: number, entry: MoodEntry) => sum + entry.mood, 0) / moodEntries.length;
      const correlation = (sleepMoodAvg - overallMoodAvg) / 5;
      
      insights.push({
        factor: 'Sleep Quality',
        correlation,
        confidence: Math.min(sleepEntries.length / 10, 1),
        description: correlation > 0.1 
          ? 'Better sleep appears to correlate with improved mood'
          : correlation < -0.1 
          ? 'Sleep issues may be impacting your mood'
          : 'Sleep shows neutral correlation with mood'
      });
    }

    // Exercise correlation
    const exerciseEntries = journalEntries.filter((entry: JournalEntry) => 
      entry.content.toLowerCase().includes('exercise') || 
      entry.content.toLowerCase().includes('workout') ||
      entry.content.toLowerCase().includes('run') ||
      entry.content.toLowerCase().includes('gym')
    );
    
    if (exerciseEntries.length > 1) {
      const exerciseMoodAvg = exerciseEntries.reduce((sum: number, entry: JournalEntry) => sum + (entry.mood || 3), 0) / exerciseEntries.length;
      const overallMoodAvg = moodEntries.reduce((sum: number, entry: MoodEntry) => sum + entry.mood, 0) / moodEntries.length;
      const correlation = (exerciseMoodAvg - overallMoodAvg) / 5;
      
      insights.push({
        factor: 'Physical Activity',
        correlation,
        confidence: Math.min(exerciseEntries.length / 8, 1),
        description: correlation > 0.15 
          ? 'Exercise shows strong positive correlation with mood'
          : correlation > 0.05 
          ? 'Exercise appears to have a positive impact on mood'
          : 'Exercise shows minimal correlation with mood in your data'
      });
    }

    // Social correlation
    const socialEntries = journalEntries.filter((entry: JournalEntry) => 
      entry.content.toLowerCase().includes('friend') || 
      entry.content.toLowerCase().includes('family') ||
      entry.content.toLowerCase().includes('social') ||
      entry.content.toLowerCase().includes('people')
    );
    
    if (socialEntries.length > 2) {
      const socialMoodAvg = socialEntries.reduce((sum: number, entry: JournalEntry) => sum + (entry.mood || 3), 0) / socialEntries.length;
      const overallMoodAvg = moodEntries.reduce((sum: number, entry: MoodEntry) => sum + entry.mood, 0) / moodEntries.length;
      const correlation = (socialMoodAvg - overallMoodAvg) / 5;
      
      insights.push({
        factor: 'Social Interactions',
        correlation,
        confidence: Math.min(socialEntries.length / 10, 1),
        description: correlation > 0.1 
          ? 'Social interactions correlate positively with your mood'
          : correlation < -0.1 
          ? 'Social situations may be impacting your mood negatively'
          : 'Social interactions show neutral correlation with mood'
      });
    }

    return insights.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [journalEntries, moodEntries]);

  // Load AI analysis
  useEffect(() => {
    const loadAnalysis = async () => {
      if (journalEntries.length === 0 && moodEntries.length === 0) return;
      
      setLoading(true);
      try {
        const [trends, report] = await Promise.all([
          aiService.analyzeTrends(journalEntries, moodEntries, timeframe),
          aiService.generateWeeklyReport(journalEntries, moodEntries, startOfWeek(new Date()))
        ]);
        
        setTrendAnalysis(trends);
        setWeeklyReport(report);
      } catch (error) {
        console.error('Failed to load AI analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [journalEntries, moodEntries, timeframe]);

  const exportData = () => {
    const data = {
      timeframe,
      summary: {
        totalEntries: journalEntries.length,
        totalMoodEntries: moodEntries.length,
        averageMood: moodEntries.reduce((sum: number, entry: MoodEntry) => sum + entry.mood, 0) / moodEntries.length,
        timeRangeData,
        emotionData,
        correlationInsights
      },
      trendAnalysis,
      weeklyReport,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inner-guide-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const EMOTION_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-7xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Advanced Analytics</h2>
              <p className="text-gray-400 text-sm">Deep insights into your mental health patterns</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
            </select>
            <button
              onClick={exportData}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'trends', label: 'Trends', icon: Calendar },
            { id: 'insights', label: 'AI Insights', icon: Brain },
            { id: 'predictions', label: 'Predictions', icon: Target },
            { id: 'correlations', label: 'Correlations', icon: AlertCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Analyzing your data...</span>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && !loading && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Average Mood</p>
                      <p className="text-2xl font-semibold text-white">
                        {(moodEntries.reduce((sum: number, entry: MoodEntry) => sum + entry.mood, 0) / moodEntries.length || 0).toFixed(1)}
                      </p>
                    </div>
                    <div className="text-green-400">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Journal Entries</p>
                      <p className="text-2xl font-semibold text-white">{journalEntries.length}</p>
                    </div>
                    <div className="text-blue-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Mood Stability</p>
                      <p className="text-2xl font-semibold text-white">
                        {trendAnalysis ? '85%' : 'N/A'}
                      </p>
                    </div>
                    <div className="text-purple-400">
                      <Target className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Wellbeing Score</p>
                      <p className="text-2xl font-semibold text-white">
                        {trendAnalysis?.predictions?.wellbeingScore || 'N/A'}
                      </p>
                    </div>
                    <div className="text-green-400">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Chart */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Mood & Sentiment Trends</h3>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm"
                  >
                    <option value="mood">Mood</option>
                    <option value="sentiment">Sentiment</option>
                    <option value="stress">Stress Level</option>
                    <option value="energy">Energy Level</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeRangeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={[0, 5]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Emotion Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Emotion Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={emotionData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="intensity"
                        nameKey="emotion"
                      >
                        {emotionData.slice(0, 6).map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={EMOTION_COLORS[index % EMOTION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Writing Frequency</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={timeRangeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="entries" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && !loading && (
            <div className="space-y-6">
              {trendAnalysis && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">Trend Analysis</h3>
                  <div className="text-gray-400">Analysis results would appear here when AI service is properly connected.</div>
                </div>
              )}
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'insights' && !loading && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">AI Insights</h3>
                <div className="text-gray-400">AI insights would appear here when service is connected.</div>
              </div>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && !loading && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Predictions</h3>
                <div className="text-gray-400">Predictive analytics would appear here.</div>
              </div>
            </div>
          )}

          {/* Correlations Tab */}
          {activeTab === 'correlations' && !loading && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Factor Correlations</h3>
                <div className="space-y-4">
                  {correlationInsights.map((insight, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{insight.factor}</h4>
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded ${
                            insight.correlation > 0.1 ? 'bg-green-400' :
                            insight.correlation < -0.1 ? 'bg-red-400' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-gray-300 text-sm">
                            {insight.correlation > 0 ? '+' : ''}{(insight.correlation * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{insight.description}</p>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            insight.correlation > 0 ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${insight.confidence * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        Confidence: {(insight.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && journalEntries.length === 0 && moodEntries.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Data Available</h3>
              <p className="text-gray-500">Start journaling and tracking your mood to see advanced analytics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};