import React, { useState, useMemo } from 'react';
import { Search, Filter, Tag, Smile, SortAsc, SortDesc, X } from 'lucide-react';
import { useAppStore } from '../stores';
import type { JournalEntry } from '../types';
import { JournalEntryCard } from './JournalEntryCard.tsx';
import { AddEntryForm } from './AddEntryForm.tsx';
import { AIInsightsModal } from './AIInsightsModal';

export const JournalTab: React.FC = () => {
  const { journalEntries, addJournalEntry } = useAppStore();
  const [newEntryContent, setNewEntryContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [moodFilter, setMoodFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'mood'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // Get all unique tags from entries
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    journalEntries.forEach((entry: JournalEntry) => {
      entry.tags?.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [journalEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = journalEntries;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry: JournalEntry) => 
        entry.content.toLowerCase().includes(query) ||
        entry.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((entry: JournalEntry) => 
        selectedTags.every(tag => entry.tags?.includes(tag))
      );
    }

    // Mood filter
    if (moodFilter !== null) {
      filtered = filtered.filter((entry: JournalEntry) => entry.mood === moodFilter);
    }

    // Sort
    filtered.sort((a: JournalEntry, b: JournalEntry) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        // Use entry.date first (YYYY-MM-DD format), then fallback to createdAt for chronological ordering
        const dateA = a.date ? new Date(a.date).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.date ? new Date(b.date).getTime() : new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
        
        // If dates are the same, use time or createdAt for sub-sorting
        if (comparison === 0) {
          if (a.time && b.time) {
            const timeA = new Date(`${a.date}T${a.time}`).getTime();
            const timeB = new Date(`${b.date}T${b.time}`).getTime();
            comparison = timeA - timeB;
          } else {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
        }
      } else if (sortBy === 'mood') {
        comparison = (a.mood || 0) - (b.mood || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [journalEntries, searchQuery, selectedTags, moodFilter, sortBy, sortOrder]);

  const handleAddEntry = async (content: string, entryData?: any) => {
    setIsSubmitting(true);
    try {
      await addJournalEntry({
        title: entryData?.title || `Entry ${new Date().toLocaleDateString()}`,
        content,
        date: new Date().toISOString().split('T')[0], // Add the required date field
        mood: entryData?.mood || 3,
        tags: entryData?.tags || []
      });
      setNewEntryContent('');
    } catch (error) {
      console.error('Failed to add entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setMoodFilter(null);
  };

  const activeFiltersCount = (searchQuery ? 1 : 0) + selectedTags.length + (moodFilter ? 1 : 0);

  // Remove the loading check since isLoadingJournal doesn't exist in AppState

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gradient-primary mb-2">Journal</h2>
            <p className="text-slate-300">
              {journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'}
              {filteredEntries.length !== journalEntries.length && (
                <span className="text-purple-300"> • {filteredEntries.length} filtered</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Always Visible Add Entry Form */}
      <div className="glass-card p-6 animate-slide-up">
        <AddEntryForm
          content={newEntryContent}
          onChange={setNewEntryContent}
          onSubmit={handleAddEntry}
          onCancel={() => setNewEntryContent('')}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Search and Filters Card */}
      <div className="glass-card p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
          <input
            type="text"
            placeholder="Search your thoughts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12 pr-4 text-base"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost flex items-center space-x-2 ${activeFiltersCount > 0 ? 'bg-purple-500/20 border-purple-400/40' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'mood')}
              className="input-field py-2 px-3 text-sm w-auto"
            >
              <option value="date">Sort by Date</option>
              <option value="mood">Sort by Mood</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="icon-btn"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <div className="space-y-6 p-6 bg-gradient-to-r from-purple-900/20 via-slate-800/30 to-purple-900/20 rounded-xl border border-purple-500/20 backdrop-blur-sm animate-slide-up">
            {/* Tags Filter */}
            <div>
              <label className="block text-lg font-semibold text-white mb-4">
                <Tag className="w-5 h-5 inline mr-2" />
                Filter by Tags
              </label>
              <div className="flex flex-wrap gap-3">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`tag-pill ${selectedTags.includes(tag) ? 'active' : ''}`}
                  >
                    #{tag}
                  </button>
                ))}
                {allTags.length === 0 && (
                  <span className="text-slate-400 text-sm italic">No tags found - add some entries first!</span>
                )}
              </div>
            </div>

            {/* Mood Filter */}
            <div>
              <label className="block text-lg font-semibold text-white mb-4">
                <Smile className="w-5 h-5 inline mr-2" />
                Filter by Mood
              </label>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5].map(mood => (
                  <button
                    key={mood}
                    onClick={() => setMoodFilter(moodFilter === mood ? null : mood)}
                    className={`tag-pill ${moodFilter === mood ? 'active' : ''}`}
                  >
                    {mood}/5
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="pt-4 border-t border-purple-500/20">
                <button
                  onClick={clearFilters}
                  className="btn-ghost text-sm flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear all filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="space-y-6">
        {filteredEntries.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            {journalEntries.length === 0 ? (
              <div className="space-y-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <span className="text-4xl">📝</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-white">Start Your Journey</h3>
                  <p className="text-slate-300 max-w-md mx-auto">
                    Begin documenting your thoughts, experiences, and insights. Use the form above to write your first entry!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <span className="text-4xl">🔍</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-white">No matches found</h3>
                  <p className="text-slate-300 max-w-md mx-auto">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map((entry: JournalEntry, index) => (
              <div key={entry.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <JournalEntryCard entry={entry} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights Modal */}
      {selectedEntry && (
        <AIInsightsModal
          insights={(() => {
            const entry = journalEntries.find((e: JournalEntry) => e.id?.toString() === selectedEntry);
            const aiInsights = entry?.aiInsights;
            
            // Convert AIAnalysisResult to EnhancedAIInsights format
            if (aiInsights) {
              return {
                sentiment: {
                  score: aiInsights.sentiment.score,
                  label: aiInsights.sentiment.label,
                  confidence: aiInsights.sentiment.confidence,
                  emotions: []
                },
                themes: aiInsights.themes || [],
                suggestions: aiInsights.suggestions || [],
                reflectionPrompts: aiInsights.reflectionPrompts || [],
                writingPatterns: {
                  complexity: 'moderate' as const,
                  tone: 'neutral',
                  keyPhrases: [],
                  wordCount: entry?.content?.split(' ').length || 0,
                  readingLevel: 'intermediate'
                },
                personalizedInsights: {
                  recommendations: [],
                  trends: [],
                  concerns: []
                },
                createdAt: new Date().toISOString()
              };
            }
            
            // Fallback empty insights
            return {
              sentiment: {
                score: 0,
                label: 'neutral' as const,
                confidence: 0,
                emotions: []
              },
              themes: [],
              suggestions: [],
              reflectionPrompts: [],
              writingPatterns: {
                complexity: 'moderate' as const,
                tone: 'neutral',
                keyPhrases: [],
                wordCount: 0,
                readingLevel: 'intermediate'
              },
              personalizedInsights: {
                recommendations: [],
                trends: [],
                concerns: []
              },
              createdAt: new Date().toISOString()
            };
          })()}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
};