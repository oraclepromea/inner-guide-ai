import React, { useState, useEffect } from 'react';
import { Save, X, Loader2, Tag, Smile, Hash, Clock, MapPin, Calendar } from 'lucide-react';

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
  { value: 1, label: 'Terrible', emoji: '😢', color: 'text-red-500' },
  { value: 2, label: 'Poor', emoji: '😔', color: 'text-orange-500' },
  { value: 3, label: 'Okay', emoji: '😐', color: 'text-yellow-500' },
  { value: 4, label: 'Good', emoji: '😊', color: 'text-green-500' },
  { value: 5, label: 'Great', emoji: '😄', color: 'text-blue-500' }
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
  
  // Date/Time/Location fields - always editable
  const [entryDate, setEntryDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  const [entryTime, setEntryTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // HH:MM format
  });
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    setWordCount(count);
    setReadingTime(Math.ceil(count / 200)); // Average reading speed: 200 words/minute
  }, [content]);

  // Try to get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (_position) => {
          try {
            // For demo purposes, set some default values
            // In a real app, you'd use a geocoding service
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

  const selectedMoodData = MOOD_OPTIONS.find(option => option.value === selectedMood);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      {/* Main Content Area */}
      <div>
        <label htmlFor="entry-content" className="block text-sm font-semibold text-primary-300 mb-3">
          What's on your mind?
        </label>
        <textarea
          id="entry-content"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Share your thoughts, feelings, or experiences... Write freely and authentically."
          className="textarea-field w-full h-40 shadow-inner-glow resize-none"
          autoFocus
        />
        
        {/* Writing Stats */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
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

      {/* Always Visible Entry Details Section */}
      <div className="space-y-6 p-6 bg-gradient-to-r from-slate-800/30 via-slate-700/20 to-slate-800/30 rounded-xl border border-slate-600/30 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Entry Details</h3>
        
        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-primary-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={setToNow}
                className="btn-ghost text-xs px-3"
                title="Set to current date/time"
              >
                Now
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-primary-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Time
            </label>
            <input
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              className="input-field w-full"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-primary-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., New York, London, Tokyo"
              className="input-field w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-primary-300 mb-2">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g., United States, United Kingdom, Japan"
              className="input-field w-full"
            />
          </div>
        </div>

        {/* Mood Selection */}
        <div>
          <label className="block text-sm font-semibold text-primary-300 mb-3">
            <Smile className="w-4 h-4 inline mr-1" />
            How are you feeling?
          </label>
          <div className="flex space-x-2">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedMood(option.value)}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedMood === option.value
                    ? 'border-primary-500 bg-primary-500/20 shadow-lg'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                title={option.label}
              >
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-xs text-gray-400">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-primary-300 mb-3">
            <Tag className="w-4 h-4 inline mr-1" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm border border-primary-500/30 shadow-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-primary-400 hover:text-red-400 transition-colors"
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
            placeholder="Add tags (press Enter to add) - e.g., work, personal, gratitude"
            className="input-field w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tags help organize and find your entries later
          </p>
        </div>
      </div>
      
      {/* Summary and Actions */}
      <div className="flex items-center justify-between p-4 bg-slate-800/20 rounded-lg border border-slate-600/20">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(entryDate).toLocaleDateString()}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{entryTime}</span>
          </span>
          {(city || country) && (
            <span className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>{[city, country].filter(Boolean).join(', ')}</span>
            </span>
          )}
          {selectedMoodData && (
            <span className="flex items-center space-x-1">
              <span>{selectedMoodData.emoji}</span>
              <span>Feeling {selectedMoodData.label}</span>
            </span>
          )}
          {tags.length > 0 && (
            <span className="flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>{tags.length} tag{tags.length !== 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="btn-primary flex items-center space-x-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Saving...' : 'Save Entry'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};