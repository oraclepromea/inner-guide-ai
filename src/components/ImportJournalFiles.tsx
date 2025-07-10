// REAL DATA ONLY: Manual Journal File Import Component
// No mock data - all imported entries are analyzed with real AI if configured
// Automatically triggers AI analysis for imported journal entries

import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { useAppStore } from '../stores';
import type { JournalEntry } from '../types';

interface ImportResult {
  success: boolean;
  entriesProcessed: number;
  entriesImported: number;
  errors: string[];
  duplicates: number;
}

interface ParsedEntry {
  content: string;
  date?: string;
  title?: string;
  mood?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export const ImportJournalFiles: React.FC = () => {
  const { importJournalEntries, journalEntries, addNotification } = useAppStore();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Parse different file formats
  const parseJournalFile = useCallback((content: string, filename: string): ParsedEntry[] => {
    const entries: ParsedEntry[] = [];
    const fileExtension = filename.split('.').pop()?.toLowerCase();

    try {
      switch (fileExtension) {
        case 'json': {
          const jsonData = JSON.parse(content);
          if (Array.isArray(jsonData)) {
            // Array of entries
            entries.push(...jsonData.map(entry => ({
              content: entry.content || entry.text || entry.body || '',
              date: entry.date || entry.created_at || entry.timestamp,
              title: entry.title || entry.subject,
              mood: entry.mood || entry.rating,
              tags: entry.tags || entry.labels || [],
              metadata: entry
            })));
          } else if (jsonData.content || jsonData.text || jsonData.body) {
            // Single entry
            entries.push({
              content: jsonData.content || jsonData.text || jsonData.body || '',
              date: jsonData.date || jsonData.created_at || jsonData.timestamp,
              title: jsonData.title || jsonData.subject,
              mood: jsonData.mood || jsonData.rating,
              tags: jsonData.tags || jsonData.labels || [],
              metadata: jsonData
            });
          }
          break;
        }

        case 'txt':
        case 'md': {
          // Parse text/markdown files
          const lines = content.split('\n');
          let currentEntry: ParsedEntry = { content: '' };

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Check for date patterns
            const dateMatch = trimmedLine.match(/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4})/);
            if (dateMatch && currentEntry.content) {
              // Save previous entry and start new one
              entries.push(currentEntry);
              currentEntry = { content: '', date: dateMatch[1] };
            } else if (dateMatch) {
              currentEntry.date = dateMatch[1];
            }

            // Check for title patterns
            if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('Title:')) {
              currentEntry.title = trimmedLine.replace(/^#\s*|^Title:\s*/i, '');
            }

            // Check for mood patterns
            const moodMatch = trimmedLine.match(/mood:\s*(\d+)/i);
            if (moodMatch) {
              currentEntry.mood = parseInt(moodMatch[1]);
            }

            // Check for tags
            const tagsMatch = trimmedLine.match(/tags?:\s*(.+)/i);
            if (tagsMatch) {
              currentEntry.tags = tagsMatch[1].split(',').map(tag => tag.trim());
            }

            // Content
            if (trimmedLine && !dateMatch && !trimmedLine.startsWith('#') && 
                !trimmedLine.toLowerCase().startsWith('title:') &&
                !trimmedLine.toLowerCase().startsWith('mood:') &&
                !trimmedLine.toLowerCase().startsWith('tag')) {
              if (currentEntry.content) {
                currentEntry.content += '\n' + line;
              } else {
                currentEntry.content = line;
              }
            }
          }
          
          // Add the last entry
          if (currentEntry.content) {
            entries.push(currentEntry);
          }
          break;
        }

        case 'csv': {
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const entry: ParsedEntry = { content: '' };
            
            headers.forEach((header, index) => {
              const value = values[index]?.trim().replace(/^"|"$/g, '');
              if (!value) return;
              
              switch (header) {
                case 'content':
                case 'text':
                case 'body':
                case 'entry':
                  entry.content = value;
                  break;
                case 'date':
                case 'created_at':
                case 'timestamp':
                  entry.date = value;
                  break;
                case 'title':
                case 'subject':
                  entry.title = value;
                  break;
                case 'mood':
                case 'rating':
                  entry.mood = parseInt(value);
                  break;
                case 'tags':
                case 'labels':
                  entry.tags = value.split(';').map(tag => tag.trim());
                  break;
              }
            });
            
            if (entry.content) {
              entries.push(entry);
            }
          }
          break;
        }

        default:
          // Treat as plain text
          entries.push({
            content: content,
            date: new Date().toISOString().split('T')[0],
            title: `Imported from ${filename}`
          });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      // Fallback: treat as plain text
      entries.push({
        content: content,
        date: new Date().toISOString().split('T')[0],
        title: `Imported from ${filename}`
      });
    }

