import { useState, useRef, useCallback } from 'react';

/**
 * Hook for tracking session statistics and answered questions
 * Handles correct/wrong counts and prevents double-counting on re-answers
 * @returns {Object} Session tracking state and methods
 */
export function useSessionTracking() {
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [showSessionSummary, setShowSessionSummary] = useState(false);

  // Track which questions have been answered in this session to prevent double-counting
  const sessionAnswersRef = useRef(new Map()); // Map<questionId, 'correct'|'wrong'>
  // Track questions that were missed or skipped in this session for "Review Misses" feature
  const sessionMissedQuestionsRef = useRef(new Set()); // Set of question IDs

  /**
   * Record an answer for a question
   * @param {number} questionId - The question ID
   * @param {boolean|null} isCorrect - true = correct, false = wrong, null = skipped
   */
  const recordAnswer = useCallback((questionId, isCorrect) => {
    // Track missed/skipped questions for "Review Misses" feature
    if (isCorrect === true) {
      // Got it right - remove from missed list (if it was there from previous attempt)
      sessionMissedQuestionsRef.current.delete(questionId);
    } else {
      // Either missed (false) or skipped (null) - add to missed list
      sessionMissedQuestionsRef.current.add(questionId);
    }

    // Only track stats if user actually answered (not just clicked Next on question view)
    if (isCorrect !== null) {
      const previousAnswer = sessionAnswersRef.current.get(questionId);
      const newAnswer = isCorrect === true ? 'correct' : 'wrong';

      // If this question was already answered, subtract the old answer first
      if (previousAnswer) {
        setSessionStats(prev => ({
          ...prev,
          [previousAnswer]: prev[previousAnswer] - 1
        }));
      }

      // Add the new answer
      setSessionStats(prev => ({
        ...prev,
        [newAnswer]: prev[newAnswer] + 1
      }));

      // Store this answer in our tracking map
      sessionAnswersRef.current.set(questionId, newAnswer);
    }
  }, []);

  /**
   * Get the answer for a specific question
   * @param {number} questionId - The question ID
   * @returns {'correct'|'wrong'|undefined}
   */
  const getAnswer = useCallback((questionId) => {
    return sessionAnswersRef.current.get(questionId);
  }, []);

  /**
   * Check if a question was answered correctly
   * @param {number} questionId - The question ID
   * @returns {boolean}
   */
  const isAnsweredCorrectly = useCallback((questionId) => {
    return sessionAnswersRef.current.get(questionId) === 'correct';
  }, []);

  /**
   * Reset session tracking (for new practice session)
   */
  const resetSession = useCallback(() => {
    setSessionStats({ correct: 0, wrong: 0 });
    setShowSessionSummary(false);
    sessionAnswersRef.current.clear();
    sessionMissedQuestionsRef.current.clear();
  }, []);

  /**
   * Get count of questions not answered correctly
   * @param {Array} questions - Array of all questions
   * @returns {number}
   */
  const getMissedCount = useCallback((questions) => {
    return questions.filter(q => !isAnsweredCorrectly(q.id)).length;
  }, [isAnsweredCorrectly]);

  /**
   * Get questions that were not answered correctly
   * @param {Array} questions - Array of all questions
   * @returns {Array}
   */
  const getMissedQuestions = useCallback((questions) => {
    return questions.filter(q => !isAnsweredCorrectly(q.id));
  }, [isAnsweredCorrectly]);

  return {
    sessionStats,
    showSessionSummary,
    setShowSessionSummary,
    recordAnswer,
    getAnswer,
    isAnsweredCorrectly,
    resetSession,
    getMissedCount,
    getMissedQuestions,
  };
}
