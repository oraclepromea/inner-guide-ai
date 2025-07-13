import React, { useState } from 'react';
import { Loader2, Sparkles, MapPin, Calendar, Edit, Trash2, Brain } from 'lucide-react';
import type { JournalEntry } from '../types';
import { useAppStore } from '../stores';
import { AIInsightsModal } from './AIInsightsModal.tsx';

interface JournalEntryCardProps {
  entry: JournalEntry;
}

// Helper function to get country flag emoji - Comprehensive coverage
const getCountryFlag = (countryCode: string): string => {
  const flagMap: { [key: string]: string } = {
    // Major countries and regions
    'US': '🇺🇸', 'USA': '🇺🇸', 'United States': '🇺🇸', 'America': '🇺🇸',
    'CA': '🇨🇦', 'Canada': '🇨🇦',
    'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'GB': '🇬🇧', 'Britain': '🇬🇧', 'England': '🇬🇧',
    'FR': '🇫🇷', 'France': '🇫🇷',
    'DE': '🇩🇪', 'Germany': '🇩🇪', 'Deutschland': '🇩🇪',
    'IT': '🇮🇹', 'Italy': '🇮🇹', 'Italia': '🇮🇹',
    'ES': '🇪🇸', 'Spain': '🇪🇸', 'España': '🇪🇸',
    'JP': '🇯🇵', 'Japan': '🇯🇵', '日本': '🇯🇵',
    'AU': '🇦🇺', 'Australia': '🇦🇺',
    'BR': '🇧🇷', 'Brazil': '🇧🇷', 'Brasil': '🇧🇷',
    'MX': '🇲🇽', 'Mexico': '🇲🇽', 'México': '🇲🇽',
    'IN': '🇮🇳', 'India': '🇮🇳',
    'CN': '🇨🇳', 'China': '🇨🇳', '中国': '🇨🇳',
    'RU': '🇷🇺', 'Russia': '🇷🇺', 'Россия': '🇷🇺',
    'KR': '🇰🇷', 'South Korea': '🇰🇷', 'Korea': '🇰🇷', '대한민국': '🇰🇷',
    
    // European countries
    'NL': '🇳🇱', 'Netherlands': '🇳🇱', 'Holland': '🇳🇱',
    'SE': '🇸🇪', 'Sweden': '🇸🇪', 'Sverige': '🇸🇪',
    'NO': '🇳🇴', 'Norway': '🇳🇴', 'Norge': '🇳🇴',
    'DK': '🇩🇰', 'Denmark': '🇩🇰', 'Danmark': '🇩🇰',
    'FI': '🇫🇮', 'Finland': '🇫🇮', 'Suomi': '🇫🇮',
    'CH': '🇨🇭', 'Switzerland': '🇨🇭', 'Schweiz': '🇨🇭',
    'AT': '🇦🇹', 'Austria': '🇦🇹', 'Österreich': '🇦🇹',
    'BE': '🇧🇪', 'Belgium': '🇧🇪', 'België': '🇧🇪',
    'PT': '🇵🇹', 'Portugal': '🇵🇹',
    'GR': '🇬🇷', 'Greece': '🇬🇷', 'Ελλάδα': '🇬🇷',
    'TR': '🇹🇷', 'Turkey': '🇹🇷', 'Türkiye': '🇹🇷',
    'PL': '🇵🇱', 'Poland': '🇵🇱', 'Polska': '🇵🇱',
    'CZ': '🇨🇿', 'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿',
    'HU': '🇭🇺', 'Hungary': '🇭🇺', 'Magyarország': '🇭🇺',
    'RO': '🇷🇴', 'Romania': '🇷🇴', 'România': '🇷🇴',
    'BG': '🇧🇬', 'Bulgaria': '🇧🇬', 'България': '🇧🇬',
    'HR': '🇭🇷', 'Croatia': '🇭🇷', 'Hrvatska': '🇭🇷',
    'SI': '🇸🇮', 'Slovenia': '🇸🇮', 'Slovenija': '🇸🇮',
    'SK': '🇸🇰', 'Slovakia': '🇸🇰', 'Slovensko': '🇸🇰',
    'LT': '🇱🇹', 'Lithuania': '🇱🇹', 'Lietuva': '🇱🇹',
    'LV': '🇱🇻', 'Latvia': '🇱🇻', 'Latvija': '🇱🇻',
    'EE': '🇪🇪', 'Estonia': '🇪🇪', 'Eesti': '🇪🇪',
    'IE': '🇮🇪', 'Ireland': '🇮🇪', 'Éire': '🇮🇪',
    'IS': '🇮🇸', 'Iceland': '🇮🇸', 'Ísland': '🇮🇸',
    'MT': '🇲🇹', 'Malta': '🇲🇹',
    'CY': '🇨🇾', 'Cyprus': '🇨🇾', 'Κύπρος': '🇨🇾',
    'LU': '🇱🇺', 'Luxembourg': '🇱🇺',
    
    // Asia-Pacific
    'TH': '🇹🇭', 'Thailand': '🇹🇭', 'ไทย': '🇹🇭',
    'VN': '🇻🇳', 'Vietnam': '🇻🇳', 'Việt Nam': '🇻🇳',
    'SG': '🇸🇬', 'Singapore': '🇸🇬',
    'MY': '🇲🇾', 'Malaysia': '🇲🇾',
    'ID': '🇮🇩', 'Indonesia': '🇮🇩',
    'PH': '🇵🇭', 'Philippines': '🇵🇭',
    'NZ': '🇳🇿', 'New Zealand': '🇳🇿',
    'TW': '🇹🇼', 'Taiwan': '🇹🇼', '台灣': '🇹🇼',
    'HK': '🇭🇰', 'Hong Kong': '🇭🇰', '香港': '🇭🇰',
    'MO': '🇲🇴', 'Macau': '🇲🇴', '澳門': '🇲🇴',
    'KH': '🇰🇭', 'Cambodia': '🇰🇭',
    'LA': '🇱🇦', 'Laos': '🇱🇦',
    'MM': '🇲🇲', 'Myanmar': '🇲🇲', 'Burma': '🇲🇲',
    'BD': '🇧🇩', 'Bangladesh': '🇧🇩',
    'PK': '🇵🇰', 'Pakistan': '🇵🇰',
    'LK': '🇱🇰', 'Sri Lanka': '🇱🇰',
    'NP': '🇳🇵', 'Nepal': '🇳🇵',
    'BT': '🇧🇹', 'Bhutan': '🇧🇹',
    'MN': '🇲🇳', 'Mongolia': '🇲🇳',
    'KZ': '🇰🇿', 'Kazakhstan': '🇰🇿',
    
    // Middle East
    'SA': '🇸🇦', 'Saudi Arabia': '🇸🇦',
    'AE': '🇦🇪', 'UAE': '🇦🇪', 'United Arab Emirates': '🇦🇪',
    'IL': '🇮🇱', 'Israel': '🇮🇱',
    'PS': '🇵🇸', 'Palestine': '🇵🇸',
    'JO': '🇯🇴', 'Jordan': '🇯🇴',
    'LB': '🇱🇧', 'Lebanon': '🇱🇧',
    'SY': '🇸🇾', 'Syria': '🇸🇾',
    'IQ': '🇮🇶', 'Iraq': '🇮🇶',
    'IR': '🇮🇷', 'Iran': '🇮🇷',
    'KW': '🇰🇼', 'Kuwait': '🇰🇼',
    'QA': '🇶🇦', 'Qatar': '🇶🇦',
    'BH': '🇧🇭', 'Bahrain': '🇧🇭',
    'OM': '🇴🇲', 'Oman': '🇴🇲',
    'YE': '🇾🇪', 'Yemen': '🇾🇪',
    
    // Africa
    'ZA': '🇿🇦', 'South Africa': '🇿🇦',
    'EG': '🇪🇬', 'Egypt': '🇪🇬',
    'MA': '🇲🇦', 'Morocco': '🇲🇦',
    'DZ': '🇩🇿', 'Algeria': '🇩🇿',
    'TN': '🇹🇳', 'Tunisia': '🇹🇳',
    'LY': '🇱🇾', 'Libya': '🇱🇾',
    'ET': '🇪🇹', 'Ethiopia': '🇪🇹',
    'KE': '🇰🇪', 'Kenya': '🇰🇪',
    'TZ': '🇹🇿', 'Tanzania': '🇹🇿',
    'UG': '🇺🇬', 'Uganda': '🇺🇬',
    'RW': '🇷🇼', 'Rwanda': '🇷🇼',
    'GH': '🇬🇭', 'Ghana': '🇬🇭',
    'NG': '🇳🇬', 'Nigeria': '🇳🇬',
    'SN': '🇸🇳', 'Senegal': '🇸🇳',
    'CI': '🇨🇮', 'Ivory Coast': '🇨🇮', 'Côte d\'Ivoire': '🇨🇮',
    
    // Americas
    'AR': '🇦🇷', 'Argentina': '🇦🇷',
    'CL': '🇨🇱', 'Chile': '🇨🇱',
    'PE': '🇵🇪', 'Peru': '🇵🇪', 'Perú': '🇵🇪',
    'CO': '🇨🇴', 'Colombia': '🇨🇴',
    'VE': '🇻🇪', 'Venezuela': '🇻🇪',
    'EC': '🇪🇨', 'Ecuador': '🇪🇨',
    'BO': '🇧🇴', 'Bolivia': '🇧🇴',
    'PY': '🇵🇾', 'Paraguay': '🇵🇾',
    'UY': '🇺🇾', 'Uruguay': '🇺🇾',
    'GY': '🇬🇾', 'Guyana': '🇬🇾',
    'SR': '🇸🇷', 'Suriname': '🇸🇷',
    'CR': '🇨🇷', 'Costa Rica': '🇨🇷',
    'PA': '🇵🇦', 'Panama': '🇵🇦', 'Panamá': '🇵🇦',
    'GT': '🇬🇹', 'Guatemala': '🇬🇹',
    'HN': '🇭🇳', 'Honduras': '🇭🇳',
    'SV': '🇸🇻', 'El Salvador': '🇸🇻',
    'NI': '🇳🇮', 'Nicaragua': '🇳🇮',
    'BZ': '🇧🇿', 'Belize': '🇧🇿',
    'CU': '🇨🇺', 'Cuba': '🇨🇺',
    'JM': '🇯🇲', 'Jamaica': '🇯🇲',
    'DO': '🇩🇴', 'Dominican Republic': '🇩🇴',
    'HT': '🇭🇹', 'Haiti': '🇭🇹', 'Haïti': '🇭🇹',
    'TT': '🇹🇹', 'Trinidad and Tobago': '🇹🇹',
    'BB': '🇧🇧', 'Barbados': '🇧🇧',
    
    // Oceania
    'FJ': '🇫🇯', 'Fiji': '🇫🇯',
    'PG': '🇵🇬', 'Papua New Guinea': '🇵🇬',
    'TO': '🇹🇴', 'Tonga': '🇹🇴',
    'WS': '🇼🇸', 'Samoa': '🇼🇸',
    'VU': '🇻🇺', 'Vanuatu': '🇻🇺',
    'SB': '🇸🇧', 'Solomon Islands': '🇸🇧',
    'FM': '🇫🇲', 'Micronesia': '🇫🇲',
    'PW': '🇵🇼', 'Palau': '🇵🇼',
    'MH': '🇲🇭', 'Marshall Islands': '🇲🇭',
    'NR': '🇳🇷', 'Nauru': '🇳🇷',
    'KI': '🇰🇮', 'Kiribati': '🇰🇮',
    'TV': '🇹🇻', 'Tuvalu': '🇹🇻'
  };
  
  // Try exact match first, then case-insensitive match
  const flag = flagMap[countryCode] || flagMap[countryCode.toUpperCase()] || flagMap[countryCode.toLowerCase()];
  
  // If no flag found, try partial matching for common country name variations
  if (!flag) {
    const lowerCode = countryCode.toLowerCase();
    for (const [key, value] of Object.entries(flagMap)) {
      if (key.toLowerCase().includes(lowerCode) || lowerCode.includes(key.toLowerCase())) {
        return value;
      }
    }
  }
  
  // Return the flag or a default location pin emoji if no country match
  return flag || '📍';
};

