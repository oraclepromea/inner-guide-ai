// REAL DATA ONLY: Auto Journal Import Component for Auto Call Directory
// No mock data - all imported entries are analyzed with real AI if configured
// Automatically triggers AI analysis for imported journal entries from monitored directory

import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, FolderOpen, Eye, EyeOff, Clock } from 'lucide-react';
import { useAppStore } from '../stores';
import type { JournalEntry } from '../types';

// Add File System Access API type declarations
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
}

interface AutoImportState {
  directoryHandle: FileSystemDirectoryHandle | null;
  isWatching: boolean;
  lastScan: Date | null;
  fileCount: number;
  interval: number | null;
}

interface ImportResult {
  success: boolean;
  entriesProcessed: number;
  entriesImported: number;
  errors: string[];
  duplicates: number;
  newFiles: string[];
}

interface ParsedEntry {
  content: string;
  date?: string;
  title?: string;
  mood?: number;
  tags?: string[];
  fileName?: string;
}

export const AutoImportJournalFiles: React.FC = () => {
  const { importJournalEntries, journalEntries, addNotification } = useAppStore();
  const [isScanning, setIsScanning] = useState(false);
  const [autoImport, setAutoImport] = useState<AutoImportState>({
    directoryHandle: null,
    isWatching: false,
    lastScan: null,
    fileCount: 0,
    interval: null
  });
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  // Check if File System Access API is supported
  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // Load processed files from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('inner-guide-processed-files');
    if (stored) {
      try {
        setProcessedFiles(new Set(JSON.parse(stored)));
      } catch (error) {
        console.error('Error loading processed files:', error);
      }
    }
  }, []);

  // Save processed files to localStorage
  const saveProcessedFiles = useCallback((files: Set<string>) => {
    localStorage.setItem('inner-guide-processed-files', JSON.stringify(Array.from(files)));
  }, []);

  // Enhanced parsing for Auto Call format
  const parseJournalFile = useCallback((content: string, filename: string): ParsedEntry[] => {
    const entries: ParsedEntry[] = [];
    const fileExtension = filename.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'json') {
        const jsonData = JSON.parse(content);
        if (Array.isArray(jsonData)) {
          entries.push(...jsonData.map(entry => ({
            content: entry.content || entry.text || entry.body || '',
            date: entry.date || entry.created_at || entry.timestamp,
            title: entry.title || entry.subject,
            mood: entry.mood || entry.rating,
            tags: [...(entry.tags || []), 'auto-imported'],
            fileName: filename
          })));
        } else if (jsonData.content || jsonData.text) {
          entries.push({
            content: jsonData.content || jsonData.text || '',
            date: jsonData.date || jsonData.created_at,
            title: jsonData.title,
            mood: jsonData.mood,
            tags: [...(jsonData.tags || []), 'auto-imported'],
            fileName: filename
          });
        }
      } else if (fileExtension === 'txt' || fileExtension === 'md') {
        // Parse text files with Auto Call specific patterns
        const lines = content.split('\n');
        let currentEntry: ParsedEntry = { content: '', fileName: filename };
        
        // Try to extract date from filename
        const dateFromFilename = filename.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateFromFilename) {
          currentEntry.date = dateFromFilename[1];
        }

        for (const line of lines) {
          const trimmed = line.trim();
          
          // Auto Call date patterns
          const dateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4})/);
          if (dateMatch && currentEntry.content) {
            entries.push({...currentEntry, tags: [...(currentEntry.tags || []), 'auto-imported']});
            currentEntry = { content: '', date: dateMatch[1], fileName: filename };
          } else if (dateMatch) {
            currentEntry.date = dateMatch[1];
          }

          // Auto Call specific patterns
          if (trimmed.startsWith('Entry:') || trimmed.startsWith('Journal:')) {
            currentEntry.title = trimmed.replace(/^(Entry|Journal):\s*/i, '');
          } else if (trimmed.match(/mood:\s*(\d+)/i)) {
            currentEntry.mood = parseInt(trimmed.match(/mood:\s*(\d+)/i)![1]);
          } else if (trimmed.match(/tags?:\s*(.+)/i)) {
            const tags = trimmed.match(/tags?:\s*(.+)/i)![1].split(',').map(t => t.trim());
            currentEntry.tags = [...tags, 'auto-imported'];
          } else if (trimmed && !trimmed.startsWith('Entry:') && !trimmed.startsWith('Mood:') && !trimmed.startsWith('Tag')) {
            currentEntry.content += (currentEntry.content ? '\n' : '') + line;
          }
        }

        if (currentEntry.content) {
          entries.push({...currentEntry, tags: [...(currentEntry.tags || []), 'auto-imported']});
        }
      } else {
        // Fallback for any other file type
        entries.push({
          content: content,
          date: new Date().toISOString().split('T')[0],
          title: `Auto Import: ${filename}`,
          tags: ['auto-imported'],
          fileName: filename
        });
      }
    } catch (error) {
      console.error('Parse error:', error);
      entries.push({
        content: content,
        title: `Auto Import: ${filename}`,
        date: new Date().toISOString().split('T')[0],
        tags: ['auto-imported', 'parse-error'],
        fileName: filename
      });
    }

    return entries.filter(entry => entry.content?.trim());
  }, []);

  // Check for duplicates
  const isDuplicate = useCallback((entry: ParsedEntry): boolean => {
    return journalEntries.some(existing => 
      existing.content.trim() === entry.content.trim() &&
      existing.date === entry.date
    );
  }, [journalEntries]);

  // Scan directory for new files
  const scanDirectory = useCallback(async (directoryHandle: FileSystemDirectoryHandle): Promise<ParsedEntry[]> => {
    const allEntries: ParsedEntry[] = [];
    let fileCount = 0;

    try {
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file') {
          const isJournalFile = /\.(txt|md|json|csv)$/i.test(name);
          
          if (isJournalFile) {
            fileCount++;
            const fileHandle = handle as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            const fileKey = `${file.name}-${file.lastModified}-${file.size}`;
            
            // Skip if already processed
            if (!processedFiles.has(fileKey)) {
              const content = await file.text();
              const entries = parseJournalFile(content, file.name);
              allEntries.push(...entries.map(e => ({...e, fileKey})));
            }
          }
        }
      }

      setAutoImport(prev => ({
        ...prev,
        lastScan: new Date(),
        fileCount
      }));

    } catch (error) {
      console.error('Scan error:', error);
      throw error;
    }

    return allEntries;
  }, [parseJournalFile, processedFiles]);

  // Process and import entries
  const processEntries = useCallback(async (entries: ParsedEntry[]): Promise<ImportResult> => {
    const result: ImportResult = {
      success: true,
      entriesProcessed: entries.length,
      entriesImported: 0,
      errors: [],
      duplicates: 0,
      newFiles: []
    };

    const newProcessedFiles = new Set(processedFiles);
    const entriesToImport: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const entry of entries) {
      try {
        if (isDuplicate(entry)) {
          result.duplicates++;
          continue;
        }

        const journalEntry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          title: entry.title || `Auto Import: ${entry.fileName}`,
          content: entry.content,
          date: entry.date || new Date().toISOString().split('T')[0],
          mood: entry.mood || 3,
          tags: entry.tags || ['auto-imported']
        };

        entriesToImport.push(journalEntry);
        
        if (entry.fileName && !result.newFiles.includes(entry.fileName)) {
          result.newFiles.push(entry.fileName);
        }

        // Mark as processed
        if ((entry as any).fileKey) {
          newProcessedFiles.add((entry as any).fileKey);
        }

      } catch (error) {
        console.error('Import error:', error);
        result.errors.push(`Failed to import from ${entry.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.success = false;
      }
    }

    // REAL DATA ONLY: Import all entries at once with automatic AI analysis
    if (entriesToImport.length > 0) {
      try {
        await importJournalEntries(entriesToImport);
        result.entriesImported = entriesToImport.length;
      } catch (error) {
        result.errors.push(`Failed to import entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.success = false;
      }
    }

    setProcessedFiles(newProcessedFiles);
    saveProcessedFiles(newProcessedFiles);
    return result;
  }, [importJournalEntries, isDuplicate, processedFiles, saveProcessedFiles]);

  // Select directory
  const selectDirectory = useCallback(async () => {
    if (!isSupported) {
      addNotification({
        type: 'error',
        title: 'Not Supported',
        message: 'File System Access API not supported in this browser'
      });
      return;
    }

    try {
      const directoryHandle = await window.showDirectoryPicker!({
        mode: 'read',
        startIn: 'documents'
      });

      setAutoImport(prev => ({
        ...prev,
        directoryHandle
      }));

      addNotification({
        type: 'success',
        title: 'Directory Connected',
        message: `Connected to ${directoryHandle.name} directory`
      });

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        addNotification({
          type: 'error',
          title: 'Selection Failed',
          message: error.message
        });
      }
    }
  }, [isSupported, addNotification]);

  // Manual scan
  const manualScan = useCallback(async () => {
    if (!autoImport.directoryHandle) {
      await selectDirectory();
      return;
    }

    setIsScanning(true);
    try {
      const entries = await scanDirectory(autoImport.directoryHandle);
      
      if (entries.length === 0) {
        addNotification({
          type: 'info',
          title: 'No New Files',
          message: 'No new journal files found to import'
        });
      } else {
        const result = await processEntries(entries);
        setLastResult(result);
        
        addNotification({
          type: result.success ? 'success' : 'warning',
          title: result.success ? 'Import Complete' : 'Import Partial',
          message: `Imported ${result.entriesImported} entries from ${result.newFiles.length} files`
        });
      }
    } catch (error) {
      console.error('Manual scan failed:', error);
      addNotification({
        type: 'error',
        title: 'Scan Failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsScanning(false);
    }
  }, [autoImport.directoryHandle, selectDirectory, scanDirectory, processEntries, addNotification]);

  // Auto scan with interval
  const startAutoScan = useCallback(() => {
    if (!autoImport.directoryHandle) return;

    const interval = setInterval(() => {
      if (!isScanning) {
        manualScan();
      }
    }, 30000); // Scan every 30 seconds

    setAutoImport(prev => ({
      ...prev,
      isWatching: true,
      interval: interval as any
    }));
  }, [autoImport.directoryHandle, isScanning, manualScan]);

  // Stop auto scan
  const stopAutoScan = useCallback(() => {
    if (autoImport.interval) {
      clearInterval(autoImport.interval);
    }
    
    setAutoImport(prev => ({
      ...prev,
      isWatching: false,
      interval: null
    }));
  }, [autoImport.interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoImport.interval) {
        clearInterval(autoImport.interval);
      }
    };
  }, [autoImport.interval]);

  if (!isSupported) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-800/40 to-slate-700/40 backdrop-blur-sm rounded-2xl border border-red-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Auto Import Not Supported</h3>
        </div>
        <p className="text-slate-300">
          This browser doesn't support the File System Access API required for auto-importing journal files.
          Please use Chrome, Edge, or another Chromium-based browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <FolderOpen className="w-6 h-6 text-violet-400" />
          <span>Auto Journal Import</span>
        </h3>
      </div>

      {/* Main Controls */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 backdrop-blur-sm rounded-2xl border border-violet-500/20 p-6">
        <div className="space-y-4">
          {/* Directory Selection */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-white">Source Directory</h4>
              <p className="text-sm text-slate-400">
                {autoImport.directoryHandle 
                  ? `Connected to: ${autoImport.directoryHandle.name}`
                  : 'No directory selected'
                }
              </p>
            </div>
            <button
              onClick={selectDirectory}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
            >
              {autoImport.directoryHandle ? 'Change' : 'Select'} Directory
            </button>
          </div>

          {/* Scan Controls */}
          {autoImport.directoryHandle && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-600/30">
              <div className="flex items-center space-x-4">
                <button
                  onClick={manualScan}
                  disabled={isScanning}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
                </button>

                <button
                  onClick={autoImport.isWatching ? stopAutoScan : startAutoScan}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                    autoImport.isWatching 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {autoImport.isWatching ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{autoImport.isWatching ? 'Stop Watching' : 'Start Watching'}</span>
                </button>
              </div>

              {autoImport.lastScan && (
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Last scan: {autoImport.lastScan.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      {lastResult && (
        <div className={`p-4 rounded-xl border ${
          lastResult.success 
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Import Results</span>
          </div>
          <div className="text-sm space-y-1">
            <p>Processed: {lastResult.entriesProcessed} entries</p>
            <p>Imported: {lastResult.entriesImported} new entries</p>
            <p>Duplicates skipped: {lastResult.duplicates}</p>
            {lastResult.newFiles.length > 0 && (
              <p>Files: {lastResult.newFiles.join(', ')}</p>
            )}
            {lastResult.errors.length > 0 && (
              <div className="text-red-400">
                <p>Errors:</p>
                <ul className="list-disc list-inside ml-2">
                  {lastResult.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-sm text-slate-400 bg-slate-800/30 p-4 rounded-xl">
        <h5 className="font-medium text-slate-300 mb-2">Supported File Formats:</h5>
        <ul className="space-y-1">
          <li>• <strong>JSON:</strong> Structured journal data with metadata</li>
          <li>• <strong>TXT/MD:</strong> Plain text with auto-detected dates and mood ratings</li>
          <li>• <strong>Auto Call Format:</strong> Specialized parsing for Auto Call directory structure</li>
        </ul>
        <p className="mt-3 text-xs">
          All imported entries are automatically analyzed with AI insights when available.
        </p>
      </div>
    </div>
  );
};