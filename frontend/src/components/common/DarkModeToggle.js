import { Sun, Moon } from 'lucide-react';
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
        <Sun size={18} className="toggle-icon" />
      ) : (
        <Moon size={18} className="toggle-icon" />
      )}
    </button>
  );
}

export default DarkModeToggle;
