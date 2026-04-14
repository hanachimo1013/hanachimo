import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppleSpinner from '../ui/AppleSpinner';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fromPath = location.state?.from?.pathname || '/dashboard';
  const showAccessWarning = Boolean(location.state?.from) && !location.state?.loggedOut;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(userid, password);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--surface-primary)' }}>
      {/* Subtle gradient orbs for visual depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--accent-blue)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: 'var(--accent-purple)' }} />
      </div>

      <main className="relative w-full max-w-md">
        <section className="glass-card p-8 animate-fade-scale">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Sign In</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Continue to BDLAG Utility</p>

          {showAccessWarning && (
            <div className="mt-5 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(255, 149, 0, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
              You attempted to access a protected page. Please log in or contact the IT admin (hanachimo1013) for access.
            </div>
          )}

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="userid" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>User ID</label>
              <input
                id="userid"
                name="userid"
                type="text"
                autoComplete="username"
                placeholder="Enter your user ID"
                value={userid}
                onChange={(event) => setUserid(event.target.value)}
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
              />
            </div>

            {error && (
              <p className="rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: 'rgba(255, 59, 48, 0.08)', color: 'var(--accent-red)', border: '1px solid rgba(255, 59, 48, 0.15)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-apple mt-2 w-full py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: 'var(--accent-blue)' }}
            >
              {submitting ? (
                <AppleSpinner size="sm" white />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