export const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry }) => {
  console.log('🔍 JournalEntryCard rendered with entry:', { 
    id: entry.id, 
    title: entry.title,
    hasContent: !!entry.content,
    idType: typeof entry.id 
  });

  const { deleteJournalEntry, updateJournalEntry, generateDeepInsight, setActiveTab } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState(entry.title || '');
  const [editedContent, setEditedContent] = useState(entry.content);
  const [editedDate, setEditedDate] = useState(entry.date);
  const [editedTime, setEditedTime] = useState(entry.time || '');
  const [editedCity, setEditedCity] = useState(entry.location?.city || '');
  const [editedCountry, setEditedCountry] = useState(entry.location?.country || '');
  const [editedMood, setEditedMood] = useState(entry.mood);
  const [editedTags, setEditedTags] = useState(entry.tags.join(', '));

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🗑️ Delete button clicked, entry.id:', entry.id, 'type:', typeof entry.id);
    
    if (!entry.id) {
      console.error('❌ Cannot delete entry: entry.id is missing');
      alert('Cannot delete entry: Invalid entry ID');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        console.log('🔄 Calling deleteJournalEntry with ID:', entry.id.toString());
        await deleteJournalEntry(entry.id.toString());
        console.log('✅ Entry deleted successfully');
      } catch (error) {
        console.error('❌ Failed to delete entry:', error);
        alert('Failed to delete entry. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🧠 AI Insights button clicked, entry.id:', entry.id, 'type:', typeof entry.id);
    
    if (!entry.id) {
      console.error('❌ Cannot analyze entry: entry.id is missing');
      alert('Cannot analyze entry: Invalid entry ID');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      console.log('🔄 Calling generateDeepInsight with entry');
      await generateDeepInsight(entry, 'Friend');
      console.log('🔄 Navigating to AI insights tab');
      setActiveTab('ai-insights');
      console.log('✅ AI insights generation completed');
    } catch (error) {
      console.error('❌ Failed to analyze entry:', error);
      alert('Failed to analyze entry. Please check your OpenRouter API configuration in Settings.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('✏️ Edit button clicked, entering edit mode');
    setIsEditing(true);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👁️ Expand button clicked, current state:', isExpanded);
    setIsExpanded(!isExpanded);
  };

  const handleSaveEdit = async () => {
    console.log('Save edit button clicked, entry.id:', entry.id);
    if (!entry.id) {
      console.error('Cannot save entry: entry.id is missing');
      alert('Cannot save entry: Invalid entry ID');
      return;
    }
    
    setIsSaving(true);
    try {
      const updates: Partial<JournalEntry> = {
        title: editedTitle.trim() || 'Untitled Entry',
        content: editedContent.trim(),
        date: editedDate,
        time: editedTime || undefined,
        mood: editedMood,
        tags: editedTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        location: (editedCity.trim() || editedCountry.trim()) ? {
          city: editedCity.trim(),
          country: editedCountry.trim(),
          coordinates: entry.location?.coordinates
        } : undefined
      };
      
      await updateJournalEntry(entry.id.toString(), updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update entry:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(entry.title || '');
    setEditedContent(entry.content);
    setEditedDate(entry.date);
    setEditedTime(entry.time || '');
    setEditedCity(entry.location?.city || '');
    setEditedCountry(entry.location?.country || '');
    setEditedMood(entry.mood);
    setEditedTags(entry.tags.join(', '));
    setIsEditing(false);
  };

  // Create three-line preview with proper line counting and character limits
  const getThreeLinePreview = (content: string): { preview: string; hasMore: boolean } => {
    const lines = content.split('\n');
    const maxCharsPerLine = 80; // Approximate characters per line
    
    if (lines.length <= 3 && content.length <= maxCharsPerLine * 3) {
      return { preview: content, hasMore: false };
    }
    
    // If we have more than 3 lines, take first 3 lines
    if (lines.length > 3) {
      return { 
        preview: lines.slice(0, 3).join('\n'),
        hasMore: true 
      };
    }
    
    // If content is too long for 3 lines, truncate it
    if (content.length > maxCharsPerLine * 3) {
      return {
        preview: content.substring(0, maxCharsPerLine * 3).trim() + '...',
        hasMore: true
      };
    }
    
    return { preview: content, hasMore: false };
  };

  const { preview: previewText, hasMore } = getThreeLinePreview(entry.content);

  return (
    <>
      <div className="card p-6 group hover:shadow-2xl transition-all duration-300 animate-fade-in border-2 border-slate-700/50 hover:border-slate-600/70 bg-slate-800/80 backdrop-blur-sm rounded-xl">
        {/* Header with metadata */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {isEditing ? (
              <div className="flex flex-col space-y-3 w-full">
                {/* Title editing */}
                <div className="flex items-center space-x-2">
                  <label className="text-gray-400 font-medium min-w-[50px]">Title:</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Entry title"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                
                {/* Date and time editing */}
                <div className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/30 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 text-purple-300/80" />
                  <input
                    type="date"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    className="bg-transparent border-none text-purple-200/90 text-sm focus:outline-none"
                  />
                  <span className="text-purple-300/80">at</span>
                  <input
                    type="time"
                    value={editedTime}
                    onChange={(e) => setEditedTime(e.target.value)}
                    className="bg-transparent border-none text-purple-200/90 text-sm focus:outline-none"
                  />
                </div>
                
                {/* Location editing */}
                <div className="flex items-center space-x-2 bg-violet-500/20 px-4 py-2 rounded-full border border-violet-400/30 backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-violet-300/80" />
                  <input
                    type="text"
                    value={editedCity}
                    onChange={(e) => setEditedCity(e.target.value)}
                    placeholder="City"
                    className="bg-transparent border-none text-violet-200/90 text-sm focus:outline-none w-24"
                  />
                  <span className="text-violet-300/80">,</span>
                  <input
                    type="text"
                    value={editedCountry}
                    onChange={(e) => setEditedCountry(e.target.value)}
                    placeholder="Country"
                    className="bg-transparent border-none text-violet-200/90 text-sm focus:outline-none w-28"
                  />
                </div>

                {/* Mood editing */}
                <div className="flex items-center space-x-2">
                  <label className="text-gray-400 font-medium min-w-[50px]">Mood:</label>
                  <select
                    value={editedMood}
                    onChange={(e) => setEditedMood(Number(e.target.value))}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value={1}>1 - Very Bad</option>
                    <option value={2}>2 - Bad</option>
                    <option value={3}>3 - Okay</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>

                {/* Tags editing */}
                <div className="flex items-center space-x-2">
                  <label className="text-gray-400 font-medium min-w-[50px]">Tags:</label>
                  <input
                    type="text"
                    value={editedTags}
                    onChange={(e) => setEditedTags(e.target.value)}
                    placeholder="Comma-separated tags"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {/* Date display with button styling - Purple with low opacity */}
                <button className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/30 backdrop-blur-sm hover:bg-purple-500/25 transition-colors">
                  <Calendar className="w-4 h-4 text-purple-300/80" />
                  <span className="text-purple-200/90 font-medium">{entry.date}{entry.time ? ` at ${entry.time}` : ''}</span>
                </button>
                
                {/* Location display with button styling and flag - Primary position */}
                {entry.location && (
                  <button className="flex items-center space-x-2 bg-violet-500/20 px-4 py-2 rounded-full border border-violet-400/30 backdrop-blur-sm hover:bg-violet-500/25 transition-colors">
                    <MapPin className="w-4 h-4 text-violet-300/80" />
                    <span className="text-lg opacity-80">{getCountryFlag(entry.location.country)}</span>
                    <span className="text-violet-200/90 font-medium">
                      {entry.location.city}, {entry.location.country}
                    </span>
                  </button>
                )}
                
                {/* Moon phase display */}
                {entry.moonPhase && (
                  <div className="flex items-center space-x-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-400/30 backdrop-blur-sm">
                    <span className="text-lg opacity-80">🌙</span>
                    <span className="text-indigo-200/90 font-medium text-xs">{entry.moonPhase}</span>
                  </div>
                )}

                {/* Word count display - Lower opacity */}
                <div className="flex items-center space-x-2 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-400/30 backdrop-blur-sm">
                  <span className="text-lg opacity-80">📝</span>
                  <span className="text-blue-200/90 font-medium text-xs">{entry.content.split(' ').length} words</span>
                </div>

                {/* Tags display */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 text-xs bg-blue-500/20 text-blue-200/90 rounded-full border border-blue-400/30"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('💾 Save button clicked');
                    handleSaveEdit();
                  }}
                  disabled={isSaving}
                  className="btn-success px-4 py-2 text-sm flex items-center space-x-2 disabled:opacity-50"
                  title="Save changes"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save</span>
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('❌ Cancel button clicked');
                    handleCancelEdit();
                  }}
                  disabled={isSaving}
                  className="btn-secondary px-4 py-2 text-sm flex items-center space-x-2 disabled:opacity-50"
                  title="Cancel editing"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  <span>❌</span>
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleExpand}
                  className="btn-secondary px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                  title={isExpanded ? 'Show preview' : 'Show full entry'}
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  <span>{isExpanded ? '👁️‍🗨️' : '👁️'}</span>
                  <span className="hidden sm:inline">{isExpanded ? 'Preview' : 'Full'}</span>
                </button>
                
                <button
                  onClick={handleEdit}
                  className="btn-success px-3 py-2 text-sm flex items-center space-x-2 transition-colors"
                  title="Edit entry"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="btn-primary px-3 py-2 text-sm flex items-center space-x-2 disabled:opacity-50 transition-colors"
                  title="AI Insights"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'AI Insights'}</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn-danger px-3 py-2 text-sm flex items-center space-x-2 disabled:opacity-50 transition-colors"
                  title="Delete entry"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title Display - Only show if it's not "Imported Entry" */}
        {!isEditing && entry.title && entry.title !== 'Imported Entry' && (
          <h3 className="text-xl font-semibold text-white mb-4">{entry.title}</h3>
        )}

        {/* Content - Three line preview */}
        <div className="text-slate-100 leading-relaxed">
          {isEditing ? (
            <div className="space-y-3">
              <label className="block text-gray-400 font-medium">Content:</label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="textarea-field h-40 w-full"
                placeholder="Write your thoughts..."
              />
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-slate-200 leading-relaxed">
              {isExpanded ? entry.content : previewText}
              {hasMore && !isExpanded && (
                <span className="text-blue-400 cursor-pointer ml-2 hover:text-blue-300 transition-colors" 
                      onClick={() => setIsExpanded(true)}
                      title="Click to expand">
                  ... (see more)
                </span>
              )}
            </p>
          )}
        </div>

        {/* AI Insights Preview */}
        {entry.aiInsights && !isEditing && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-600/20 via-violet-600/20 to-indigo-600/20 rounded-xl border border-purple-400/30 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-purple-500/30 rounded-xl border border-purple-400/40">
                <Brain className="w-5 h-5 text-purple-200/90" />
              </div>
              <span className="text-lg font-bold text-white">AI Insights</span>
              <Sparkles className="w-5 h-5 text-violet-300/80 animate-pulse" />
            </div>
            <p className="text-sm text-slate-300/90 mb-4 leading-relaxed">
              Sentiment: <span className="text-purple-300/90 font-bold capitalize">{entry.aiInsights.sentiment.label}</span> ({Math.round(entry.aiInsights.sentiment.confidence * 100)}% confidence)
            </p>
            <button
              onClick={() => setShowAIInsights(true)}
              className="text-sm text-purple-300/90 hover:text-purple-200 font-bold hover:underline transition-colors flex items-center space-x-2"
            >
              <span>🔍 View full analysis</span>
              <span className="text-purple-400/80">→</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Insights Modal */}
      {showAIInsights && entry.aiInsights && (
        <AIInsightsModal
          insights={{
            writingPatterns: {
              complexity: 'moderate' as const,
              tone: 'reflective',
              keyPhrases: entry.aiInsights.themes || ['feeling', 'today', 'life'],
              wordCount: entry.content.split(' ').length,
              readingLevel: 'intermediate'
            },
            personalizedInsights: {
              recommendations: entry.aiInsights.suggestions || ['Consider exploring this feeling deeper', 'Try meditation'],
              trends: [],
              concerns: []
            },
            sentiment: {
              ...entry.aiInsights.sentiment,
              emotions: [
                { name: 'joy', intensity: 0.6 },
                { name: 'contentment', intensity: 0.4 }
              ]
            },
            themes: entry.aiInsights.themes || ['personal growth', 'reflection'],
            suggestions: entry.aiInsights.suggestions || ['Continue regular journaling', 'Practice mindfulness'],
            reflectionPrompts: entry.aiInsights.reflectionPrompts || ['What led to this feeling?', 'How can you build on this?'],
            createdAt: new Date().toISOString()
          }}
          onClose={() => setShowAIInsights(false)}
        />
      )}
    </>
  );
};