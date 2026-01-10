import { useState, useRef } from 'react';
import { api } from '../lib';
import { STORAGE_KEYS, getQuizPositionKey } from '../constants';

export function usePractice(session, setAppNotification = () => {}) {
  const [questions, setQuestions] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState('single');
  const [startingPractice, setStartingPractice] = useState(false);
  const [processingNext, setProcessingNext] = useState(false);
  const [practiceNotification, setPracticeNotification] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(null);

  // Instructions state
  const [setInstructions, setSetInstructions] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);

  // Track sets opened in current random session (to prevent cycling)
  const [setsOpenedThisSession, setSetsOpenedThisSession] = useState([]);

  // Text-to-speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // FIX #1: Track if we've added voiceschanged listener to prevent memory leak
  const voicesListenerAddedRef = useRef(false);

  // Session stats tracking
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  // FIX #35: Track which questions have been answered in this session to prevent double-counting
  // when user clicks Previous and answers same question again
  const sessionAnswersRef = useRef(new Map()); // Map<questionId, 'correct'|'wrong'>
  // Track questions that were missed or skipped in this session for "Review Misses" feature
  const sessionMissedQuestionsRef = useRef(new Set()); // Set of question IDs

  const startPractice = async (set, isRandomSession = false) => {
    try {
      setStartingPractice(true);

      // Mark set as opened in backend (authenticated only), but always track in localStorage
      if (session) {
        await api.markSetOpened(set.id);
      }
      // Track last set for both guests and authenticated users (for "Continue Last Set")
      localStorage.setItem(STORAGE_KEYS.LAST_SET_ID, set.id);

      // Track this set in the current random session
      if (isRandomSession) {
        setSetsOpenedThisSession(prev => [...prev, set.id]);
      }

      const data = await api.getQuestions(set.id);
      setQuestions(data.questions);
      setSetInstructions(data.instructions || []);
      setShowInstructions(false); // Reset when starting new practice
      setCurrentSet(set);

      const savedPosition = localStorage.getItem(getQuizPositionKey(set.id));
      const startIndex = savedPosition ? parseInt(savedPosition) : 0;

      setCurrentQuestionIndex(startIndex);
      setIsFlipped(false);
      setPracticeMode('single');

      // Reset session stats when starting new practice
      setSessionStats({ correct: 0, wrong: 0 });
      setShowSessionSummary(false);
      // FIX #35: Clear session answers tracking
      sessionAnswersRef.current.clear();
      // Clear session missed questions tracking
      sessionMissedQuestionsRef.current.clear();

      if (savedPosition) {
        setPracticeNotification(`Resuming from question ${startIndex + 1}`);
        setTimeout(() => setPracticeNotification(''), 3000);
      }

      return true; // Success
    } catch (error) {
      // REPLACE alert()
      setAppNotification('Error loading questions: ' + error.message, true);
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
        // REPLACE alert()
        setPracticeNotification(`ℹ️ No ${filter} questions found!`);
        setTimeout(() => setPracticeNotification(''), 4000);
        return false;
      }

      setQuestions(data.questions);
      setSetInstructions([]); // Clear instructions for mixed mode
      setShowInstructions(false);
      setCurrentSet({ name: `Random Mode (${filter})`, id: 'mixed' });
      setCurrentQuestionIndex(0);
      setIsFlipped(false);
      setPracticeMode('mixed');

      // Reset session stats when starting new practice
      setSessionStats({ correct: 0, wrong: 0 });
      setShowSessionSummary(false);
      // FIX #35: Clear session answers tracking
      sessionAnswersRef.current.clear();
      // Clear session missed questions tracking
      sessionMissedQuestionsRef.current.clear();

      return true;
    } catch (error) {
      // REPLACE alert()
      setAppNotification('Error loading randomized questions: ' + error.message, true);
      return false;
    } finally {
      setStartingPractice(false);
    }
  };

  const handleFlip = () => {
    stopSpeaking(); // Stop speech when flipping card
    setIsFlipped(!isFlipped);
  };

  const handleNext = async (markAsCorrect = null, onComplete) => {
    if (processingNext) return;

    try {
      setProcessingNext(true);

      const currentQuestion = questions[currentQuestionIndex];

      // FIX #35: Track session stats per question ID to prevent double-counting
      // when user clicks Previous and re-answers the same question
      // Note: markAsCorrect can be true (got it), false (missed it), or null (next/skip without answer)
      const questionId = currentQuestion.id;
      
      // Track missed/skipped questions for "Review Misses" feature
      if (markAsCorrect === true) {
        // Got it right - remove from missed list (if it was there from previous attempt)
        sessionMissedQuestionsRef.current.delete(questionId);
      } else {
        // Either missed (false) or skipped (null) - add to missed list
        sessionMissedQuestionsRef.current.add(questionId);
      }
      
      // Only track stats if user actually answered (not just clicked Next on question view)
      if (markAsCorrect !== null) {
        const previousAnswer = sessionAnswersRef.current.get(questionId);
        const newAnswer = markAsCorrect === true ? 'correct' : 'wrong';

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

      // Only update progress if user is authenticated
      if (session) {
        await api.updateProgress(currentQuestion.id, true, markAsCorrect);
        if (markAsCorrect === false) await api.markMissed(currentQuestion.id);
        if (markAsCorrect === true && currentQuestion.is_missed) await api.unmarkMissed(currentQuestion.id);
      }

      if (currentQuestionIndex < questions.length - 1) {
        const newIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(newIndex);
        setIsFlipped(false);
        stopSpeaking(); // Stop speech when moving to next question
        if (currentSet.id !== 'mixed') localStorage.setItem(getQuizPositionKey(currentSet.id), newIndex);

        setProcessingNext(false);
      } else {
        // Session complete - show summary modal
        if (currentSet.id !== 'mixed') {
          localStorage.removeItem(getQuizPositionKey(currentSet.id));
          localStorage.removeItem(STORAGE_KEYS.LAST_SET_ID);
        }

        // FIX #2: Set showSessionSummary FIRST, then clear processing state
        // This prevents race condition where rapid clicks could trigger multiple summaries
        setShowSessionSummary(true);
        setProcessingNext(false);
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      // Use general app notification for hard error
      setAppNotification('Error saving progress: ' + error.message, true);
      setProcessingNext(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      setIsFlipped(false);
      stopSpeaking(); // Stop speech when moving to previous question
      localStorage.setItem(getQuizPositionKey(currentSet.id), newIndex);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();

    // Guests can't bookmark - show message
    if (!session) {
      setAppNotification('Sign in to bookmark questions', true);
      return;
    }

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

  // Text-to-speech functions
  const speakText = (e) => {
    e.stopPropagation(); // Prevent card flip

    if (!window.speechSynthesis) {
      setAppNotification('Text-to-speech is not supported in your browser.', true);
      return;
    }

    // If already speaking, stop it
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const textToSpeak = isFlipped
      ? currentQuestion.answer_text
      : currentQuestion.question_text;

    // Strip HTML tags for speech
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textToSpeak;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    const utterance = new SpeechSynthesisUtterance(plainText);

    // Function to set voice once voices are loaded
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      // Prefer natural-sounding voices (Google, Microsoft, Apple Enhanced)
      const preferredVoice = voices.find(voice =>
        voice.name.includes('Google') ||
        voice.name.includes('Enhanced') ||
        voice.name.includes('Premium') ||
        (voice.name.includes('Samantha') && voice.lang === 'en-US')
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    };

    // Try to set voice immediately
    setVoice();

    // FIX #1: Only add voiceschanged listener once to prevent memory leak
    // If voices aren't loaded yet, wait for them (but only add listener once)
    if (window.speechSynthesis.getVoices().length === 0 && !voicesListenerAddedRef.current) {
      voicesListenerAddedRef.current = true;
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        setVoice();
        voicesListenerAddedRef.current = false; // Reset so future calls can add if needed
      }, { once: true });
    }

    // Slower, more natural rate
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setAppNotification('Speech error occurred.', true);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const reviewSessionMisses = () => {
    // Include ALL questions that were NOT answered correctly in this session
    // This includes: questions marked wrong, questions skipped, and questions not seen
    const missedQuestions = questions.filter(q => {
      const answer = sessionAnswersRef.current.get(q.id);
      return answer !== 'correct'; // Include if not answered correctly (wrong, skipped, or not seen)
    });
    
    if (missedQuestions.length === 0) {
      setPracticeNotification('🎉 No misses to review - you got everything!');
      setTimeout(() => setPracticeNotification(''), 4000);
      return;
    }
    
    // Start practice with just the missed questions from this session
    setQuestions(missedQuestions);
    setCurrentQuestionIndex(0);
    setIsFlipped(false);
    setShowSessionSummary(false);
    
    // Reset session stats for the review session
    setSessionStats({ correct: 0, wrong: 0 });
    sessionAnswersRef.current.clear();
    sessionMissedQuestionsRef.current.clear();
    
    setPracticeNotification(`Reviewing ${missedQuestions.length} missed question${missedQuestions.length > 1 ? 's' : ''} from this session`);
    setTimeout(() => setPracticeNotification(''), 4000);
  };

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
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
    isSpeaking,

    // Instructions
    setInstructions,
    showInstructions,
    toggleInstructions,

    // Session tracking
    setsOpenedThisSession,
    clearSessionTracking: () => setSetsOpenedThisSession([]),
    setPracticeNotification,

    // Session stats
    sessionStats,
    sessionMissedCount: questions.filter(q => sessionAnswersRef.current.get(q.id) !== 'correct').length,
    showSessionSummary,
    setShowSessionSummary,

    // Actions
    startPractice,
    startMixedPractice,
    handleFlip,
    handleNext,
    handlePrevious,
    handleBookmark,
    setEnlargedImage,
    speakText,
    stopSpeaking,
    reviewSessionMisses,
  };
}