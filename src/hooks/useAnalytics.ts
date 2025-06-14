// src/hooks/useAnalytics.ts
import { useEffect, useRef } from 'react';

interface TrackPageViewParams {
  newsId?: number;
  pageUrl?: string;
  pageTitle?: string;
  sessionDuration?: number;
}

interface TrackActivityParams {
  activityType: 'LOGIN' | 'VIEW_NEWS' | 'COMMENT' | 'SAVE_POST' | 'REGISTER';
  relatedNewsId?: number;
}

export const useAnalytics = () => {
  const sessionStartTime = useRef<number>(Date.now());
  const currentPageUrl = useRef<string>('');

  useEffect(() => {
    // Update session start time when component mounts
    sessionStartTime.current = Date.now();
    if (typeof window !== 'undefined') {
      currentPageUrl.current = window.location.pathname;
    }

    // Track page unload to send session duration
    const handleBeforeUnload = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      if (sessionDuration > 5) { // Only track if session is longer than 5 seconds
        trackPageView({
          pageUrl: currentPageUrl.current,
          pageTitle: typeof document !== 'undefined' ? document.title : '',
          sessionDuration
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, []);

  const trackPageView = async (params: TrackPageViewParams) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch('http://localhost:5000/api/Analytics/TrackPageView', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && {
            'Authorization': `Bearer ${token}`
          })
        },
        body: JSON.stringify({
          newsId: params.newsId,
          pageUrl: params.pageUrl || (typeof window !== 'undefined' ? window.location.pathname : ''),
          pageTitle: params.pageTitle || (typeof document !== 'undefined' ? document.title : ''),
          sessionDuration: params.sessionDuration || 0
        })
      });

      if (!response.ok) {
        console.warn('Failed to track page view');
      }
    } catch (error) {
      console.warn('Error tracking page view:', error);
    }
  };

  const trackActivity = async (params: TrackActivityParams) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        console.warn('Cannot track activity: user not authenticated');
        return;
      }

      const response = await fetch('http://localhost:5000/api/Analytics/TrackActivity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          activityType: params.activityType,
          relatedNewsId: params.relatedNewsId
        })
      });

      if (!response.ok) {
        console.warn('Failed to track activity');
      }
    } catch (error) {
      console.warn('Error tracking activity:', error);
    }
  };

  const trackNewsView = async (newsId: number, sessionDuration: number = 0) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`http://localhost:5000/api/Analytics/TrackNewsView?newsId=${newsId}&sessionDuration=${sessionDuration}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && {
            'Authorization': `Bearer ${token}`
          })
        }
      });

      if (!response.ok) {
        console.warn('Failed to track news view');
      }
    } catch (error) {
      console.warn('Error tracking news view:', error);
    }
  };

  const getPopularContent = async (limit: number = 10, sortBy: string = 'ViewCount') => {
    try {
      const response = await fetch(`http://localhost:5000/api/Analytics/GetPopularContent?limit=${limit}&sortBy=${sortBy}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.statusCode === 1) {
          return result.data;
        }
      }
      return [];
    } catch (error) {
      console.warn('Error getting popular content:', error);
      return [];
    }
  };

  const getTrendingTopics = async (hours: number = 24, limit: number = 5) => {
    try {
      const response = await fetch(`http://localhost:5000/api/Analytics/GetTrendingTopics?hours=${hours}&limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.statusCode === 1) {
          return result.data;
        }
      }
      return [];
    } catch (error) {
      console.warn('Error getting trending topics:', error);
      return [];
    }
  };

  return {
    trackPageView,
    trackActivity,
    trackNewsView,
    getPopularContent,
    getTrendingTopics
  };
};