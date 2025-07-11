import React, { useState, useEffect } from 'react';
import { Save, X, Loader2, Hash, Clock, ChevronDown, ChevronRight } from 'lucide-react';

interface AddEntryFormProps {
  content: string;
  onChange: (content: string) => void;
  onSubmit: (content: string, entryData?: EntryData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface EntryData {
  tags?: string[];
  mood?: number;
  date?: string;
  time?: string;
  city?: string;
  country?: string;
}

const MOOD_OPTIONS = [
  { value: 1, label: 'Terrible', emoji: '😢', color: 'from-red-500 to-red-600' },
  { value: 2, label: 'Poor', emoji: '😔', color: 'from-orange-500 to-orange-600' },
  { value: 3, label: 'Okay', emoji: '😐', color: 'from-yellow-500 to-yellow-600' },
  { value: 4, label: 'Good', emoji: '😊', color: 'from-green-500 to-green-600' },
  { value: 5, label: 'Great', emoji: '😄', color: 'from-blue-500 to-blue-600' }
];

export const AddEntryForm: React.FC<AddEntryFormProps> = ({
  content,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false); // Minimized by default
  
  // Date/Time/Location fields - always editable
  const [entryDate, setEntryDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [entryTime, setEntryTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    setWordCount(count);
    setReadingTime(Math.ceil(count / 200));
  }, [content]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (_position) => {
          try {
            setCity('Current Location');
            setCountry('Auto-detected');
          } catch (error) {
            console.log('Could not determine location');
          }
        },
        (_error) => {
          console.log('Location access denied');
        }
      );
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryData: EntryData = {
      tags,
      mood: selectedMood || undefined,
      date: entryDate,
      time: entryTime,
      city: city.trim() || undefined,
      country: country.trim() || undefined
    };
    onSubmit(content, entryData);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      const newTag = currentTag.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const setToNow = () => {
    const now = new Date();
    setEntryDate(now.toISOString().split('T')[0]);
    setEntryTime(now.toTimeString().slice(0, 5));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      {/* Main Content Area */}
      <div>
        <label htmlFor="entry-content" className="block text-sm font-semibold text-purple-300 mb-3">
          ✨ What's on your mind?
        </label>
        <textarea
          id="entry-content"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Share your thoughts, feelings, or experiences... Write freely and authentically."
          className="w-full h-40 bg-slate-800/50 border border-purple-500/30 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 shadow-[0_0_20px_rgba(139,69,255,0.15)] resize-none backdrop-blur-sm"
          autoFocus
        />
        
        {/* Writing Stats */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Hash className="w-3 h-3" />
              <span>{wordCount} words</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{readingTime} min read</span>
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Metadata Section */}
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-xl overflow-hidden backdrop-blur-sm">
        {/* Toggle Header */}
        <button
          type="button"
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/10 transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">📊</span>
            <span className="text-sm font-semibold text-purple-300">
              Mood & Details
            </span>
            {selectedMood && (
              <span className="text-sm text-gray-400">
                ({MOOD_OPTIONS.find(m => m.value === selectedMood)?.emoji} {MOOD_OPTIONS.find(m => m.value === selectedMood)?.label})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {isMetadataExpanded ? 'Hide' : 'Show'}
            </span>
            {isMetadataExpanded ? (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-purple-400" />
            )}
          </div>
        </button>

        {/* Collapsible Content */}
        {isMetadataExpanded && (
          <div className="p-4 pt-0 space-y-6 animate-slide-down">
            {/* Mood Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-purple-300">
                😊 How are you feeling?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 group ${
                      selectedMood === mood.value
                        ? `bg-gradient-to-br ${mood.color} border-white/30 shadow-[0_0_25px_rgba(139,69,255,0.4)] scale-105`
                        : 'bg-slate-800/50 border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(139,69,255,0.2)]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className={`text-xs font-medium ${
                      selectedMood === mood.value ? 'text-white' : 'text-gray-300'
                    }`}>
                      {mood.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-purple-300">
                🏷️ Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600/80 to-purple-700/80 text-white text-sm rounded-full border border-purple-400/30 shadow-[0_0_10px_rgba(139,69,255,0.3)]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-purple-200 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add a tag and press Enter..."
                className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 shadow-[0_0_15px_rgba(139,69,255,0.1)]"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">
                  📅 Date
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="flex-1 bg-slate-800/50 border border-purple-500/30 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 shadow-[0_0_15px_rgba(139,69,255,0.1)]"
                  />
                  <button
                    type="button"
                    onClick={setToNow}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(255,165,0,0.3)] hover:shadow-[0_0_20px_rgba(255,165,0,0.5)]"
                    title="Set to current date/time"
                  >
                    ⏰ Now
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">
                  🕐 Time
                </label>
                <input
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 shadow-[0_0_15px_rgba(139,69,255,0.1)]"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">
                  🏙️ City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Current Location"
                  className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 shadow-[0_0_15px_rgba(139,69,255,0.1)]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">
                  🌍 Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Auto-detected"
                  className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 shadow-[0_0_15px_rgba(139,69,255,0.1)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>💾 Save Entry</span>
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] disabled:shadow-none"
        >
          <X className="w-5 h-5" />
          <span>❌ Cancel</span>
        </button>
      </div>
    </form>
  );
};