import React from 'react';
import { Brain, Sparkles, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../stores';

export const Header: React.FC = () => {
  const { settings, updateSettings } = useAppStore();

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <header className="glass-card border-b border-purple-500/20 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">
                Inner Guide AI
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Your Personal Journal Companion
              </p>
            </div>
          </div>

          {/* Right side elements */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-sm text-purple-300 font-medium">
                AI-Powered Insights
              </span>
            </div>
            
            <button
              onClick={toggleTheme}
              className="icon-btn"
              title="Toggle theme"
            >
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};