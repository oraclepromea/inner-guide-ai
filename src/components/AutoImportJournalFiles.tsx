// REAL DATA ONLY: Auto Journal Import Component for Auto Call Directory
// No mock data - all imported entries are analyzed with real AI if configured
// Automatically triggers AI analysis for imported journal entries from monitored directory

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FolderOpen, 
  RefreshCw, 
  CheckCircle, 
  Play,
  Pause,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAppStore } from '../stores';
import { useNotificationHelpers } from './NotificationSystem';

interface AutoImportStats {
  totalScanned: number;
  newImported: number;
  duplicatesSkipped: number;
  errors: number;
  lastScanTime: Date | null;
}

// File System Access API types
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
      id?: string;
    }): Promise<FileSystemDirectoryHandle>;
  }
  
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
  }
}

export const AutoImportJournalFiles: React.FC = () => {
  const { addJournalEntry, journalEntries } = useAppStore();
  const { success, error, info } = useNotificationHelpers();
  
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [scanInterval, setScanInterval] = useState(30); // seconds
  const [stats, setStats] = useState<AutoImportStats>({
    totalScanned: 0,
    newImported: 0,
    duplicatesSkipped: 0,
    errors: 0,
    lastScanTime: null
  });
  
  const intervalRef = useRef<number | null>(null);

  // Check if File System Access API is supported
  const isFileSystemSupported = 'showDirectoryPicker' in window;

  const processJSONFile = async (file: File): Promise<any[]> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Handle different JSON structures
      if (Array.isArray(data)) {
        return data;
      } else if (data.entries && Array.isArray(data.entries)) {
        return data.entries;
      } else if (data.transcription || data.content || data.text) {
        // Single entry format
        return [data];
      }
      
      return [];
    } catch (err) {
      console.error('Error processing JSON file:', err);
      return [];
    }
  };

  const processEntries = async (entries: any[]): Promise<{ imported: number; duplicates: number; errors: number }> => {
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const entry of entries) {
      try {
        // Create a standardized entry format
        const journalEntry = {
          title: entry.title || 'Imported Entry',
          content: entry.transcription || entry.content || entry.text || '',
          date: entry.date || new Date().toISOString().split('T')[0],
          mood: entry.mood || 3,
          tags: entry.tags || [],
          location: entry.location || undefined
        };

        // Check for duplicates based on content and date
        const isDuplicate = journalEntries.some(existing => 
          existing.content === journalEntry.content && 
          existing.date === journalEntry.date
        );

        if (isDuplicate) {
          duplicates++;
        } else if (journalEntry.content.trim()) {
          await addJournalEntry(journalEntry);
          imported++;
        }
      } catch (err) {
        console.error('Error processing entry:', err);
        errors++;
      }
    }

    return { imported, duplicates, errors };
  };

  const scanDirectory = async (directoryHandle: FileSystemDirectoryHandle): Promise<File[]> => {
    const jsonFiles: File[] = [];
    
    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind === 'file' && name.toLowerCase().endsWith('.json')) {
        try {
          const file = await handle.getFile();
          jsonFiles.push(file);
        } catch (err) {
          console.error(`Error reading file ${name}:`, err);
        }
      }
    }
    
    return jsonFiles;
  };

  const performManualScan = useCallback(async () => {
    if (!isFileSystemSupported) {
      error('Browser not supported', 'This browser does not support automatic file system access.');
      return;
    }

    setIsScanning(true);
    let totalScanned = 0;
    let newImported = 0;
    let duplicatesSkipped = 0;
    let errorCount = 0;

    try {
      // Request directory access
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      info('Scanning directory', `Scanning for JSON files in selected directory...`);
      
      const jsonFiles = await scanDirectory(directoryHandle);
      totalScanned = jsonFiles.length;
      
      if (jsonFiles.length === 0) {
        info('No files found', 'No JSON files found in the selected directory.');
        return;
      }

      // Process each JSON file
      for (const file of jsonFiles) {
        try {
          const entries = await processJSONFile(file);
          const result = await processEntries(entries);
          
          newImported += result.imported;
          duplicatesSkipped += result.duplicates;
          errorCount += result.errors;
        } catch (err) {
          console.error(`Error processing file ${file.name}:`, err);
          errorCount++;
        }
      }

      // Update stats
      setStats({
        totalScanned,
        newImported,
        duplicatesSkipped,
        errors: errorCount,
        lastScanTime: new Date()
      });

      if (newImported > 0) {
        success(
          `Import complete!`, 
          `Imported ${newImported} new entries from ${totalScanned} files. ${duplicatesSkipped} duplicates skipped.`
        );
      } else {
        info(
          'No new entries', 
          `Scanned ${totalScanned} files but found no new entries to import.`
        );
      }

    } catch (err) {
      const errorObj = err as Error;
      if (errorObj.name === 'AbortError') {
        info('Scan cancelled', 'Directory scan was cancelled by user.');
      } else {
        console.error('Scan failed:', err);
        error('Scan failed', 'Unable to scan the selected directory. Please try again.');
      }
    } finally {
      setIsScanning(false);
    }
  }, [addJournalEntry, journalEntries, success, error, info]);

  const toggleAutoMode = useCallback(() => {
    if (isAutoMode) {
      // Stop auto mode
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsAutoMode(false);
      info('Auto-import stopped', 'Automatic scanning has been disabled.');
    } else {
      // Start auto mode
      setIsAutoMode(true);
      info('Auto-import started', `Automatic scanning enabled. Will scan every ${scanInterval} seconds.`);
      
      // Start the interval
      intervalRef.current = window.setInterval(async () => {
        if (!isScanning) {
          await performManualScan();
        }
      }, scanInterval * 1000);
    }
  }, [isAutoMode, scanInterval, performManualScan, isScanning, info]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!isFileSystemSupported) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-300 mb-2">Browser Not Supported</h4>
            <p className="text-sm text-gray-300 mb-4">
              Your browser does not support the File System Access API required for automatic directory monitoring. 
              Please use Chrome, Edge, or another Chromium-based browser for this feature.
            </p>
            <p className="text-xs text-gray-400">
              You can still use the manual import feature to upload individual files.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto Import Controls */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            <div>
              <h4 className="font-semibold text-blue-300">Auto Import from Directory</h4>
              <p className="text-sm text-gray-400">Automatically scan and import journal files</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={performManualScan}
              disabled={isScanning || isAutoMode}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
              <span>{isScanning ? 'Scanning...' : 'Scan Directory'}</span>
            </button>
            
            <button
              onClick={toggleAutoMode}
              disabled={isScanning}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isAutoMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAutoMode ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isAutoMode ? 'Stop Auto' : 'Start Auto'}</span>
            </button>
          </div>
        </div>

        {/* Auto Mode Settings */}
        {!isAutoMode && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-300">Scan Interval:</label>
              <select
                value={scanInterval}
                onChange={(e) => setScanInterval(Number(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={900}>15 minutes</option>
              </select>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {isAutoMode && (
          <div className="flex items-center space-x-2 mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-300">
              Auto-import active (scanning every {scanInterval} seconds)
            </span>
          </div>
        )}
      </div>

      {/* Import Statistics */}
      {stats.lastScanTime && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/30">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-gray-200">Last Scan Results</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{stats.totalScanned}</div>
              <div className="text-xs text-gray-400">Files Scanned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">{stats.newImported}</div>
              <div className="text-xs text-gray-400">New Imported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">{stats.duplicatesSkipped}</div>
              <div className="text-xs text-gray-400">Duplicates Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-300">{stats.errors}</div>
              <div className="text-xs text-gray-400">Errors</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last scan: {stats.lastScanTime.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600/20">
        <h5 className="font-medium text-gray-200 mb-2">How Auto Import Works:</h5>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Click "Scan Directory" to select your Auto Call export folder</li>
          <li>• Use "Start Auto" to continuously monitor the directory for new files</li>
          <li>• Supports JSON files with transcription, content, or text fields</li>
          <li>• Automatically detects and skips duplicate entries</li>
          <li>• Set your preferred scan interval (10 seconds to 15 minutes)</li>
        </ul>
      </div>
    </div>
  );
};