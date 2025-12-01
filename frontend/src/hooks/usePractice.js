import { useState } from 'react';
import { api } from '../api';

export function usePractice() {
  const [questions, setQuestions] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState('single');
  const [startingPractice, setStartingPractice] = useState(false);
  const [processingNext, setProcessingNext] = useState(false);
  const [practiceNotification, setPracticeNotification] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(null);
  
  // Track sets opened in current random session (to prevent cycling)
  const [setsOpenedThisSession, setSetsOpenedThisSession] = useState([]);

  const startPractice = async (set, isRandomSession = false) => {
    try {
      setStartingPractice(true);
      await api.markSetOpened(set.id);
      localStorage.setItem('pushups-last-set-id', set.id);
      
      // Track this set in the current random session
      if (isRandomSession) {
        setSetsOpenedThisSession(prev => [...prev, set.id]);
      }
      
      const data = await api.getQuestions(set.id);
      setQuestions(data.questions);
      setCurrentSet(set);
      
      const savedPosition = localStorage.getItem(`pushups-quiz-position-${set.id}`);
      const startIndex = savedPosition ? parseInt(savedPosition) : 0;
      
      setCurrentQuestionIndex(startIndex);
      setIsFlipped(false);
      setPracticeMode('single');
      
      if (savedPosition) {
        setPracticeNotification(`Resuming from question ${startIndex + 1}`);
        setTimeout(() => setPracticeNotification(''), 3000);
      }

      return true; // Success
    } catch (error) {
      alert('Error loading questions: ' + error.message);
      return false;
    } finally {
      setStartingPractice(false);
    }
  };

  const startMixedPractice = async (filter) => {
    try {
      setStartingPractice(true);
      
      // Clear random session tracking when entering mixed mode
      setSetsOpenedThisSession([]);
      
      const data = await api.getMixedQuestions(filter);
      
      if (data.questions.length === 0) {
        alert(`No ${filter} questions found!`);
        return false;
      }
      
      setQuestions(data.questions);
      setCurrentSet({ name: `Random Mode (${filter})`, id: 'mixed' });
      setCurrentQuestionIndex(0);
      setIsFlipped(false);
      setPracticeMode('mixed');
      
      return true;
    } catch (error) {
      alert('Error loading randomized questions: ' + error.message);
      return false;
    } finally {
      setStartingPractice(false);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = async (markAsCorrect = null, onComplete) => {
    if (processingNext) return;
    
    try {
      setProcessingNext(true);
      
      const currentQuestion = questions[currentQuestionIndex];
      
      await api.updateProgress(currentQuestion.id, true, markAsCorrect);
      if (markAsCorrect === false) await api.markMissed(currentQuestion.id);
      if (markAsCorrect === true && currentQuestion.is_missed) await api.unmarkMissed(currentQuestion.id);

      if (currentQuestionIndex < questions.length - 1) {
        const newIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(newIndex);
        setIsFlipped(false);
        if (currentSet.id !== 'mixed') localStorage.setItem(`pushups-quiz-position-${currentSet.id}`, newIndex);
        
        setProcessingNext(false);
      } else {
        alert('Session complete!');
        
        if (currentSet.id !== 'mixed') {
          localStorage.removeItem(`pushups-quiz-position-${currentSet.id}`);
          localStorage.removeItem('pushups-last-set-id');
        }
        
        setProcessingNext(false);
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      setProcessingNext(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      setIsFlipped(false);
      localStorage.setItem(`pushups-quiz-position-${currentSet.id}`, newIndex);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    const currentQuestion = questions[currentQuestionIndex];
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].is_bookmarked = !currentQuestion.is_bookmarked;
    setQuestions(updatedQuestions);

    try {
      await api.toggleBookmark(currentQuestion.id);
    } catch (error) {
      console.error('Bookmark failed:', error);
      updatedQuestions[currentQuestionIndex].is_bookmarked = !updatedQuestions[currentQuestionIndex].is_bookmarked;
      setQuestions([...updatedQuestions]);
    }
  };

  return {
    // State
    questions,
    currentSet,
    currentQuestionIndex,
    isFlipped,
    practiceMode,
    startingPractice,
    processingNext,
    practiceNotification,
    enlargedImage,
    
    // Session tracking
    setsOpenedThisSession,
    clearSessionTracking: () => setSetsOpenedThisSession([]),
    setPracticeNotification,
    
    // Actions
    startPractice,
    startMixedPractice,
    handleFlip,
    handleNext,
    handlePrevious,
    handleBookmark,
    setPracticeNotification,
    setEnlargedImage,
  };
}
