import { Sun, Moon } from '@phosphor-icons/react';
import './DarkModeToggle.css';

function DarkModeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      className="dark-mode-toggle"
      onClick={() => setDarkMode(!darkMode)}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <Sun size={18} weight="bold" className="toggle-icon" />
      ) : (
        <Moon size={18} weight="bold" className="toggle-icon" />
      )}
    </button>
  );
}

export default DarkModeToggle;
