import { useState, useEffect } from 'react';
import { api } from '../api';

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
    if (session) {
      loadQuestionSets();
    }
  }, [session]);

  return { questionSets, loading, loadQuestionSets };
}
