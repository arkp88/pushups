import React, { memo } from 'react';
import { supabase } from '../supabaseClient';

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
          <span className="username">{session.user.email.split('@')[0]}</span>
          <button className="btn-logout-mobile" onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
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
          <span className="brand-quote"> Tired of being productive? </span>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-links">
          <button data-icon="🏠" onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>
            Home
          </button>
          <button data-icon="📚" onClick={() => setView('sets')} className={`nav-btn ${view === 'sets' ? 'active' : ''}`}>
            Sets
          </button>
          <button data-icon="📥" onClick={() => setView('upload')} className={`nav-btn ${view === 'upload' ? 'active' : ''}`}>
            Upload
          </button>
          <button data-icon="📊" onClick={() => setView('stats')} className={`nav-btn ${view === 'stats' ? 'active' : ''}`}>
            Stats
          </button>
          <button data-icon="❓" onClick={() => setView('help')} className={`nav-btn ${view === 'help' ? 'active' : ''}`}>
            Help
          </button>
        </div>

        {/* User & Logout */}
        <div className="nav-user">
          <span>{session.user.email.split('@')[0]}</span>
          <button className="btn-logout" onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
});

export default Navbar;
