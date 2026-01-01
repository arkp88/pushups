import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants';

const ThemeContext = createContext(null);

/**
 * Hook to access theme context
 * @returns {{ darkMode: boolean, setDarkMode: Function, toggleDarkMode: Function }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Provider component that manages dark mode state
 */
export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return saved ? JSON.parse(saved) : false;
  });

  // Apply dark mode to body and persist to localStorage
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const value = {
    darkMode,
    setDarkMode,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
