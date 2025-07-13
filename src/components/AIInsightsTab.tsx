import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Heart, Lightbulb, Quote, Trash2, RefreshCw, MapPin, Calendar, Clock } from 'lucide-react';
import type { DeepAIInsight } from '../types';
import { useAppStore } from '../stores';
import { useNotificationHelpers } from './NotificationSystem';

// Helper function to get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  const flagMap: { [key: string]: string } = {
    'US': '🇺🇸', 'USA': '🇺🇸', 'United States': '🇺🇸',
    'CA': '🇨🇦', 'Canada': '🇨🇦',
    'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'GB': '🇬🇧',
    'FR': '🇫🇷', 'France': '🇫🇷',
    'DE': '🇩🇪', 'Germany': '🇩🇪',
    'IT': '🇮🇹', 'Italy': '🇮🇹',
    'ES': '🇪🇸', 'Spain': '🇪🇸',
    'JP': '🇯🇵', 'Japan': '🇯🇵',
    'AU': '🇦🇺', 'Australia': '🇦🇺',
    'BR': '🇧🇷', 'Brazil': '🇧🇷',
    'MX': '🇲🇽', 'Mexico': '🇲🇽',
    'IN': '🇮🇳', 'India': '🇮🇳',
    'CN': '🇨🇳', 'China': '🇨🇳',
    'RU': '🇷🇺', 'Russia': '🇷🇺',
    'KR': '🇰🇷', 'South Korea': '🇰🇷',
    'NL': '🇳🇱', 'Netherlands': '🇳🇱',
    'SE': '🇸🇪', 'Sweden': '🇸🇪',
    'NO': '🇳🇴', 'Norway': '🇳🇴',
    'DK': '🇩🇰', 'Denmark': '🇩🇰',
    'FI': '🇫🇮', 'Finland': '🇫🇮',
    'CH': '🇨🇭', 'Switzerland': '🇨🇭',
    'AT': '🇦🇹', 'Austria': '🇦🇹',
    'BE': '🇧🇪', 'Belgium': '🇧🇪',
    'PT': '🇵🇹', 'Portugal': '🇵🇹',
    'GR': '🇬🇷', 'Greece': '🇬🇷',
    'TR': '🇹🇷', 'Turkey': '🇹🇷',
    'PL': '🇵🇱', 'Poland': '🇵🇱',
    'CZ': '🇨🇿', 'Czech Republic': '🇨🇿',
    'HU': '🇭🇺', 'Hungary': '🇭🇺',
    'RO': '🇷🇴', 'Romania': '🇷🇴'
  };
  
  return flagMap[countryCode] || flagMap[countryCode.toUpperCase()] || '🌍';
};

// Emotion intensity color mapping
const getIntensityColor = (intensity: number): string => {
  if (intensity <= 2) return 'text-green-400';
  if (intensity <= 4) return 'text-yellow-400';
  if (intensity <= 6) return 'text-orange-400';
  if (intensity <= 8) return 'text-red-400';
  return 'text-red-600';
};

// Energy level icon mapping
const getEnergyIcon = (energy: string): string => {
  switch (energy) {
    case 'very low': return '🔋';
    case 'low': return '🔋';
    case 'moderate': return '⚡';
    case 'high': return '🔥';
    case 'very high': return '⭐';
    default: return '⚡';
  }
};

