import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const email = `${username.toLowerCase().trim()}@quiz.local`;
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (isSignUp) alert('Account created! Sign in now.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      {error && <div className="error-message">{error}</div>}
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
      <div className="auth-toggle">
        <button onClick={() => setIsSignUp(!isSignUp)}>{isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}</button>
      </div>
    </div>
  );
}

export default Auth;
