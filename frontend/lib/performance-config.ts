/**
 * Performance Configuration for SIRA Documentation
 * 
 * This file contains performance optimization constants and utilities
 * for the documentation system.
 */

// Intersection Observer options for TOC
export const TOC_OBSERVER_OPTIONS = {
  rootMargin: "-80px 0px -66% 0px",
  threshold: [0, 0.25, 0.5, 0.75, 1]
} as const;

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAYS = {
  TOC_ACTIVE_HEADING: 100,
  SEARCH: 300,
  RESIZE: 150,
  SCROLL: 50
} as const;

// Lazy loading thresholds
export const LAZY_LOAD_CONFIG = {
  rootMargin: "50px",
  threshold: 0.01
} as const;

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  FCP: 1800, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift
  TTFB: 600  // Time to First Byte (ms)
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  DOCS_CONTENT: 'docs-content-v1',
  IMAGES: 'docs-images-v1',
  STATIC: 'docs-static-v1',
  MAX_AGE: 86400 // 24 hours in seconds
} as const;

/**
 * Generic debounce utility
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generic throttle utility
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get optimal scroll behavior based on user preference
 */
export function getScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

/**
 * Optimize image loading with responsive sizes
 */
export function getImageSizes(breakpoints: Record<string, number>) {
  return Object.entries(breakpoints)
    .map(([bp, size]) => `(max-width: ${bp}px) ${size}px`)
    .join(', ');
}

/**
 * Check if browser supports IntersectionObserver
 */
export function supportsIntersectionObserver(): boolean {
  if (typeof window === 'undefined') return false;
  return 'IntersectionObserver' in window;
}

/**
 * Measure performance metric
 */
export function measurePerformance(metricName: string, startMark: string, endMark: string) {
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    performance.measure(metricName, startMark, endMark);
    const measure = performance.getEntriesByName(metricName)[0];
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${metricName} took ${measure.duration.toFixed(2)}ms`);
    }
    
    return measure.duration;
  } catch (error) {
    console.warn('Performance measurement failed:', error);
  }
}