interface DeepInsightCardProps {
  insight: DeepAIInsight;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const DeepInsightCard: React.FC<DeepInsightCardProps> = ({ insight, onDelete, isDeleting }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card p-6 border-2 border-slate-700/50 hover:border-slate-600/70 bg-slate-800/80 backdrop-blur-sm rounded-xl transition-all duration-300">
      {/* Header with metadata */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Primary emotion with intensity */}
          <div className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/30">
            <Brain className="w-4 h-4 text-purple-300" />
            <span className="text-purple-200 font-medium capitalize">{insight.primaryEmotion}</span>
          </div>

          {/* Intensity display */}
          <div className="flex items-center space-x-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-400/30">
            <span className="text-lg">💗</span>
            <span className={`font-bold ${getIntensityColor(insight.intensity)}`}>
              Intensity: {insight.intensity}/10
            </span>
          </div>

          {/* Energy level */}
          <div className="flex items-center space-x-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-400/30">
            <span className="text-lg">{getEnergyIcon(insight.energy)}</span>
            <span className="text-yellow-200 font-medium capitalize">Energy: {insight.energy}</span>
          </div>

          {/* Date from original entry */}
          <div className="flex items-center space-x-2 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-400/30">
            <Calendar className="w-4 h-4 text-blue-300" />
            <span className="text-blue-200 font-medium">
              {insight.originalEntry.date}
              {insight.originalEntry.time && ` at ${insight.originalEntry.time}`}
            </span>
          </div>

          {/* Location if available */}
          {insight.originalEntry.location && (
            <div className="flex items-center space-x-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-400/30">
              <MapPin className="w-4 h-4 text-green-300" />
              <span className="text-lg">{getCountryFlag(insight.originalEntry.location.country)}</span>
              <span className="text-green-200 font-medium">
                {insight.originalEntry.location.city}, {insight.originalEntry.location.country}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-primary px-3 py-2 text-sm"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '👁️‍🗨️' : '👁️'}
          </button>
          
          <button
            onClick={() => onDelete(insight.id)}
            disabled={isDeleting}
            className="btn-danger px-3 py-2 text-sm disabled:opacity-50"
            title="Delete insight"
          >
            {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Original Entry Preview */}
      {!isExpanded && (
        <div className="mb-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Original Entry</h4>
          <p className="text-slate-200 text-sm leading-relaxed">
            {insight.originalEntry.content.length > 150 
              ? insight.originalEntry.content.substring(0, 150) + '...'
              : insight.originalEntry.content
            }
          </p>
        </div>
      )}

      {/* Expanded Original Entry */}
      {isExpanded && (
        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600/30">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Original Entry</h4>
          <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
            {insight.originalEntry.content}
          </p>
        </div>
      )}

      {/* Compassionate Reflection */}
      <div className="mb-6 p-6 bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-purple-600/20 rounded-xl border border-rose-400/30">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="w-5 h-5 text-rose-300" />
          <h3 className="text-lg font-semibold text-white">Compassionate Reflection</h3>
        </div>
        <p className="text-slate-200 leading-relaxed">
          {insight.compassionateReflection}
        </p>
      </div>

      {/* Key Insights */}
      {insight.keyInsights.length > 0 && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-teal-600/20 rounded-xl border border-blue-400/30">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className="w-5 h-5 text-blue-300" />
            <h3 className="text-lg font-semibold text-white">Key Insights</h3>
          </div>
          <ul className="space-y-2">
            {insight.keyInsights.map((insight_item, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-300 mt-1">•</span>
                <span className="text-slate-200">{insight_item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Spiritual Quote */}
      <div className="mb-6 p-6 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20 rounded-xl border border-violet-400/30">
        <div className="flex items-center space-x-3 mb-4">
          <Quote className="w-5 h-5 text-violet-300" />
          <h3 className="text-lg font-semibold text-white">Spiritual Guidance</h3>
        </div>
        <blockquote className="text-slate-200 italic text-lg leading-relaxed mb-3">
          "{insight.spiritualQuote.text}"
        </blockquote>
        <p className="text-violet-300 font-medium mb-2">
          — {insight.spiritualQuote.author}
        </p>
        <p className="text-slate-300 text-sm">
          {insight.spiritualQuote.relevance}
        </p>
      </div>

      {/* Reflection Questions */}
      {insight.reflectionQuestions.length > 0 && (
        <div className="mb-6 p-6 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-red-600/20 rounded-xl border border-amber-400/30">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="text-lg font-semibold text-white">Reflection Questions</h3>
          </div>
          <ul className="space-y-3">
            {insight.reflectionQuestions.map((question, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-amber-300 mt-1 font-bold">{index + 1}.</span>
                <span className="text-slate-200">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Themes */}
      {insight.themes.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Themes:</h4>
          <div className="flex flex-wrap gap-2">
            {insight.themes.map((theme, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 text-sm bg-indigo-500/20 text-indigo-200 rounded-full border border-indigo-400/30"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Healing Guidance, Shadow Work, Light Work - Only show if expanded */}
      {isExpanded && (
        <>
          {insight.healingGuidance && (
            <div className="mb-4 p-4 bg-emerald-600/20 rounded-lg border border-emerald-400/30">
              <h4 className="text-emerald-300 font-medium mb-2">🌿 Healing Guidance</h4>
              <p className="text-slate-200 text-sm leading-relaxed">{insight.healingGuidance}</p>
            </div>
          )}

          {insight.shadowWork && (
            <div className="mb-4 p-4 bg-gray-600/20 rounded-lg border border-gray-400/30">
              <h4 className="text-gray-300 font-medium mb-2">🌑 Shadow Work</h4>
              <p className="text-slate-200 text-sm leading-relaxed">{insight.shadowWork}</p>
            </div>
          )}

          {insight.lightWork && (
            <div className="mb-4 p-4 bg-yellow-600/20 rounded-lg border border-yellow-400/30">
              <h4 className="text-yellow-300 font-medium mb-2">✨ Light Work</h4>
              <p className="text-slate-200 text-sm leading-relaxed">{insight.lightWork}</p>
            </div>
          )}
        </>
      )}

      {/* Footer with confidence and creation time */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-slate-600/30">
        <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
        <span>
          <Clock className="w-3 h-3 inline mr-1" />
          {new Date(insight.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export const AIInsightsTab: React.FC = () => {
  const { deepInsights, journalEntries, getDeepInsights, deleteDeepInsight, generateDeepInsight } = useAppStore();
  const { success, error } = useNotificationHelpers();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  useEffect(() => {
    getDeepInsights();
  }, [getDeepInsights]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this AI insight?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDeepInsight(id);
      success('Insight deleted', 'The AI insight has been successfully deleted.');
    } catch (err) {
      error('Delete failed', 'Failed to delete the AI insight. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const generateInsightsForAllEntries = async () => {
    if (!window.confirm('Generate AI insights for all journal entries? This may take a while and use API credits.')) {
      return;
    }

    console.log('🔄 Starting AI insight generation for all entries...');
    console.log(`📊 Found ${journalEntries.length} journal entries`);
    console.log(`📊 Found ${deepInsights.length} existing insights`);

    setIsGeneratingAll(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < journalEntries.length; i++) {
        const entry = journalEntries[i];
        console.log(`\n🔍 Processing entry ${i + 1}/${journalEntries.length}:`, {
          id: entry.id,
          title: entry.title || 'Untitled',
          contentLength: entry.content?.length || 0,
          date: entry.date
        });

        // Check if insight already exists
        const existingInsight = deepInsights.find(insight => insight.journalEntryId === entry.id?.toString());
        if (existingInsight) {
          console.log(`⚠️ Skipping entry ${entry.id} - insight already exists`);
          continue;
        }

        try {
          console.log(`🤖 Generating AI insight for entry ${entry.id}...`);
          await generateDeepInsight(entry);
          console.log(`✅ Successfully generated insight for entry ${entry.id}`);
          successCount++;
        } catch (err) {
          console.error(`❌ Failed to generate insight for entry ${entry.id}:`, err);
          
          // Check for rate limiting
          if (err instanceof Error && err.message.includes('429')) {
            console.log('⏸️ Rate limit hit - waiting 70 seconds before continuing...');
            await new Promise(resolve => setTimeout(resolve, 70000)); // Wait 70 seconds for rate limit reset
            
            // Retry the same entry
            try {
              console.log(`🔄 Retrying entry ${entry.id} after rate limit wait...`);
              await generateDeepInsight(entry);
              console.log(`✅ Successfully generated insight for entry ${entry.id} (after retry)`);
              successCount++;
            } catch (retryErr) {
              console.error(`❌ Failed to generate insight for entry ${entry.id} even after retry:`, retryErr);
              errors.push(`Entry ${entry.id}: ${retryErr instanceof Error ? retryErr.message : 'Unknown error'}`);
              errorCount++;
            }
          } else {
            errors.push(`Entry ${entry.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            errorCount++;
          }
        }
        
        // Longer delay between requests to avoid rate limits (65 seconds for free tier)
        if (i < journalEntries.length - 1) { // Don't wait after the last entry
          console.log('⏳ Waiting 65 seconds before next request to avoid rate limits...');
          await new Promise(resolve => setTimeout(resolve, 65000));
        }
      }

      console.log(`\n📈 Generation complete! Success: ${successCount}, Errors: ${errorCount}`);
      if (errors.length > 0) {
        console.log('❌ Error details:', errors);
      }

      if (successCount > 0) {
        success(
          'Insights generated',
          `Successfully generated ${successCount} AI insights${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`
        );
      } else if (errorCount > 0) {
        error('Generation failed', `Failed to generate insights for ${errorCount} entries. Check console for details.`);
      } else {
        success('Already complete', 'All journal entries already have AI insights.');
      }
    } catch (err) {
      console.error('❌ Critical error in generateInsightsForAllEntries:', err);
      error('Generation failed', 'Failed to generate AI insights. Check console for details.');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const entriesWithoutInsights = journalEntries.filter(entry => 
    !deepInsights.some(insight => insight.journalEntryId === entry.id?.toString())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-400/50">
            <Brain className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Insights</h2>
            <p className="text-gray-400">Deep, compassionate analysis of your journal entries</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {entriesWithoutInsights.length > 0 && (
            <button
              onClick={generateInsightsForAllEntries}
              disabled={isGeneratingAll}
              className="btn-secondary px-4 py-2 text-sm flex items-center space-x-2 disabled:opacity-50"
            >
              {isGeneratingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>
                {isGeneratingAll 
                  ? 'Generating...' 
                  : `Generate for ${entriesWithoutInsights.length} entries`
                }
              </span>
            </button>
          )}
          
          <button
            onClick={() => getDeepInsights()}
            disabled={isGeneratingAll}
            className="btn-primary px-4 py-2 text-sm flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingAll ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-white">{deepInsights.length}</div>
              <div className="text-sm text-gray-400">AI Insights</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{journalEntries.length}</div>
              <div className="text-sm text-gray-400">Journal Entries</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-rose-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {journalEntries.length > 0 
                  ? Math.round((deepInsights.length / journalEntries.length) * 100)
                  : 0
                }%
              </div>
              <div className="text-sm text-gray-400">Coverage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights List */}
      {deepInsights.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No AI Insights Yet</h3>
          <p className="text-gray-400 mb-6">
            Start by writing journal entries, then generate AI insights to receive deep, compassionate analysis.
          </p>
          {journalEntries.length > 0 && (
            <button
              onClick={generateInsightsForAllEntries}
              className="btn-primary px-6 py-3 text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate AI Insights
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {deepInsights.map((insight) => (
            <DeepInsightCard
              key={insight.id}
              insight={insight}
              onDelete={handleDelete}
              isDeleting={deletingId === insight.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};