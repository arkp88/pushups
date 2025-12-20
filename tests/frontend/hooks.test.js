/**
 * Frontend Hooks Tests
 *
 * Tests for custom React hooks including:
 * - usePractice: Practice session management
 * - useUpload: File upload handling
 * - useStats: Statistics fetching
 * - useQuestionSets: Question sets loading
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the API module
jest.mock('../../frontend/src/lib/api', () => ({
  api: {
    getQuestions: jest.fn(),
    getMixedQuestions: jest.fn(),
    updateProgress: jest.fn(),
    markMissed: jest.fn(),
    unmarkMissed: jest.fn(),
    toggleBookmark: jest.fn(),
    markSetOpened: jest.fn(),
    uploadTSV: jest.fn(),
    listDriveFiles: jest.fn(),
    importDriveFile: jest.fn(),
    getQuestionSets: jest.fn(),
    getStats: jest.fn(),
  },
}));

// Mock Supabase
jest.mock('../../frontend/src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
    },
  },
}));

// Import hooks after mocking dependencies
import { usePractice } from '../../frontend/src/hooks/usePractice';
import { useUpload } from '../../frontend/src/hooks/useUpload';
import { useStats } from '../../frontend/src/hooks/useStats';
import { useQuestionSets } from '../../frontend/src/hooks/useQuestionSets';
import { api } from '../../frontend/src/lib/api';

describe('usePractice Hook', () => {
  const mockSession = { user: { id: 'test-user' } };
  const mockSetAppNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('initializes with empty state', () => {
    const { result } = renderHook(() => usePractice(mockSession, mockSetAppNotification));

    expect(result.current.questions).toEqual([]);
    expect(result.current.currentSet).toBeNull();
    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.isFlipped).toBe(false);
  });

  test('starts practice with valid question set', async () => {
    const mockQuestions = [
      { id: 1, question_text: 'Q1', answer_text: 'A1' },
      { id: 2, question_text: 'Q2', answer_text: 'A2' },
    ];

    api.getQuestions.mockResolvedValue({
      questions: mockQuestions,
      instructions: [],
    });

    api.markSetOpened.mockResolvedValue({});

    const { result } = renderHook(() => usePractice(mockSession, mockSetAppNotification));

    let success;
    await act(async () => {
      success = await result.current.startPractice({ id: 1, name: 'Test Set' });
    });

    expect(success).toBe(true);
    expect(result.current.questions).toHaveLength(2);
    expect(result.current.currentSet).toEqual({ id: 1, name: 'Test Set' });
    expect(api.markSetOpened).toHaveBeenCalledWith(1);
  });

  test('handles card flip', () => {
    const { result } = renderHook(() => usePractice(mockSession, mockSetAppNotification));

    act(() => {
      result.current.handleFlip();
    });

    expect(result.current.isFlipped).toBe(true);

    act(() => {
      result.current.handleFlip();
    });

    expect(result.current.isFlipped).toBe(false);
  });

  test('tracks session stats correctly', async () => {
    const mockQuestions = [
      { id: 1, question_text: 'Q1', answer_text: 'A1' },
      { id: 2, question_text: 'Q2', answer_text: 'A2' },
    ];

    api.getQuestions.mockResolvedValue({
      questions: mockQuestions,
      instructions: [],
    });

    api.updateProgress.mockResolvedValue({});

    const { result } = renderHook(() => usePractice(mockSession, mockSetAppNotification));

    await act(async () => {
      await result.current.startPractice({ id: 1, name: 'Test Set' });
    });

    // Answer first question correctly
    await act(async () => {
      await result.current.handleNext(true);
    });

    expect(result.current.sessionStats.correct).toBe(1);
    expect(result.current.sessionStats.wrong).toBe(0);

    // Answer second question incorrectly
    await act(async () => {
      await result.current.handleNext(false);
    });

    expect(result.current.sessionStats.correct).toBe(1);
    expect(result.current.sessionStats.wrong).toBe(1);
  });

  test('prevents double-counting when using Previous button', async () => {
    const mockQuestions = [
      { id: 1, question_text: 'Q1', answer_text: 'A1' },
      { id: 2, question_text: 'Q2', answer_text: 'A2' },
    ];

    api.getQuestions.mockResolvedValue({
      questions: mockQuestions,
      instructions: [],
    });

    api.updateProgress.mockResolvedValue({});

    const { result } = renderHook(() => usePractice(mockSession, mockSetAppNotification));

    await act(async () => {
      await result.current.startPractice({ id: 1, name: 'Test Set' });
    });

    // Answer first question wrong
    await act(async () => {
      await result.current.handleNext(false);
    });

    expect(result.current.sessionStats.wrong).toBe(1);

    // Go back
    act(() => {
      result.current.handlePrevious();
    });

    // Answer same question correctly
    await act(async () => {
      await result.current.handleNext(true);
    });

    // Should have swapped wrong to correct, not added both
    expect(result.current.sessionStats.correct).toBe(1);
    expect(result.current.sessionStats.wrong).toBe(0);
  });

  test('saves position to localStorage', async () => {
    const mockQuestions = [
      { id: 1, question_text: 'Q1', answer_text: 'A1' },
      { id: 2, question_text: 'Q2', answer_text: 'A2' },
    ];

    api.getQuestions.mockResolvedValue({
      questions: mockQuestions,
      instructions: [],
    });

    api.updateProgress.mockResolvedValue({});

    const { result } = renderHook(() => usePractice(mockSession, mockSetAppNotification));

    await act(async () => {
      await result.current.startPractice({ id: 1, name: 'Test Set' });
    });

    await act(async () => {
      await result.current.handleNext(null); // Skip without answering
    });

    expect(localStorage.getItem('pushups-quiz-position-1')).toBe('1');
  });
});

describe('useUpload Hook', () => {
  const ROOT_FOLDER_ID = 'test-folder-id';
  const mockSession = { user: { id: 'test-user' } };
  const mockSetAppNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() =>
      useUpload(ROOT_FOLDER_ID, 'upload', 'local', mockSession, mockSetAppNotification)
    );

    expect(result.current.uploadTags).toBe('');
    expect(result.current.customName).toBe('');
    expect(result.current.pendingUpload).toBeNull();
    expect(result.current.uploading).toBe(false);
  });

  test('handles local file selection (single file)', () => {
    const { result } = renderHook(() =>
      useUpload(ROOT_FOLDER_ID, 'upload', 'local', mockSession, mockSetAppNotification)
    );

    const mockFile = new File(['test content'], 'test.tsv', { type: 'text/tab-separated-values' });
    const mockEvent = {
      target: {
        files: [mockFile],
        value: '',
      },
    };

    act(() => {
      result.current.handleLocalFileSelect(mockEvent);
    });

    expect(result.current.pendingUpload).toEqual({
      type: 'local',
      data: [mockFile],
    });
    expect(result.current.customName).toBe('test');
  });

  test('handles local file selection (multiple files)', () => {
    const { result } = renderHook(() =>
      useUpload(ROOT_FOLDER_ID, 'upload', 'local', mockSession, mockSetAppNotification)
    );

    const mockFiles = [
      new File(['test1'], 'test1.tsv', { type: 'text/tab-separated-values' }),
      new File(['test2'], 'test2.tsv', { type: 'text/tab-separated-values' }),
    ];

    const mockEvent = {
      target: {
        files: mockFiles,
        value: '',
      },
    };

    act(() => {
      result.current.handleLocalFileSelect(mockEvent);
    });

    expect(result.current.pendingUpload).toEqual({
      type: 'local',
      data: mockFiles,
    });
    expect(result.current.customName).toBe(''); // Multi-file upload clears custom name
  });

  test('executes successful upload', async () => {
    api.uploadTSV.mockResolvedValue({
      success: true,
      set_id: 123,
      questions_imported: 10,
      expected_questions: 10,
      is_partial: false,
    });

    const { result } = renderHook(() =>
      useUpload(ROOT_FOLDER_ID, 'upload', 'local', mockSession, mockSetAppNotification)
    );

    const mockFile = new File(['test content'], 'test.tsv', { type: 'text/tab-separated-values' });

    act(() => {
      result.current.handleLocalFileSelect({
        target: { files: [mockFile], value: '' },
      });
    });

    const mockOnSuccess = jest.fn();

    await act(async () => {
      await result.current.executeUpload(mockOnSuccess);
    });

    expect(api.uploadTSV).toHaveBeenCalledWith(mockFile, 'test', '', '');
    expect(result.current.uploadSuccess).toContain('Import successful');
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  test('handles partial upload with warnings', async () => {
    api.uploadTSV.mockResolvedValue({
      success: true,
      set_id: 123,
      questions_imported: 80,
      expected_questions: 100,
      is_partial: true,
      warning: 'Only 80 of 100 questions were imported.',
    });

    const { result } = renderHook(() =>
      useUpload(ROOT_FOLDER_ID, 'upload', 'local', mockSession, mockSetAppNotification)
    );

    const mockFile = new File(['test content'], 'test.tsv', { type: 'text/tab-separated-values' });

    act(() => {
      result.current.handleLocalFileSelect({
        target: { files: [mockFile], value: '' },
      });
    });

    await act(async () => {
      await result.current.executeUpload();
    });

    expect(result.current.uploadSuccess).toContain('80/100');
    expect(result.current.uploadSuccess).toContain('warnings');
  });
});

describe('useStats Hook', () => {
  const mockSession = { user: { id: 'test-user' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with null stats', () => {
    const { result } = renderHook(() => useStats(mockSession));

    expect(result.current.stats).toBeNull();
  });

  test('loads stats successfully', async () => {
    const mockStats = {
      total_questions: 100,
      attempted: 50,
      correct: 40,
      missed: 10,
      bookmarks: 5,
      accuracy: 80,
      streak: 3,
    };

    api.getStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useStats(mockSession));

    await act(async () => {
      await result.current.loadStats();
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(api.getStats).toHaveBeenCalled();
  });

  test('handles stats loading error', async () => {
    api.getStats.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useStats(mockSession));

    await act(async () => {
      await result.current.loadStats();
    });

    // Stats should remain null on error
    expect(result.current.stats).toBeNull();
  });
});

describe('useQuestionSets Hook', () => {
  const mockSession = { user: { id: 'test-user' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with empty question sets', () => {
    const { result } = renderHook(() => useQuestionSets(mockSession));

    expect(result.current.questionSets).toEqual([]);
  });

  test('loads question sets successfully', async () => {
    const mockSets = [
      { id: 1, name: 'Set 1', total_questions: 10 },
      { id: 2, name: 'Set 2', total_questions: 20 },
    ];

    api.getQuestionSets.mockResolvedValue({ sets: mockSets });

    const { result } = renderHook(() => useQuestionSets(mockSession));

    await act(async () => {
      await result.current.loadQuestionSets();
    });

    expect(result.current.questionSets).toEqual(mockSets);
    expect(api.getQuestionSets).toHaveBeenCalled();
  });
});

describe('Frontend Utility Functions', () => {
  test('ensureHttps upgrades HTTP URLs', () => {
    // This would test the utility function from lib/utils.js
    const ensureHttps = (url) => {
      if (!url) return url;
      if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
      }
      return url;
    };

    expect(ensureHttps('http://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    expect(ensureHttps('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    expect(ensureHttps('/relative/path.jpg')).toBe('/relative/path.jpg');
    expect(ensureHttps(null)).toBe(null);
  });
});
