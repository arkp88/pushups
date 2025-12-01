import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(''); // REINTRODUCED local error state

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); // Clear local error state
    setLoading(true);
    const email = `${username.toLowerCase().trim()}@quiz.local`;
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      if (isSignUp) {
        // Use local state for message
        setError('Account created! Sign in now.'); 
      }
    } catch (error) {
      // Set error locally to display on Auth screen
      setError(error.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      {error && <div className="error-message">{error}</div>} {/* REINTRODUCED local error display */}
      <form onSubmit={handleAuth}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}</button>
      </form>
      
      {isSignUp && (
        <p style={{fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '15px 0', lineHeight: '1.4'}}>
          💡 No email required. Please save your password – we can't recover accounts.
        </p>
      )}

      <div className="auth-toggle">
        <button onClick={() => setIsSignUp(!isSignUp)}>{isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}</button>
      </div>
    </div>
  );
}

export default Auth;