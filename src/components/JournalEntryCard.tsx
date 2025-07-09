import React, { useState } from 'react';
import { MapPin, Clock, Brain, Trash2, Eye, EyeOff, Loader2, Sparkles, Edit3, Save, X } from 'lucide-react';
import type { JournalEntry } from '../types';
import { useAppStore } from '../stores';
import { AIInsightsModal } from './AIInsightsModal.tsx';

interface JournalEntryCardProps {
  entry: JournalEntry;
}

export const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry }) => {
  const { deleteJournalEntry, updateJournalEntry, analyzeEntry, isAnalyzing } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(entry.content);
  const [editedDate, setEditedDate] = useState(entry.date);
  const [editedTime, setEditedTime] = useState(entry.time);
  const [editedCity, setEditedCity] = useState(entry.location?.city || '');
  const [editedCountry, setEditedCountry] = useState(entry.location?.country || '');

  const handleDelete = async () => {
    if (!entry.id) return;
    
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setIsDeleting(true);
      try {
        await deleteJournalEntry(entry.id);
      } catch (error) {
        console.error('Failed to delete entry:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAnalyze = async () => {
    await analyzeEntry(entry);
    setShowAIInsights(true);
  };

  const handleSaveEdit = async () => {
    if (!entry.id) return;
    
    try {
      const updates: Partial<JournalEntry> = {
        content: editedContent,
        date: editedDate,
        time: editedTime,
        location: entry.location ? {
          ...entry.location,
          city: editedCity,
          country: editedCountry
        } : undefined
      };
      
      await updateJournalEntry(entry.id, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(entry.content);
    setEditedDate(entry.date);
    setEditedTime(entry.time);
    setEditedCity(entry.location?.city || '');
    setEditedCountry(entry.location?.country || '');
    setIsEditing(false);
  };

  const previewText = entry.content.length > 150 
    ? entry.content.substring(0, 150) + '...' 
    : entry.content;

  return (
    <>
      <div className="glass-card p-6 group hover:shadow-2xl transition-all duration-300">
        {/* Header with metadata */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/30">
                  <Clock className="w-4 h-4 text-purple-300" />
                  <input
                    type="date"
                    value={editedDate.split(', ')[1] ? new Date(editedDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedDate(new Date(e.target.value).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }))}
                    className="bg-transparent border-none text-purple-200 text-sm focus:outline-none"
                  />
                  <span className="text-purple-300">at</span>
                  <input
                    type="time"
                    value={editedTime.includes('AM') || editedTime.includes('PM') ? 
                      new Date(`1970-01-01 ${editedTime}`).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : 
                      editedTime}
                    onChange={(e) => setEditedTime(new Date(`1970-01-01 ${e.target.value}`).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }))}
                    className="bg-transparent border-none text-purple-200 text-sm focus:outline-none"
                  />
                </div>
                
                <div className="flex items-center space-x-2 bg-violet-500/20 px-4 py-2 rounded-full border border-violet-400/30">
                  <MapPin className="w-4 h-4 text-violet-300" />
                  <input
                    type="text"
                    value={editedCity}
                    onChange={(e) => setEditedCity(e.target.value)}
                    placeholder="City"
                    className="bg-transparent border-none text-violet-200 text-sm focus:outline-none w-20"
                  />
                  <span className="text-violet-300">,</span>
                  <input
                    type="text"
                    value={editedCountry}
                    onChange={(e) => setEditedCountry(e.target.value)}
                    placeholder="Country"
                    className="bg-transparent border-none text-violet-200 text-sm focus:outline-none w-24"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/30">
                  <Clock className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200 font-medium">{entry.date} at {entry.time}</span>
                </div>
                
                {entry.location && (
                  <div className="flex items-center space-x-2 bg-violet-500/20 px-4 py-2 rounded-full border border-violet-400/30">
                    <MapPin className="w-4 h-4 text-violet-300" />
                    <span className="text-violet-200 font-medium">
                      {entry.location.flag} {entry.location.city}, {entry.location.country}
                    </span>
                  </div>
                )}
              </>
            )}
            
            {entry.moonPhase && (
              <div className="flex items-center space-x-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-400/30">
                <span className="text-xl">{entry.moonPhase.emoji}</span>
                <span className="text-indigo-200 font-medium text-xs">{entry.moonPhase.phase}</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="icon-btn bg-green-500/20 border-green-400/30 text-green-300 hover:bg-green-500/30"
                  title="Save changes"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="icon-btn bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30"
                  title="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="icon-btn"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => setIsEditing(true)}
                  className="icon-btn bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30"
                  title="Edit entry"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="icon-btn bg-violet-500/20 border-violet-400/30 text-violet-300 hover:bg-violet-500/30 disabled:opacity-50"
                  title="AI Insights"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="icon-btn bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                  title="Delete"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-slate-100 leading-relaxed">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="textarea-field h-40"
              placeholder="Write your thoughts..."
            />
          ) : (
            <p className="whitespace-pre-wrap text-slate-200 leading-relaxed">
              {isExpanded ? entry.content : previewText}
            </p>
          )}
        </div>

        {/* AI Insights Preview */}
        {entry.aiInsights && !isEditing && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-600/20 via-violet-600/20 to-indigo-600/20 rounded-xl border border-purple-400/30 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/30 rounded-xl border border-purple-400/40">
                <Brain className="w-5 h-5 text-purple-300" />
              </div>
              <span className="text-lg font-semibold text-white">AI Insights</span>
              <Sparkles className="w-5 h-5 text-violet-300 animate-pulse" />
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Sentiment: <span className="text-purple-300 font-medium">{entry.aiInsights.sentiment.label}</span> ({Math.round(entry.aiInsights.sentiment.confidence * 100)}% confidence)
            </p>
            <button
              onClick={() => setShowAIInsights(true)}
              className="text-sm text-purple-300 hover:text-purple-200 font-medium hover:underline transition-colors flex items-center space-x-2"
            >
              <span>View full analysis</span>
              <span className="text-purple-400">→</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Insights Modal */}
      {showAIInsights && entry.aiInsights && (
        <AIInsightsModal
          insights={entry.aiInsights}
          onClose={() => setShowAIInsights(false)}
        />
      )}
    </>
  );
};