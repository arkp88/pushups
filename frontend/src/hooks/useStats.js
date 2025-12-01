import { useState, useEffect } from 'react';
import { api } from '../api';

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
    }
  }, [session]);

  return { stats, loading, loadStats };
}
