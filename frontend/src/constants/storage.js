/**
 * LocalStorage key constants
 * Centralizes all localStorage keys to prevent typos and make refactoring easier
 */
export const STORAGE_KEYS = {
  /** Dark mode preference (boolean) */
  DARK_MODE: 'darkMode',

  /** Last practiced question set ID */
  LAST_SET_ID: 'pushups-last-set-id',

  /** Quiz position prefix - used as `${QUIZ_POSITION}-${setId}` */
  QUIZ_POSITION: 'pushups-quiz-position',

  /** Whether user has seen the swipe tutorial */
  SEEN_SWIPE_TUTORIAL: 'hasSeenSwipeTutorial',
};

/**
 * Helper to get quiz position key for a specific set
 * @param {string|number} setId - The question set ID
 * @returns {string} The localStorage key for this set's position
 */
export const getQuizPositionKey = (setId) => `${STORAGE_KEYS.QUIZ_POSITION}-${setId}`;
