"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Web Vitals monitoring component
 * Tracks Core Web Vitals and reports them in development mode
 */
export function WebVitals() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return;
    }

    // Track route changes
    const routeChangeStart = performance.now();

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('[Performance] Navigation Timing:', {
            DNS: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            TCP: navEntry.connectEnd - navEntry.connectStart,
            Request: navEntry.responseStart - navEntry.requestStart,
            Response: navEntry.responseEnd - navEntry.responseStart,
            DOM: navEntry.domContentLoadedEventEnd - navEntry.responseEnd,
            Load: navEntry.loadEventEnd - navEntry.loadEventStart,
            Total: navEntry.loadEventEnd - navEntry.fetchStart,
          });
        }

        if (entry.entryType === 'paint') {
          console.log(`[Performance] ${entry.name}:`, entry.startTime.toFixed(2), 'ms');
        }

        if (entry.entryType === 'largest-contentful-paint') {
          console.log('[Performance] LCP:', entry.startTime.toFixed(2), 'ms');
        }

        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          console.log('[Performance] FID:', fidEntry.processingStart - fidEntry.startTime, 'ms');
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input'] });
    } catch (e) {
      // Some entry types might not be supported
      console.warn('[Performance] Some performance metrics not available');
    }

    // Track route change duration
    return () => {
      observer.disconnect();
      const routeChangeDuration = performance.now() - routeChangeStart;
      console.log('[Performance] Route change duration:', routeChangeDuration.toFixed(2), 'ms');
    };
  }, [pathname]);

  return null;
}

/**
 * Hook to measure custom performance metrics
 */
export function usePerformanceMetric(metricName: string, dependencies: unknown[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return;
    }

    const startMark = `${metricName}-start`;
    const endMark = `${metricName}-end`;

    performance.mark(startMark);

    return () => {
      performance.mark(endMark);
      try {
        performance.measure(metricName, startMark, endMark);
        const measure = performance.getEntriesByName(metricName)[0];
        if (measure) {
          console.log(`[Performance] ${metricName}:`, measure.duration.toFixed(2), 'ms');
        }
      } catch (e) {
        // Marks might not exist
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
