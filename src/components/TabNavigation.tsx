import React from 'react';
import { BookOpen, Brain, BarChart3, MessageCircle, Settings } from 'lucide-react';
import { useAppStore } from '../stores';
import type { TabType } from '../types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const { journalEntries, therapySessions } = useAppStore();

  const tabs = [
    {
      id: 'journal' as TabType,
      label: 'Journal',
      icon: BookOpen,
      count: journalEntries.length,
      gradient: 'from-purple-500 to-violet-500',
    },
    {
      id: 'ai-insights' as TabType,
      label: 'AI Insights',
      icon: Brain,
      count: null,
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: BarChart3,
      count: null,
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      id: 'therapy' as TabType,
      label: 'Therapy',
      icon: MessageCircle,
      count: therapySessions?.length || 0,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      icon: Settings,
      count: null,
      gradient: 'from-slate-500 to-gray-500',
    }
  ];

  return (
    <nav className="glass-card border-b border-purple-500/20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative flex items-center space-x-3 px-6 py-3 rounded-xl font-medium 
                  transition-all duration-200 border whitespace-nowrap min-w-fit
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-600/30 to-violet-600/30 text-white border-purple-400/50 shadow-lg'
                    : 'text-slate-300 hover:text-white bg-transparent hover:bg-purple-500/10 border-transparent hover:border-purple-500/30'
                  }
                `}
              >
                {/* Icon with gradient background for active state */}
                <div className={`
                  relative p-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? `bg-gradient-to-r ${tab.gradient} shadow-lg` 
                    : 'bg-purple-500/20 group-hover:bg-purple-500/30'
                  }
                `}>
                  <Icon className={`
                    w-4 h-4 transition-all duration-200
                    ${isActive ? 'text-white' : 'text-purple-300 group-hover:text-purple-200'}
                  `} />
                </div>
                
                {/* Label and count */}
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-sm">{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`
                      text-xs font-medium
                      ${isActive ? 'text-purple-200' : 'text-slate-400'}
                    `}>
                      {tab.count} {tab.count === 1 ? 'entry' : 'entries'}
                    </span>
                  )}
                </div>
                
                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};