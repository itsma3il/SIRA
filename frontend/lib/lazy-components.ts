/**
 * Lazy-loaded components configuration
 * Improves performance by code-splitting heavy components
 */

import dynamic from 'next/dynamic';
import { ComponentLoader, ChartLoader } from '@/components/loading-components';

// Lazy load chart components
export const RecommendationCharts = dynamic(
  () => import('@/components/recommendation-charts').then(mod => ({ default: mod.RecommendationCharts })),
  {
    loading: ChartLoader,
    ssr: false, // Charts don't need SSR
  }
);

// Lazy load admin analytics components
export const FeedbackTrendsCard = dynamic(
  () => import('@/components/admin/feedback-trends-card').then(mod => ({ default: mod.FeedbackTrendsCard })),
  {
    loading: ComponentLoader,
  }
);

export const RatingDistributionChart = dynamic(
  () => import('@/components/admin/rating-distribution-chart').then(mod => ({ default: mod.RatingDistributionChart })),
  {
    loading: ComponentLoader,
  }
);

export const ImprovementAreasCard = dynamic(
  () => import('@/components/admin/improvement-areas-card').then(mod => ({ default: mod.ImprovementAreasCard })),
  {
    loading: ComponentLoader,
  }
);

export const SystemHealthCard = dynamic(
  () => import('@/components/admin/system-health-card').then(mod => ({ default: mod.SystemHealthCard })),
  {
    loading: ComponentLoader,
  }
);

// Lazy load profile wizard
export const ProfileWizard = dynamic(
  () => import('@/components/profile/profile-wizard').then(mod => ({ default: mod.ProfileWizard })),
  {
    loading: ComponentLoader,
  }
);
