import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { debounce } from '../utils';
import type { 
  UsePaginationResult, 
  UseSearchResult, 
  AsyncOperationResult,
  LoadingState 
} from '../types';

// Enhanced pagination hook with URL sync
export const usePagination = (
  totalItems: number, 
  initialPageSize: number = 20
): UsePaginationResult => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Reset to first page when total items change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    nextPage,
    previousPage,
    goToPage,
    setPageSize: handleSetPageSize
  };
};

// Enhanced search hook with debouncing and performance optimization
export const useSearch = <T>(
  items: T[],
  searchFunction: (item: T, query: string) => boolean,
  debounceMs: number = 300
): UseSearchResult<T> => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search query
  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => {
      setDebouncedQuery(value);
      setIsSearching(false);
    }, debounceMs),
    [debounceMs]
  );

  useEffect(() => {
    if (query !== debouncedQuery) {
      setIsSearching(true);
      debouncedSetQuery(query);
    }
  }, [query, debouncedQuery, debouncedSetQuery]);

  // Memoize filtered results for performance
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }
    return items.filter(item => searchFunction(item, debouncedQuery));
  }, [items, debouncedQuery, searchFunction]);

  return {
    query,
    setQuery,
    filteredItems,
    isSearching
  };
};

// Async operation hook with error handling and loading states
export const useAsyncOperation = <T, P extends any[] = []>(
  asyncFunction: (...args: P) => Promise<T>
) => {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...args: P): Promise<AsyncOperationResult<T>> => {
    const startTime = Date.now();
    setState({ data: null, loading: true, error: null });

    try {
      const result = await asyncFunction(...args);
      setState({ data: result, loading: false, error: null });
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      const appError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: appError });
      
      return {
        success: false,
        error: {
          code: 'ASYNC_OPERATION_ERROR',
          message: appError.message,
          details: appError,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

// Local storage hook with serialization and error handling
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] => {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

// Keyboard shortcut hook
export const useKeyboardShortcut = (
  keys: string[],
  callback: () => void,
  dependencies: any[] = []
) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKeys: string[] = [];
      
      if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl');
      if (event.shiftKey) pressedKeys.push('shift');
      if (event.altKey) pressedKeys.push('alt');
      pressedKeys.push(event.key.toLowerCase());

      const shortcutMatches = keys.length === pressedKeys.length &&
        keys.every(key => pressedKeys.includes(key.toLowerCase()));

      if (shortcutMatches) {
        event.preventDefault();
        callbackRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys, ...dependencies]);
};

// Intersection Observer hook for infinite scrolling
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callbackRef.current();
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [options]);

  return targetRef;
};

// Loading state hook with timeout
export const useLoadingState = (
  initialState: boolean = false,
  timeoutMs?: number
): [LoadingState, (loading: boolean, operation?: string, progress?: number) => void] => {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialState,
    operation: undefined,
    progress: undefined
  });

  const timeoutRef = useRef<number | undefined>(undefined);

  const setLoading = useCallback((
    loading: boolean, 
    operation?: string, 
    progress?: number
  ) => {
    setState({
      isLoading: loading,
      operation,
      progress
    });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout if specified and loading is true
    if (loading && timeoutMs) {
      timeoutRef.current = window.setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false }));
      }, timeoutMs);
    }
  }, [timeoutMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setLoading];
};

// Media query hook for responsive design
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Online/offline status hook
export const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Focus trap hook for accessibility
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        firstElement.blur();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Focus first element when trap becomes active
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
};

// Previous value hook for comparison
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
};

// Cleanup hook for component unmounting
export const useCleanup = (cleanupFunction: () => void) => {
  const cleanupRef = useRef(cleanupFunction);
  
  useEffect(() => {
    cleanupRef.current = cleanupFunction;
  }, [cleanupFunction]);

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
};