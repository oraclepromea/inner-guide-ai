// REAL DATA ONLY: Enhanced Journal File Import Component with Local Copy Management
// Creates and maintains local copies of imported files for reference and re-import
// No mock data - all imported entries are analyzed with real AI if configured

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, Folder, RefreshCw, Trash2, Eye } from 'lucide-react';
import { useAppStore } from '../stores';
import type { JournalEntry } from '../types';

interface ImportResult {
  success: boolean;
  entriesImported: number;
  duplicatesSkipped: number;
  errors: string[];
}

interface LocalCopy {
  id: string;
  fileName: string;
  originalSize: number;
  importDate: string;
  entriesCount: number;
  lastImportDate?: string;
  fileContent: string;
  checksum: string;
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
  const [localCopies, setLocalCopies] = useState<LocalCopy[]>([]);
  const [selectedCopy, setSelectedCopy] = useState<LocalCopy | null>(null);
  const [showCopyDetails, setShowCopyDetails] = useState(false);

  // Load local copies from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('journal-import-local-copies');
    if (stored) {
      try {
        setLocalCopies(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load local copies:', error);
      }
    }
  }, []);

  // Save local copies to localStorage
  const saveLocalCopies = useCallback((copies: LocalCopy[]) => {
    localStorage.setItem('journal-import-local-copies', JSON.stringify(copies));
    setLocalCopies(copies);
  }, []);

  // Generate checksum for file content
  const generateChecksum = useCallback((content: string): string => {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }, []);

  // Create local copy of imported file
  const createLocalCopy = useCallback((file: File, content: string, entriesCount: number): LocalCopy => {
    const copy: LocalCopy = {
      id: crypto.randomUUID(),
      fileName: file.name,
      originalSize: file.size,
      importDate: new Date().toISOString(),
      entriesCount,
      fileContent: content,
      checksum: generateChecksum(content)
    };
    return copy;
  }, [generateChecksum]);

  // Check if local copy already exists
  const findExistingCopy = useCallback((fileName: string, checksum: string): LocalCopy | undefined => {
    return localCopies.find(copy => 
      copy.fileName === fileName && copy.checksum === checksum
    );
  }, [localCopies]);

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
      const checksum = generateChecksum(content);
      
      // Check if we already have this file as a local copy
      const existingCopy = findExistingCopy(file.name, checksum);
      
      const jsonData = JSON.parse(content);
      
      // Parse entries based on format
      const parsedEntries = parseAutoCallBackup(jsonData);
      
      if (parsedEntries.length === 0) {
        result.errors.push('No valid journal entries found in file');
        result.success = false;
        return result;
      }

      // Create or update local copy
      if (existingCopy) {
        // Update existing copy with new import date
        const updatedCopies = localCopies.map(copy =>
          copy.id === existingCopy.id
            ? { ...copy, lastImportDate: new Date().toISOString() }
            : copy
        );
        saveLocalCopies(updatedCopies);
      } else {
        // Create new local copy
        const newCopy = createLocalCopy(file, content, parsedEntries.length);
        saveLocalCopies([...localCopies, newCopy]);
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
  }, [parseAutoCallBackup, isDuplicate, importJournalEntries, generateChecksum, findExistingCopy, localCopies, saveLocalCopies, createLocalCopy]);

  // Re-import from local copy
  const reImportFromLocalCopy = useCallback(async (copy: LocalCopy) => {
    setIsImporting(true);
    try {
      const jsonData = JSON.parse(copy.fileContent);
      const parsedEntries = parseAutoCallBackup(jsonData);
      
      const newEntries = parsedEntries.filter(entry => !isDuplicate(entry));
      
      if (newEntries.length > 0) {
        await importJournalEntries(newEntries, `Re-import from ${copy.fileName}`);
        
        // Update local copy with new import date
        const updatedCopies = localCopies.map(c =>
          c.id === copy.id
            ? { ...c, lastImportDate: new Date().toISOString() }
            : c
        );
        saveLocalCopies(updatedCopies);
        
        addNotification({
          type: 'success',
          title: 'Re-import Successful',
          message: `Re-imported ${newEntries.length} entries from ${copy.fileName}`
        });
      } else {
        addNotification({
          type: 'info',
          title: 'No New Entries',
          message: 'All entries from this file are already imported'
        });
      }
    } catch (error) {
      console.error('Re-import failed:', error);
      addNotification({
        type: 'error',
        title: 'Re-import Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsImporting(false);
    }
  }, [parseAutoCallBackup, isDuplicate, importJournalEntries, localCopies, saveLocalCopies, addNotification]);

  // Delete local copy
  const deleteLocalCopy = useCallback((copyId: string) => {
    if (window.confirm('Are you sure you want to delete this local copy?')) {
      const updatedCopies = localCopies.filter(copy => copy.id !== copyId);
      saveLocalCopies(updatedCopies);
      addNotification({
        type: 'success',
        title: 'Local Copy Deleted',
        message: 'The local copy has been removed'
      });
    }
  }, [localCopies, saveLocalCopies, addNotification]);

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
          message: `Imported ${combinedResult.entriesImported} entries. Local copies saved for reference.`
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
    e.target.value = '';
  }, [handleFileImport]);

  return (
    <div className="space-y-6">
      {/* Local Copies Management */}
      {localCopies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Folder className="w-5 h-5 mr-2" />
              Local Copies ({localCopies.length})
            </h3>
            <button
              onClick={() => setShowCopyDetails(!showCopyDetails)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showCopyDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showCopyDetails && (
            <div className="space-y-3">
              {localCopies.map((copy) => (
                <div key={copy.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{copy.fileName}</span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {copy.entriesCount} entries • {(copy.originalSize / 1024).toFixed(1)} KB • 
                        Added {new Date(copy.importDate).toLocaleDateString()}
                        {copy.lastImportDate && (
                          <span> • Last re-import {new Date(copy.lastImportDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedCopy(copy)}
                        className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => reImportFromLocalCopy(copy)}
                        disabled={isImporting}
                        className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        title="Re-import from this copy"
                      >
                        <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => deleteLocalCopy(copy.id)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete local copy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Import Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Import Journal Files
        </h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Auto Call Backup Format Supported</p>
                <p>Files are automatically saved as local copies that can be referenced and re-imported:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Local copies are stored for easy re-import</li>
                  <li>Duplicate detection prevents re-importing same entries</li>
                  <li>Original file format is preserved</li>
                  <li>Auto-tagged with "auto-call-import" for tracking</li>
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
              Drop journal backup files here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Or click to select JSON backup files (local copies will be created)
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
                <span className="text-blue-700 dark:text-blue-300">Processing backup files and creating local copies...</span>
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