    return entries.filter(entry => entry.content && entry.content.trim().length > 0);
  }, []);

  // Check for duplicates
  const isDuplicate = useCallback((entry: ParsedEntry): boolean => {
    return journalEntries.some(existing => 
      existing.content.trim() === entry.content.trim() &&
      existing.date === entry.date
    );
  }, [journalEntries]);

  // Process imported entries
  const processImportedEntries = useCallback(async (entries: ParsedEntry[]): Promise<ImportResult> => {
    const result: ImportResult = {
      success: true,
      entriesProcessed: entries.length,
      entriesImported: 0,
      errors: [],
      duplicates: 0
    };

    // Filter out duplicates first
    const uniqueEntries: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (const entry of entries) {
      if (isDuplicate(entry)) {
        result.duplicates++;
        continue;
      }

      // Prepare journal entry
      const journalEntry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        title: entry.title || `Journal Entry ${entry.date || new Date().toLocaleDateString()}`,
        content: entry.content,
        date: entry.date || new Date().toISOString().split('T')[0],
        mood: entry.mood || 3,
        tags: entry.tags || []
      };

      uniqueEntries.push(journalEntry);
    }

    try {
      // REAL DATA ONLY: Import all entries with automatic AI analysis
      if (uniqueEntries.length > 0) {
        await importJournalEntries(uniqueEntries);
        result.entriesImported = uniqueEntries.length;
      }
    } catch (error) {
      console.error('Error importing entries:', error);
      result.errors.push(`Failed to import entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }, [importJournalEntries, isDuplicate]);

  // Handle file selection and import
  const handleFileImport = useCallback(async (files: FileList) => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const allEntries: ParsedEntry[] = [];

      // Process each file
      for (const file of Array.from(files)) {
        const content = await file.text();
        const entries = parseJournalFile(content, file.name);
        allEntries.push(...entries);
      }

      if (allEntries.length === 0) {
        addNotification({
          type: 'warning',
          title: 'No Entries Found',
          message: 'No valid journal entries were found in the imported files.'
        });
        return;
      }

      // Process all entries
      const result = await processImportedEntries(allEntries);
      setImportResult(result);
      setShowResult(true);

      if (result.success && result.entriesImported > 0) {
        addNotification({
          type: 'success',
          title: 'Import Successful',
          message: `Successfully imported ${result.entriesImported} journal entries.`
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred during import'
      });
    } finally {
      setIsImporting(false);
    }
  }, [parseJournalFile, processImportedEntries, addNotification]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileImport(files);
    }
  }, [handleFileImport]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      {/* Import Instructions */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2 text-blue-400" />
          Import Journal Entries
        </h3>
        <div className="text-slate-300 space-y-2 mb-4">
          <p>Import your journal entries from the Auto Call app or other sources.</p>
          <p className="text-sm">Supported formats:</p>
          <ul className="text-sm list-disc list-inside ml-4 space-y-1">
            <li><strong>JSON:</strong> Structured data with content, date, title, mood, tags</li>
            <li><strong>CSV:</strong> Spreadsheet format with headers</li>
            <li><strong>TXT/MD:</strong> Plain text or markdown with date headers</li>
            <li><strong>Any text file:</strong> Will be imported as a single entry</li>
          </ul>
        </div>
      </div>

      {/* File Upload Area */}
      <div 
        className="glass-card p-8 border-2 border-dashed border-slate-600 hover:border-blue-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="text-center">
          <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium text-white mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-slate-400 mb-4">
            Select multiple journal files to import at once
          </p>
          
          <input
            type="file"
            multiple
            accept=".txt,.md,.json,.csv"
            onChange={(e) => e.target.files && handleFileImport(e.target.files)}
            className="hidden"
            id="file-upload"
            disabled={isImporting}
          />
          <label
            htmlFor="file-upload"
            className="btn-primary inline-flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{isImporting ? 'Importing...' : 'Select Files'}</span>
          </label>
        </div>
      </div>

      {/* Import Progress */}
      {isImporting && (
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="text-white">Importing journal entries...</span>
          </div>
        </div>
      )}

      {/* Import Results */}
      {showResult && importResult && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
              )}
              Import Results
            </h4>
            <button
              onClick={() => setShowResult(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Processed</p>
              <p className="text-2xl font-bold text-white">{importResult.entriesProcessed}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Imported</p>
              <p className="text-2xl font-bold text-green-400">{importResult.entriesImported}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Duplicates</p>
              <p className="text-2xl font-bold text-yellow-400">{importResult.duplicates}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Errors</p>
              <p className="text-2xl font-bold text-red-400">{importResult.errors.length}</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h5 className="text-red-400 font-medium mb-2">Errors:</h5>
              <ul className="text-red-300 text-sm space-y-1">
                {importResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};