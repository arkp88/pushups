import { memo } from 'react';
import { supabase } from '../../lib/supabase';
import { Home, BookOpen, Upload, BarChart3, HelpCircle, Lock, LogOut, LogIn } from 'lucide-react';

const Navbar = memo(function Navbar({ view, setView, showNavbar, session }) {
  return (
    <>
      {/* Mobile-only top header */}
      <div className={`mobile-header ${showNavbar ? '' : 'hidden'}`}>
        <div className="mobile-header-brand">
          <span className="brand-icon">💪</span>
          <h1>Pushups</h1>
        </div>
        <div className="mobile-header-user">
          {session ? (
            <>
              <span className="username">{session.user.email.split('@')[0]}</span>
              <button className="btn-logout-mobile" onClick={() => supabase.auth.signOut()}>
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
          <div className="brand-row">
            <span className="brand-icon">💪</span>
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
          {session ? (
            <>
              <span>{session.user.email.split('@')[0]}</span>
              <button className="btn-logout" onClick={() => supabase.auth.signOut()}>
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
