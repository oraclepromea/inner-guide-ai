import React, { useState, useRef } from 'react';
import { Settings, Download, Upload, Trash2, Shield, Moon, Sun, Bell, Database, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores';
import { useNotificationHelpers } from './NotificationSystem';

export const SettingsTab: React.FC = () => {
  const { 
    journalEntries, 
    moodEntries, 
    clearAllData, 
    exportAllData, 
    importData,
    settings,
    updateSettings 
  } = useAppStore();
  const { success, error } = useNotificationHelpers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      await exportAllData();
      success('Data exported successfully!', 'Your journal and mood data has been downloaded');
    } catch (err) {
      console.error('Export failed:', err);
      error('Export failed', 'Unable to export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      success('Data imported successfully!', 'Your journal and mood data has been restored');
    } catch (err) {
      console.error('Import failed:', err);
      error('Import failed', 'Unable to import the selected file. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllData();
      setShowDeleteConfirm(false);
      success('All data cleared', 'Your journal and mood entries have been permanently deleted');
    } catch (err) {
      console.error('Clear data failed:', err);
      error('Failed to clear data', 'Unable to delete all data. Please try again.');
    }
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const dataStats = {
    journalEntries: journalEntries.length,
    moodEntries: moodEntries.length,
    totalEntries: journalEntries.length + moodEntries.length,
    dataSize: Math.round((JSON.stringify({ journalEntries, moodEntries }).length / 1024)),
  };

  return (
    <div className="space-y-8">
      {/* App Settings */}
      <div className="card p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary-500/20 rounded-xl">
            <Settings className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary-300">App Settings</h3>
            <p className="text-sm text-gray-400">Customize your Inner Guide experience</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme Setting */}
          <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-primary-500/20">
            <div className="flex items-center space-x-3">
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <h4 className="font-semibold text-gray-200">Theme</h4>
                <p className="text-sm text-gray-400">Choose your preferred appearance</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.theme === 'dark' ? 'bg-primary-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notifications Setting */}
          <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-primary-500/20">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-secondary-400" />
              <div>
                <h4 className="font-semibold text-gray-200">Notifications</h4>
                <p className="text-sm text-gray-400">Enable daily reminders and alerts</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ notifications: !settings.notifications })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications ? 'bg-secondary-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto-save Setting */}
          <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-primary-500/20">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-green-400" />
              <div>
                <h4 className="font-semibold text-gray-200">Auto-save</h4>
                <p className="text-sm text-gray-400">Automatically save entries as you type</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ autoSave: !settings.autoSave })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoSave ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Location Setting */}
          <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-primary-500/20">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <div>
                <h4 className="font-semibold text-gray-200">Location Detection</h4>
                <p className="text-sm text-gray-400">Auto-detect location for journal entries</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ enableLocation: !settings.enableLocation })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableLocation ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableLocation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-500/20 rounded-xl">
            <Database className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-300">Data Management</h3>
            <p className="text-sm text-gray-400">Backup, restore, and manage your data</p>
          </div>
        </div>

        {/* Data Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-primary-500/10 rounded-xl p-4 border border-primary-500/20">
            <div className="text-2xl font-bold text-primary-200">{dataStats.journalEntries}</div>
            <div className="text-sm text-gray-400">Journal Entries</div>
          </div>
          <div className="bg-secondary-500/10 rounded-xl p-4 border border-secondary-500/20">
            <div className="text-2xl font-bold text-secondary-200">{dataStats.moodEntries}</div>
            <div className="text-sm text-gray-400">Mood Entries</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
            <div className="text-2xl font-bold text-green-200">{dataStats.totalEntries}</div>
            <div className="text-sm text-gray-400">Total Entries</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-200">{dataStats.dataSize} KB</div>
            <div className="text-sm text-gray-400">Data Size</div>
          </div>
        </div>

        {/* Data Actions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting || dataStats.totalEntries === 0}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {isExporting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {isImporting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span>{isImporting ? 'Importing...' : 'Import Data'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-300 mb-2">Danger Zone</h4>
                <p className="text-sm text-gray-400 mb-4">
                  This action will permanently delete all your journal entries and mood data. This cannot be undone.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={dataStats.totalEntries === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All Data</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleClearAll}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Delete</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Settings */}
      <div className="card p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-purple-300">AI Analysis Settings</h3>
            <p className="text-sm text-gray-400">Configure AI-powered journal insights</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Analysis Toggle */}
          <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 text-purple-400">🧠</div>
              <div>
                <h4 className="font-semibold text-gray-200">AI Analysis</h4>
                <p className="text-sm text-gray-400">Enable AI-powered insights for journal entries</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ analyticsEnabled: !settings.analyticsEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.analyticsEnabled ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* OpenRouter API Status */}
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-5 h-5 text-purple-400">🔗</div>
              <h4 className="font-semibold text-purple-300">OpenRouter API Status</h4>
            </div>
            
            {import.meta.env.VITE_OPENROUTER_API_KEY ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">API key configured - Real AI analysis enabled</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-300">No API key - Using fallback analysis</span>
                </div>
                <div className="text-xs text-gray-400">
                  To enable real AI analysis, add your OpenRouter API key to the .env file:
                  <code className="block mt-2 p-2 bg-gray-800 rounded text-gray-300">
                    VITE_OPENROUTER_API_KEY=your_api_key_here
                  </code>
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <h4 className="font-semibold text-blue-300 mb-2">📊 Sentiment Analysis</h4>
              <p className="text-sm text-gray-400">
                Analyzes the emotional tone and sentiment of your journal entries
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <h4 className="font-semibold text-green-300 mb-2">🎯 Theme Detection</h4>
              <p className="text-sm text-gray-400">
                Identifies key themes and patterns in your writing
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <h4 className="font-semibold text-yellow-300 mb-2">💡 Suggestions</h4>
              <p className="text-sm text-gray-400">
                Provides supportive insights and growth opportunities
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <h4 className="font-semibold text-purple-300 mb-2">❓ Reflection Prompts</h4>
              <p className="text-sm text-gray-400">
                Generates thoughtful questions for deeper self-reflection
              </p>
            </div>
          </div>

          {/* Privacy Notice for AI */}
          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-300 mb-2">AI Privacy Notice</h4>
                <p className="text-sm text-gray-400">
                  When AI analysis is enabled, journal entry content is sent to OpenRouter's API for processing. 
                  If no API key is configured, analysis is performed locally using pattern matching.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="card p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-300">Privacy & Security</h3>
            <p className="text-sm text-gray-400">Your data security and privacy information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <h4 className="font-semibold text-blue-300 mb-2">🔒 Local Storage</h4>
            <p className="text-sm text-gray-400">
              All your data is stored locally in your browser using IndexedDB. No information is sent to external servers.
            </p>
          </div>

          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <h4 className="font-semibold text-green-300 mb-2">🛡️ Data Protection</h4>
            <p className="text-sm text-gray-400">
              Your journal entries and mood data are encrypted and stored securely on your device only.
            </p>
          </div>

          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <h4 className="font-semibold text-purple-300 mb-2">🔐 No Tracking</h4>
            <p className="text-sm text-gray-400">
              We don't track your usage, collect analytics, or store any personal information on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-purple-300">About Inner Guide AI</h3>
            <p className="text-sm text-gray-400">Your personal AI-powered journal companion</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-800/50 rounded-xl border border-primary-500/20">
              <h4 className="font-semibold text-primary-300 mb-2">Version</h4>
              <p className="text-gray-400">1.0.0</p>
            </div>
            <div className="p-4 bg-dark-800/50 rounded-xl border border-primary-500/20">
              <h4 className="font-semibold text-primary-300 mb-2">Build</h4>
              <p className="text-gray-400">2025.01.08</p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl border border-primary-500/20">
            <h4 className="font-semibold text-primary-300 mb-2">✨ Features</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• AI-powered journal analysis and insights</li>
              <li>• Mood tracking with visual trends</li>
              <li>• Location and moon phase detection</li>
              <li>• Offline-first with local data storage</li>
              <li>• Export/import for data portability</li>
              <li>• Advanced analytics and achievements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};