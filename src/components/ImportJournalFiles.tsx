// REAL DATA ONLY: Manual Journal File Import Component
// No mock data - all imported entries are analyzed with real AI if configured
// Automatically triggers AI analysis for imported journal entries

import React, { useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useAppStore } from '../stores';
import type { JournalEntry } from '../types';

interface ImportResult {
  success: boolean;
  entriesImported: number;
  duplicatesSkipped: number;
  errors: string[];
}

// Enhanced Auto Call backup format interface
interface AutoCallEntry {
  content?: string;
  text?: string;
  body?: string;
  date?: string;
  created_at?: string;
  timestamp?: string;
  title?: string;
  subject?: string;
  mood?: number;
  rating?: number;
  tags?: string[];
  [key: string]: any;
}

export const ImportJournalFiles: React.FC = () => {
  const { importJournalEntries, journalEntries, addNotification } = useAppStore();
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  // Enhanced parsing for Auto Call backup format
  const parseAutoCallBackup = useCallback((jsonData: any): Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const entries: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    try {
      // Handle array of entries (typical Auto Call backup format)
      if (Array.isArray(jsonData)) {
        for (const item of jsonData) {
          const entry = parseAutoCallEntry(item);
          if (entry) entries.push(entry);
        }
      }
      // Handle object with entries array
      else if (jsonData.entries && Array.isArray(jsonData.entries)) {
        for (const item of jsonData.entries) {
          const entry = parseAutoCallEntry(item);
          if (entry) entries.push(entry);
        }
      }
      // Handle single entry object
      else if (jsonData.content || jsonData.text || jsonData.body) {
        const entry = parseAutoCallEntry(jsonData);
        if (entry) entries.push(entry);
      }
      // Handle Inner Guide format (existing functionality)
      else if (jsonData.journalEntries && Array.isArray(jsonData.journalEntries)) {
        for (const item of jsonData.journalEntries) {
          if (item.content && item.date) {
            entries.push({
              title: item.title || 'Imported Entry',
              content: item.content,
              date: item.date,
              mood: item.mood || 3,
              tags: [...(item.tags || []), 'imported']
            });
          }
        }
      }
    } catch (error) {
      console.error('Error parsing backup data:', error);
      throw new Error('Failed to parse backup file format');
    }

    return entries;
  }, []);

  // Parse individual Auto Call entry
  const parseAutoCallEntry = useCallback((item: AutoCallEntry): Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> | null => {
    // Extract content from various possible fields
    const content = item.content || item.text || item.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return null;
    }

    // Extract date from various possible fields
    let date = item.date || item.created_at || item.timestamp;
    if (date) {
      // Convert timestamp to date if needed
      if (typeof date === 'number') {
        date = new Date(date).toISOString().split('T')[0];
      } else if (typeof date === 'string') {
        // Handle various date formats
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split('T')[0];
        } else {
          date = new Date().toISOString().split('T')[0];
        }
      }
    } else {
      date = new Date().toISOString().split('T')[0];
    }

    // Extract title
    const title = item.title || item.subject || 'Auto Call Import';

    // Extract mood/rating
    let mood = item.mood || item.rating || 3;
    if (typeof mood !== 'number' || mood < 1 || mood > 5) {
      mood = 3;
    }

    // Extract and enhance tags
    const originalTags = Array.isArray(item.tags) ? item.tags : [];
    const tags = [...originalTags, 'auto-call-import'];

    return {
      title,
      content: content.trim(),
      date,
      mood,
      tags
    };
  }, []);

  // Check for duplicates
  const isDuplicate = useCallback((entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): boolean => {
    return journalEntries.some(existing => 
      existing.content.trim() === entry.content.trim() &&
      existing.date === entry.date
    );
  }, [journalEntries]);

  // Process file content
  const processFile = useCallback(async (file: File): Promise<ImportResult> => {
    const result: ImportResult = {
      success: true,
      entriesImported: 0,
      duplicatesSkipped: 0,
      errors: []
    };

    try {
      const content = await file.text();
      const jsonData = JSON.parse(content);
      
      // Parse entries based on format
      const parsedEntries = parseAutoCallBackup(jsonData);
      
      if (parsedEntries.length === 0) {
        result.errors.push('No valid journal entries found in file');
        result.success = false;
        return result;
      }

      // Filter out duplicates
      const newEntries = parsedEntries.filter(entry => {
        if (isDuplicate(entry)) {
          result.duplicatesSkipped++;
          return false;
        }
        return true;
      });

      // Import new entries
      if (newEntries.length > 0) {
        await importJournalEntries(newEntries, `Import from ${file.name}`);
        result.entriesImported = newEntries.length;
      }

    } catch (error) {
      console.error('Import error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      result.success = false;
    }

    return result;
  }, [parseAutoCallBackup, isDuplicate, importJournalEntries]);

  // Handle file selection and import
  const handleFileImport = useCallback(async (files: FileList | File[]) => {
    setIsImporting(true);
    
    const allResults: ImportResult[] = [];
    
    try {
      for (const file of Array.from(files)) {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const result = await processFile(file);
          allResults.push(result);
        } else {
          allResults.push({
            success: false,
            entriesImported: 0,
            duplicatesSkipped: 0,
            errors: [`Unsupported file type: ${file.name}`]
          });
        }
      }

      // Combine results
      const combinedResult: ImportResult = {
        success: allResults.every(r => r.success),
        entriesImported: allResults.reduce((sum, r) => sum + r.entriesImported, 0),
        duplicatesSkipped: allResults.reduce((sum, r) => sum + r.duplicatesSkipped, 0),
        errors: allResults.flatMap(r => r.errors)
      };

      setLastResult(combinedResult);

      // Show notification
      if (combinedResult.success && combinedResult.entriesImported > 0) {
        addNotification({
          type: 'success',
          title: 'Import Successful',
          message: `Imported ${combinedResult.entriesImported} entries. ${combinedResult.duplicatesSkipped} duplicates skipped.`
        });
      } else if (combinedResult.entriesImported > 0) {
        addNotification({
          type: 'warning',
          title: 'Import Partially Successful',
          message: `Imported ${combinedResult.entriesImported} entries with some errors.`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Import Failed',
          message: combinedResult.errors[0] || 'No entries were imported'
        });
      }

    } catch (error) {
      console.error('Import process failed:', error);
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsImporting(false);
    }
  }, [processFile, addNotification]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/json' || file.name.endsWith('.json')
    );
    
    if (files.length > 0) {
      handleFileImport(files);
    } else {
      addNotification({
        type: 'error',
        title: 'Invalid Files',
        message: 'Please select JSON files only'
      });
    }
  }, [handleFileImport, addNotification]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileImport(files);
    }
    // Reset input
    e.target.value = '';
  }, [handleFileImport]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Import Auto Call Journal Backups
        </h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Auto Call Backup Format Supported</p>
                <p>This importer can handle your Auto Call journal backup files. It will automatically:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Parse the backup JSON format</li>
                  <li>Extract journal entries, dates, and metadata</li>
                  <li>Skip duplicate entries</li>
                  <li>Add "auto-call-import" tags for tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Drop Auto Call backup files here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Or click to select JSON backup files
            </p>
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              <Upload className="h-4 w-4 mr-2" />
              Select Files
              <input
                type="file"
                accept=".json,application/json"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Import Status */}
          {isImporting && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 dark:text-blue-300">Processing backup files...</span>
              </div>
            </div>
          )}

          {/* Last Import Result */}
          {lastResult && !isImporting && (
            <div className={`border rounded-lg p-4 ${
              lastResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-3">
                {lastResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className={`text-sm ${
                  lastResult.success 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  <p className="font-medium mb-1">
                    {lastResult.success ? 'Import Completed' : 'Import Issues'}
                  </p>
                  <ul className="space-y-1">
                    <li>✓ {lastResult.entriesImported} entries imported</li>
                    {lastResult.duplicatesSkipped > 0 && (
                      <li>⚠ {lastResult.duplicatesSkipped} duplicates skipped</li>
                    )}
                    {lastResult.errors.map((error, index) => (
                      <li key={index}>✗ {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};