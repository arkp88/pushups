import { useState, useEffect } from 'react';
import { api } from '../lib';

export function useQuestionSets(session) {
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQuestionSets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getQuestionSets();
      setQuestionSets(data.sets);
      setLoading(false);
    } catch (error) {
      console.error('Error loading question sets:', error);
      setError(error.message || 'Failed to load question sets');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load question sets for both authenticated and guest users
    loadQuestionSets();
  }, [session]);

  return { questionSets, loading, error, loadQuestionSets };
}
