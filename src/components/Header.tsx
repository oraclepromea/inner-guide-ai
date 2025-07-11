import React from 'react';
import { Brain, BookOpen, BarChart3, Settings, MessageCircle } from 'lucide-react';
import { useAppStore } from '../stores';
import type { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { journalEntries, deepInsights, therapySessions } = useAppStore();

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
      id: 'ai-insights' as TabType,
      label: 'AI Insights',
      emoji: '🧠',
      icon: Brain,
      count: deepInsights.length,
      gradient: 'from-purple-500 via-violet-500 to-purple-600',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-400/50',
      glowColor: 'shadow-purple-500/30',
      textColor: 'text-purple-300',
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
      id: 'therapy' as TabType,
      label: 'Therapy',
      emoji: '💬',
      icon: MessageCircle,
      count: therapySessions?.length || 0,
      gradient: 'from-emerald-500 via-teal-500 to-emerald-600',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-400/50',
      glowColor: 'shadow-emerald-500/30',
      textColor: 'text-emerald-300',
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      emoji: '⚙️',
      icon: Settings,
      count: null,
      gradient: 'from-slate-500 via-gray-500 to-slate-600',
      bgColor: 'bg-slate-500/20',
      borderColor: 'border-slate-400/50',
      glowColor: 'shadow-slate-500/30',
      textColor: 'text-slate-300',
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 backdrop-blur-xl border-b border-primary-500/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-br from-primary-600 via-secondary-500 to-primary-600 rounded-2xl shadow-xl border border-primary-400/40">
                <Brain className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow-lg">
                <span className="bg-gradient-to-r from-primary-300 via-secondary-300 to-primary-300 bg-clip-text text-transparent">
                  Inner Guide
                </span>
              </h1>
            </div>
          </div>

          {/* Navigation Tabs - Moved more to the right */}
          <div className="flex-1 flex justify-center ml-12">
            <nav className="flex items-center space-x-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                      group relative flex items-center space-x-3 px-6 py-3 rounded-xl font-bold text-sm
                      transition-all duration-300 border backdrop-blur-sm min-w-fit
                      ${isActive
                        ? `bg-gradient-to-r ${tab.gradient} text-white border-white/30 shadow-xl ${tab.glowColor} scale-105 animate-glow-pulse`
                        : `${tab.bgColor} ${tab.textColor} hover:text-white border-transparent hover:${tab.borderColor} hover:shadow-lg hover:${tab.glowColor} hover:scale-105`
                      }
                    `}
                    title={tab.label}
                  >
                    {/* Emoji Icon */}
                    <span className={`
                      text-xl transition-all duration-300 drop-shadow-lg
                      ${isActive ? 'animate-bounce scale-110' : 'group-hover:scale-110 group-hover:animate-pulse'}
                    `}>
                      {tab.emoji}
                    </span>
                    
                    {/* Label */}
                    <span className="font-bold tracking-wide whitespace-nowrap">
                      {tab.label}
                    </span>
                    
                    {/* Count Badge */}
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
                    
                    {/* Active glow effect */}
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
          </div>

          {/* Right spacer for balance */}
          <div className="w-24 flex-shrink-0"></div>
        </div>
      </div>
    </header>
  );
};