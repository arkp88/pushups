import { renderHook, act } from '@testing-library/react';
import { usePractice } from '../usePractice';
import { api } from '../../lib';
import { STORAGE_KEYS, getQuizPositionKey } from '../../constants';
import { vi } from 'vitest';

// Mock the api module
vi.mock('../../lib', () => ({
  api: {
    getQuestions: vi.fn(),
    getMixedQuestions: vi.fn(),
    markSetOpened: vi.fn(),
    updateProgress: vi.fn(),
    markMissed: vi.fn(),
    unmarkMissed: vi.fn(),
    toggleBookmark: vi.fn(),
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
  }
});

describe('usePractice', () => {
  const mockSession = { user: { id: 'test-user-id' } };
  const mockNotification = vi.fn();

  const mockQuestions = [
    { id: 1, question_text: 'Question 1', answer_text: 'Answer 1', is_bookmarked: false },
    { id: 2, question_text: 'Question 2', answer_text: 'Answer 2', is_bookmarked: false },
    { id: 3, question_text: 'Question 3', answer_text: 'Answer 3', is_bookmarked: true },
  ];

  const mockSet = { id: 123, name: 'Test Set' };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('initial state', () => {
    it('should initialize with empty questions and default state', () => {
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      expect(result.current.questions).toEqual([]);
      expect(result.current.currentSet).toBeNull();
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.isFlipped).toBe(false);
      expect(result.current.practiceMode).toBe('single');
      expect(result.current.sessionStats).toEqual({ correct: 0, wrong: 0 });
      expect(result.current.showSessionSummary).toBe(false);
    });
  });

  describe('startPractice', () => {
    it('should load questions and set up practice session', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      let success;
      await act(async () => {
        success = await result.current.startPractice(mockSet);
      });

      expect(success).toBe(true);
      expect(result.current.questions).toEqual(mockQuestions);
      expect(result.current.currentSet).toEqual(mockSet);
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.isFlipped).toBe(false);
      expect(result.current.sessionStats).toEqual({ correct: 0, wrong: 0 });
    });

    it('should resume from saved position', async () => {
      // Set up localStorage mock to return '2' for position key
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === getQuizPositionKey(mockSet.id)) return '2';
        return null;
      });
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      expect(result.current.currentQuestionIndex).toBe(2);
    });

    it('should save last set ID to localStorage', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.LAST_SET_ID, mockSet.id);
    });

    it('should handle errors gracefully', async () => {
      api.getQuestions.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      let success;
      await act(async () => {
        success = await result.current.startPractice(mockSet);
      });

      expect(success).toBe(false);
      expect(mockNotification).toHaveBeenCalledWith('Error loading questions: Network error', true);
    });
  });

  describe('startMixedPractice', () => {
    it('should load mixed questions', async () => {
      api.getMixedQuestions.mockResolvedValue({ questions: mockQuestions });

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      let success;
      await act(async () => {
        success = await result.current.startMixedPractice('all');
      });

      expect(success).toBe(true);
      expect(result.current.questions).toEqual(mockQuestions);
      expect(result.current.practiceMode).toBe('mixed');
      expect(result.current.currentSet.name).toBe('Random Mode (all)');
    });

    it('should handle empty questions gracefully', async () => {
      api.getMixedQuestions.mockResolvedValue({ questions: [] });

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      let success;
      await act(async () => {
        success = await result.current.startMixedPractice('bookmarks');
      });

      expect(success).toBe(false);
    });
  });

  describe('handleFlip', () => {
    it('should toggle flipped state', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      expect(result.current.isFlipped).toBe(false);

      act(() => {
        result.current.handleFlip();
      });

      expect(result.current.isFlipped).toBe(true);

      act(() => {
        result.current.handleFlip();
      });

      expect(result.current.isFlipped).toBe(false);
    });
  });

  describe('handleNext', () => {
    beforeEach(async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});
      api.updateProgress.mockResolvedValue({});
      api.markMissed.mockResolvedValue({});
      api.unmarkMissed.mockResolvedValue({});
    });

    it('should advance to next question', async () => {
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      expect(result.current.currentQuestionIndex).toBe(0);

      await act(async () => {
        await result.current.handleNext(true);
      });

      expect(result.current.currentQuestionIndex).toBe(1);
    });

    it('should track correct answers in session stats', async () => {
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      await act(async () => {
        await result.current.handleNext(true); // Correct
      });

      expect(result.current.sessionStats.correct).toBe(1);
      expect(result.current.sessionStats.wrong).toBe(0);
    });

    it('should track wrong answers in session stats', async () => {
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      await act(async () => {
        await result.current.handleNext(false); // Wrong
      });

      expect(result.current.sessionStats.correct).toBe(0);
      expect(result.current.sessionStats.wrong).toBe(1);
    });

    it('should prevent double-counting when re-answering same question', async () => {
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      // Answer first question as correct
      await act(async () => {
        await result.current.handleNext(true);
      });

      expect(result.current.sessionStats.correct).toBe(1);

      // Go back to first question
      act(() => {
        result.current.handlePrevious();
      });

      // Answer it again as wrong - should update, not add
      await act(async () => {
        await result.current.handleNext(false);
      });

      expect(result.current.sessionStats.correct).toBe(0);
      expect(result.current.sessionStats.wrong).toBe(1);
    });

    it('should show session summary when reaching end', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      // Answer all questions
      await act(async () => {
        await result.current.handleNext(true);
      });
      await act(async () => {
        await result.current.handleNext(true);
      });
      await act(async () => {
        await result.current.handleNext(true, onComplete);
      });

      expect(result.current.showSessionSummary).toBe(true);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should save position to localStorage', async () => {
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      await act(async () => {
        await result.current.handleNext(true);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        getQuizPositionKey(mockSet.id),
        1
      );
    });

    it('should call API to update progress when authenticated', async () => {
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      await act(async () => {
        await result.current.handleNext(true);
      });

      expect(api.updateProgress).toHaveBeenCalledWith(1, true, true);
    });

    it('should not call API when guest (no session)', async () => {
      const { result } = renderHook(() => usePractice(null, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      await act(async () => {
        await result.current.handleNext(true);
      });

      expect(api.updateProgress).not.toHaveBeenCalled();
    });
  });

  describe('handlePrevious', () => {
    it('should go to previous question', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});
      api.updateProgress.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      await act(async () => {
        await result.current.handleNext(true);
      });

      expect(result.current.currentQuestionIndex).toBe(1);

      act(() => {
        result.current.handlePrevious();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should not go below 0', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      expect(result.current.currentQuestionIndex).toBe(0);

      act(() => {
        result.current.handlePrevious();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });
  });

  describe('handleBookmark', () => {
    it('should toggle bookmark state optimistically', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});
      api.toggleBookmark.mockResolvedValue({});

      const mockEvent = { stopPropagation: vi.fn() };
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      expect(result.current.questions[0].is_bookmarked).toBe(false);

      await act(async () => {
        await result.current.handleBookmark(mockEvent);
      });

      expect(result.current.questions[0].is_bookmarked).toBe(true);
      expect(api.toggleBookmark).toHaveBeenCalledWith(1);
    });

    it('should show notification for guests', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });

      const mockEvent = { stopPropagation: vi.fn() };
      const { result } = renderHook(() => usePractice(null, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      await act(async () => {
        await result.current.handleBookmark(mockEvent);
      });

      expect(mockNotification).toHaveBeenCalledWith('Sign in to bookmark questions', true);
      expect(api.toggleBookmark).not.toHaveBeenCalled();
    });

    it('should rollback on API failure', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});
      api.toggleBookmark.mockRejectedValue(new Error('API error'));

      const mockEvent = { stopPropagation: vi.fn() };
      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      const originalState = result.current.questions[0].is_bookmarked;

      await act(async () => {
        await result.current.handleBookmark(mockEvent);
      });

      // Should rollback to original state
      expect(result.current.questions[0].is_bookmarked).toBe(originalState);
    });
  });

  describe('reviewSessionMisses', () => {
    it('should filter to questions not answered correctly', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});
      api.updateProgress.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      // Answer first correct, second wrong
      await act(async () => {
        await result.current.handleNext(true); // Q1 correct
      });
      await act(async () => {
        await result.current.handleNext(false); // Q2 wrong
      });

      // Show summary, then review misses
      act(() => {
        result.current.reviewSessionMisses();
      });

      // Should only have Q2 and Q3 (wrong and not seen)
      expect(result.current.questions.length).toBe(2);
      expect(result.current.questions.map(q => q.id)).toEqual([2, 3]);
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.sessionStats).toEqual({ correct: 0, wrong: 0 });
    });

    it('should show notification if all answers were correct', async () => {
      api.getQuestions.mockResolvedValue({ questions: [mockQuestions[0]], instructions: [] });
      api.markSetOpened.mockResolvedValue({});
      api.updateProgress.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      await act(async () => {
        await result.current.handleNext(true);
      });

      act(() => {
        result.current.reviewSessionMisses();
      });

      // Should show success notification via setPracticeNotification
      expect(result.current.practiceNotification).toContain('No misses');
    });
  });

  describe('sessionMissedCount', () => {
    it('should count questions not answered correctly', async () => {
      api.getQuestions.mockResolvedValue({ questions: mockQuestions, instructions: [] });
      api.markSetOpened.mockResolvedValue({});
      api.updateProgress.mockResolvedValue({});

      const { result } = renderHook(() => usePractice(mockSession, mockNotification));

      await act(async () => {
        await result.current.startPractice(mockSet);
      });

      // Initially all 3 are "missed" (not answered correctly)
      expect(result.current.sessionMissedCount).toBe(3);

      // Answer first correct
      await act(async () => {
        await result.current.handleNext(true);
      });

      expect(result.current.sessionMissedCount).toBe(2);

      // Answer second wrong
      await act(async () => {
        await result.current.handleNext(false);
      });

      expect(result.current.sessionMissedCount).toBe(2);

      // Answer third correct
      await act(async () => {
        await result.current.handleNext(true);
      });

      expect(result.current.sessionMissedCount).toBe(1);
    });
  });
});
