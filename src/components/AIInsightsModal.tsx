import React from 'react';
import { X, Brain, Lightbulb, TrendingUp, MessageCircle } from 'lucide-react';
import type { EnhancedAIInsights } from '../types';

interface AIInsightsModalProps {
  insights: EnhancedAIInsights;
  onClose: () => void;
}

export const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ insights, onClose }) => {
  if (!insights) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl max-w-4xl max-h-[80vh] w-full overflow-hidden border border-purple-500/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-purple-900/30 to-violet-900/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Insights</h2>
              <p className="text-slate-300 text-sm">Deep analysis of your journal entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Sentiment Analysis */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Sentiment Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Overall Sentiment</p>
                <p className={`text-xl font-semibold capitalize ${
                  insights.sentiment.label === 'positive' ? 'text-green-400' :
                  insights.sentiment.label === 'negative' ? 'text-red-400' : 'text-slate-300'
                }`}>
                  {insights.sentiment.label}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Confidence</p>
                <p className="text-xl font-semibold text-white">
                  {Math.round(insights.sentiment.confidence * 100)}%
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Score</p>
                <p className="text-xl font-semibold text-white">
                  {insights.sentiment.score.toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* Emotions */}
            {insights.sentiment.emotions && insights.sentiment.emotions.length > 0 && (
              <div className="mt-4">
                <p className="text-slate-300 text-sm mb-3">Detected Emotions:</p>
                <div className="flex flex-wrap gap-2">
                  {insights.sentiment.emotions.map((emotion: { name: string; intensity: number }, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                    >
                      {emotion.name} ({Math.round(emotion.intensity * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Themes */}
          {insights.themes && insights.themes.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-400" />
                Key Themes
              </h3>
              <div className="flex flex-wrap gap-2">
                {insights.themes.map((theme: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {insights.suggestions && insights.suggestions.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                Suggestions
              </h3>
              <div className="space-y-3">
                {insights.suggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-slate-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflection Prompts */}
          {insights.reflectionPrompts && insights.reflectionPrompts.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-purple-400" />
                Reflection Prompts
              </h3>
              <div className="space-y-3">
                {insights.reflectionPrompts.map((prompt: string, index: number) => (
                  <div key={index} className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-slate-300 italic">"{prompt}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Writing Patterns */}
          {insights.writingPatterns && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Writing Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Complexity</p>
                  <p className="text-white font-medium capitalize">{insights.writingPatterns.complexity}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Word Count</p>
                  <p className="text-white font-medium">{insights.writingPatterns.wordCount}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Reading Level</p>
                  <p className="text-white font-medium">{insights.writingPatterns.readingLevel}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Tone</p>
                  <p className="text-white font-medium capitalize">{insights.writingPatterns.tone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Personalized Insights */}
          {insights.personalizedInsights && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Personalized Insights</h3>
              
              {insights.personalizedInsights.recommendations && insights.personalizedInsights.recommendations.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-purple-300 font-medium mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {insights.personalizedInsights.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
                        <p className="text-slate-300 text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {insights.personalizedInsights.trends && insights.personalizedInsights.trends.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-blue-300 font-medium mb-2">Trends</h4>
                  <div className="space-y-2">
                    {insights.personalizedInsights.trends.map((trend: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                        <p className="text-slate-300 text-sm">{trend}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {insights.personalizedInsights.concerns && insights.personalizedInsights.concerns.length > 0 && (
                <div>
                  <h4 className="text-orange-300 font-medium mb-2">Areas to Watch</h4>
                  <div className="space-y-2">
                    {insights.personalizedInsights.concerns.map((concern: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2"></div>
                        <p className="text-slate-300 text-sm">{concern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <p className="text-slate-400 text-xs text-center">
            Generated on {new Date(insights.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};