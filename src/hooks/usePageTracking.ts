// src/hooks/usePageTracking.ts
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalytics } from './useAnalytics';

export const usePageTracking = () => {
  const pathname = usePathname();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Track page view on route change
    if (pathname) {
      trackPageView({
        pageUrl: pathname,
        pageTitle: typeof document !== 'undefined' ? document.title : ''
      });
    }
  }, [pathname, trackPageView]);
};