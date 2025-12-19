import { useState, useEffect } from 'react';
import { api } from '../lib';

export function useQuestionSets(session) {
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQuestionSets = async () => {
    try {
      const data = await api.getQuestionSets();
      setQuestionSets(data.sets);
    } catch (error) {
      console.error('Error loading question sets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load question sets for both authenticated and guest users
    loadQuestionSets();
  }, [session]);

  return { questionSets, loading, loadQuestionSets };
}
