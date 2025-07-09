import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { JournalEntry, MoodEntry, BaseComponentProps } from '../types';
import { usePagination, useSearch } from '../hooks';
import { formatRelativeTime, debounce } from '../utils';

interface VirtualizedListProps extends BaseComponentProps {
  items: (JournalEntry | MoodEntry)[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: JournalEntry | MoodEntry, index: number) => React.ReactNode;
  overscan?: number;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
}

export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  searchPlaceholder = "Search entries...",
  enableSearch = true,
  enablePagination = true,
  pageSize = 20,
  className = '',
  testId,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search functionality
  const searchFn = useCallback((item: JournalEntry | MoodEntry, query: string) => {
    if ('content' in item) {
      return item.content.toLowerCase().includes(query.toLowerCase());
    }
    if ('notes' in item && item.notes) {
      return item.notes.toLowerCase().includes(query.toLowerCase());
    }
    return false;
  }, []);

  const { query, setQuery, filteredItems, isSearching } = useSearch(items, searchFn);

  // Pagination
  const pagination = usePagination(filteredItems.length, pageSize);
  const paginatedItems = enablePagination 
    ? filteredItems.slice(pagination.startIndex, pagination.endIndex)
    : filteredItems;

  // Virtual scrolling calculations
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(paginatedItems.length, startIndex + visibleCount + overscan * 2);
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, paginatedItems.length]);

  const visibleItems = paginatedItems.slice(visibleRange.startIndex, visibleRange.endIndex);
  const totalHeight = paginatedItems.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = debounce((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // ~60fps

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [query, pagination.currentPage]);

  return (
    <div className={`space-y-4 ${className}`} data-testid={testId} {...props}>
      {/* Search and Controls */}
      {enableSearch && (
        <div className="flex items-center space-x-4 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-400">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      )}

      {/* Virtual List Container */}
      <div 
        ref={containerRef}
        className="relative overflow-auto border border-slate-600/30 rounded-xl bg-slate-800/20"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => (
              <div 
                key={item.id || index}
                style={{ height: itemHeight }}
                className="border-b border-slate-600/20 last:border-b-0"
              >
                {renderItem(item, visibleRange.startIndex + index)}
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 mb-4 opacity-50">
              <Search className="w-full h-full" />
            </div>
            <p className="text-lg font-medium mb-2">No entries found</p>
            <p className="text-sm text-center">
              {query ? `No entries match "${query}"` : 'Start by creating your first entry'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {enablePagination && filteredItems.length > pageSize && (
        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
          <div className="flex items-center space-x-2">
            <button
              onClick={pagination.previousPage}
              disabled={!pagination.hasPreviousPage}
              className="p-2 rounded-lg bg-slate-700/50 border border-slate-600/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-300">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-lg bg-slate-700/50 border border-slate-600/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-gray-400">
            Showing {pagination.startIndex + 1}-{pagination.endIndex} of {filteredItems.length}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Entry Card Component for better performance
interface OptimizedEntryCardProps {
  entry: JournalEntry | MoodEntry;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const OptimizedEntryCard: React.FC<OptimizedEntryCardProps> = React.memo(({ 
  entry, 
  onClick, 
  onEdit, 
  onDelete 
}) => {
  const isJournalEntry = 'content' in entry;
  
  return (
    <div 
      className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-300">
              {formatRelativeTime(entry.createdAt)}
            </span>
            
            {isJournalEntry && entry.mood && (
              <span className="text-lg">
                {[,'😢','😞','😐','😊','😄'][entry.mood]}
              </span>
            )}
            
            {!isJournalEntry && (
              <span className="text-lg">
                {[,'😢','😞','😐','😊','😄'][entry.mood]}
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-400 line-clamp-2">
            {isJournalEntry ? entry.content : entry.notes || 'No notes'}
          </div>
          
          {isJournalEntry && entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs bg-violet-500/20 text-violet-300 rounded-md"
                >
                  {tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{entry.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-gray-400 hover:text-white rounded transition-colors"
              aria-label="Edit entry"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
              aria-label="Delete entry"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

OptimizedEntryCard.displayName = 'OptimizedEntryCard';