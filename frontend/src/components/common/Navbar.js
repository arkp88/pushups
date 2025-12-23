import { memo } from 'react';
import { supabase } from '../../lib/supabase';
// Add Dumbbell to this list:
import { Home, BookOpen, Upload, BarChart3, HelpCircle, Lock, LogOut, LogIn, Dumbbell } from 'lucide-react'; 
import DarkModeToggle from './DarkModeToggle';

const Navbar = memo(function Navbar({ view, setView, showNavbar, session, darkMode, setDarkMode }) {
  return (
    <>
      {/* Mobile-only top header */}
      <div className={`mobile-header ${showNavbar ? '' : 'hidden'}`}>
        <div className="mobile-header-brand">
          <Dumbbell size={24} color="#667eea" strokeWidth={2.5} style={{ marginRight: '4px' }} />
          <h1>Pushups</h1>
        </div>
        <div className="mobile-header-user">
          <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          {session ? (
            <>
              <span className="username">{session.user.email.split('@')[0]}</span>
              <button className="btn-logout-mobile" onClick={async () => {
                console.log('Logout clicked (mobile)');
                try {
                  const { error } = await supabase.auth.signOut();
                  if (error) console.error('Logout error:', error);
                  else console.log('Logout successful');
                } catch (err) {
                  console.error('Logout exception:', err);
                }
              }}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <button className="btn-signin-mobile" onClick={() => setView('auth')}>
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Desktop navbar */}
      <nav className={`navbar ${showNavbar ? '' : 'hidden'}`}>
        {/* Logo & Quote */}
        <div className="nav-brand">
          <div className="brand-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '4px'}}>
            <Dumbbell size={28} color="#667eea" strokeWidth={2.5} style={{ marginRight: '2px' }} />
            <h1>Pushups</h1>
          </div>
          <span className="brand-quote"> Pooja, what is this Tier-1 behavior? </span>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-links">
          <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>
            <Home size={18} />
            <span>Home</span>
          </button>
          <button onClick={() => setView('sets')} className={`nav-btn ${view === 'sets' ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span>Sets</span>
          </button>
          <button
            onClick={() => session ? setView('upload') : setView('auth')}
            className={`nav-btn ${view === 'upload' ? 'active' : ''} ${!session ? 'guest-disabled' : ''}`}
            title={!session ? 'Sign in to upload questions' : 'Upload questions'}
          >
            <Upload size={18} />
            <span>Upload</span>
            {!session && <Lock size={14} className="guest-lock-icon" />}
          </button>
          <button
            onClick={() => session ? setView('stats') : setView('auth')}
            className={`nav-btn ${view === 'stats' ? 'active' : ''} ${!session ? 'guest-disabled' : ''}`}
            title={!session ? 'Sign in to view your stats' : 'View your statistics'}
          >
            <BarChart3 size={18} />
            <span>Stats</span>
            {!session && <Lock size={14} className="guest-lock-icon" />}
          </button>
          <button onClick={() => setView('help')} className={`nav-btn ${view === 'help' ? 'active' : ''}`}>
            <HelpCircle size={18} />
            <span>Help</span>
          </button>
        </div>

        {/* User & Logout / Sign In */}
        <div className="nav-user">
          <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          {session ? (
            <>
              <span>{session.user.email.split('@')[0]}</span>
              <button className="btn-logout" onClick={async () => {
                console.log('Logout clicked (desktop)');
                try {
                  const { error } = await supabase.auth.signOut();
                  if (error) console.error('Logout error:', error);
                  else console.log('Logout successful');
                } catch (err) {
                  console.error('Logout exception:', err);
                }
              }}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <button className="btn-signin" onClick={() => setView('auth')}>
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </div>
      </nav>
    </>
  );
});

export default Navbar;
