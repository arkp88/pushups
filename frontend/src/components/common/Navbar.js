import { memo } from 'react';
import { supabase } from '../../lib/supabase';
import { House, BookOpen, Upload, ChartBar, Question, Lock, SignOut, SignIn, Barbell } from '@phosphor-icons/react';
import DarkModeToggle from './DarkModeToggle';

const Navbar = memo(function Navbar({ view, setView, showNavbar, session, darkMode, setDarkMode }) {
  return (
    <>
      {/* Mobile-only top header */}
      <div className={`mobile-header ${showNavbar ? '' : 'hidden'}`}>
        <div className="mobile-header-brand">
          <Barbell size={24} weight="bold" style={{ marginRight: '4px' }} />
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
                <SignOut size={16} weight="bold" />
                Logout
              </button>
            </>
          ) : (
            <button className="btn-signin-mobile" onClick={() => setView('auth')}>
              <SignIn size={16} weight="bold" />
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
            <Barbell size={28} weight="bold" style={{ marginRight: '2px' }} />
            <h1>Pushups</h1>
          </div>
          <span className="brand-quote"> Pooja, what is this Tier-1 behavior? </span>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-links">
          <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>
            <House size={18} weight="bold" />
            <span>Home</span>
          </button>
          <button onClick={() => setView('sets')} className={`nav-btn ${view === 'sets' ? 'active' : ''}`}>
            <BookOpen size={18} weight="bold" />
            <span>Sets</span>
          </button>
          <button
            onClick={() => session ? setView('upload') : setView('auth')}
            className={`nav-btn ${view === 'upload' ? 'active' : ''} ${!session ? 'guest-disabled' : ''}`}
            title={!session ? 'Sign in to upload questions' : 'Upload questions'}
          >
            <Upload size={18} weight="bold" />
            <span>Upload</span>
            {!session && <Lock size={14} weight="bold" className="guest-lock-icon" />}
          </button>
          <button
            onClick={() => session ? setView('stats') : setView('auth')}
            className={`nav-btn ${view === 'stats' ? 'active' : ''} ${!session ? 'guest-disabled' : ''}`}
            title={!session ? 'Sign in to view your stats' : 'View your statistics'}
          >
            <ChartBar size={18} weight="bold" />
            <span>Stats</span>
            {!session && <Lock size={14} weight="bold" className="guest-lock-icon" />}
          </button>
          <button onClick={() => setView('help')} className={`nav-btn ${view === 'help' ? 'active' : ''}`}>
            <Question size={18} weight="bold" />
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
                <SignOut size={16} weight="bold" />
                Logout
              </button>
            </>
          ) : (
            <button className="btn-signin" onClick={() => setView('auth')}>
              <SignIn size={16} weight="bold" />
              Sign In
            </button>
          )}
        </div>
      </nav>
    </>
  );
});

export default Navbar;
