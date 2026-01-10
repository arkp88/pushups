import { useState, useEffect } from 'react';
import { api } from '../lib';

export function useStats(session) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadStats();
    } else {
      // For guests, return empty stats
      setStats({
        total_questions: 0,
        attempted: 0,
        correct: 0,
        missed: 0,
        accuracy: 0,
        bookmarks: 0,
        streak_days: 0
      });
      setLoading(false);
    }
  }, [session]);

  return { stats, loading, loadStats };
}
