import React from 'react';
import { Brain, Sparkles, Moon, Sun, BookOpen, Heart, BarChart3, Settings, MessageCircle } from 'lucide-react';
import { useAppStore } from '../stores';
import type { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { settings, updateSettings, journalEntries, moodEntries, therapySessions } = useAppStore();

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const tabs = [
    {
      id: 'journal' as TabType,
      label: 'Journal',
      emoji: '📝',
      icon: BookOpen,
      count: journalEntries.length,
      gradient: 'from-amber-500 via-orange-500 to-amber-600',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-400/50',
      glowColor: 'shadow-amber-500/30',
      textColor: 'text-amber-300',
    },
    {
      id: 'mood' as TabType,
      label: 'Mood',
      emoji: '💖',
      icon: Heart,
      count: moodEntries.length,
      gradient: 'from-pink-500 via-rose-500 to-pink-600',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-400/50',
      glowColor: 'shadow-pink-500/30',
      textColor: 'text-pink-300',
    },
    {
      id: 'therapy' as TabType,
      label: 'Therapy',
      emoji: '🧠',
      icon: MessageCircle,
      count: therapySessions?.length || 0,
      gradient: 'from-emerald-500 via-teal-500 to-emerald-600',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-400/50',
      glowColor: 'shadow-emerald-500/30',
      textColor: 'text-emerald-300',
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      emoji: '📊',
      icon: BarChart3,
      count: null,
      gradient: 'from-blue-500 via-indigo-500 to-blue-600',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/50',
      glowColor: 'shadow-blue-500/30',
      textColor: 'text-blue-300',
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      emoji: '⚙️',
      icon: Settings,
      count: null,
      gradient: 'from-violet-500 via-purple-500 to-violet-600',
      bgColor: 'bg-violet-500/20',
      borderColor: 'border-violet-400/50',
      glowColor: 'shadow-violet-500/30',
      textColor: 'text-violet-300',
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 backdrop-blur-xl border-b border-primary-500/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-br from-primary-600 via-secondary-500 to-primary-600 rounded-2xl shadow-xl border border-primary-400/40">
                <Brain className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white drop-shadow-lg">
                <span className="bg-gradient-to-r from-primary-300 via-secondary-300 to-primary-300 bg-clip-text text-transparent">
                  Inner Guide AI
                </span>
              </h1>
              <p className="text-xs text-primary-300/80 font-medium">AI-Powered Mental Wellness</p>
            </div>
          </div>

          {/* Navigation Tabs - Combined into single bar */}
          <nav className="flex items-center space-x-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    group relative flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm
                    transition-all duration-300 border backdrop-blur-sm
                    ${isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white border-white/30 shadow-xl ${tab.glowColor} scale-105 animate-glow-pulse`
                      : `${tab.bgColor} ${tab.textColor} hover:text-white border-transparent hover:${tab.borderColor} hover:shadow-lg hover:${tab.glowColor} hover:scale-105`
                    }
                  `}
                  title={tab.label}
                >
                  {/* Emoji Icon with enhanced styling */}
                  <span className={`
                    text-xl transition-all duration-300 drop-shadow-lg
                    ${isActive ? 'animate-bounce scale-110' : 'group-hover:scale-110 group-hover:animate-pulse'}
                  `}>
                    {tab.emoji}
                  </span>
                  
                  {/* Label - Always visible now */}
                  <span className="font-bold tracking-wide">
                    {tab.label}
                  </span>
                  
                  {/* Count Badge with enhanced styling */}
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`
                      inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black
                      shadow-lg border backdrop-blur-sm
                      ${isActive 
                        ? 'bg-white/25 text-white border-white/30 animate-pulse' 
                        : 'bg-slate-800/80 text-white border-primary-500/30 group-hover:bg-slate-700/80'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                  
                  {/* Active glow effect - enhanced */}
                  {isActive && (
                    <>
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.gradient} opacity-30 blur-md -z-10 animate-pulse`} />
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-white/10 to-transparent opacity-50 blur-sm" />
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side elements - Enhanced */}
          <div className="flex items-center space-x-4">
            {/* AI Badge with enhanced styling */}
            <div className="hidden lg:flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-400/30 backdrop-blur-sm shadow-lg">
              <Sparkles className="w-5 h-5 text-primary-300 animate-pulse drop-shadow-lg" />
              <span className="text-sm text-primary-200 font-bold tracking-wide">
                AI-Powered
              </span>
            </div>
            
            {/* Theme toggle with enhanced styling */}
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-slate-700/80 hover:to-slate-600/80 border border-slate-600/50 hover:border-slate-500/70 text-slate-300 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm"
              title="Toggle theme"
            >
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5 drop-shadow-lg" />
              ) : (
                <Sun className="w-5 h-5 drop-shadow-lg" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};