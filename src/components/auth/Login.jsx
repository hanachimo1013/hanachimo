import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-100 to-rose-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <section className="w-full rounded-2xl border border-amber-200/70 bg-white/90 p-8 shadow-2xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-gray-100">
            Login
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Sign in to continue.
          </p>

          {showAccessWarning && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-600/50 dark:bg-amber-900/30 dark:text-amber-100">
              You attempted to access a protected page. Please log in or contact the IT admin (hanachimo1013) for access.
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="userid"
                className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
              >
                User ID
              </label>
              <input
                id="userid"
                name="userid"
                type="text"
                autoComplete="username"
                placeholder="Enter your user ID"
                value={userid}
                onChange={(event) => setUserid(event.target.value)}
                required
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {error && (
              <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {submitting ? (
                <div className="google-dots google-dots--button" aria-label="Signing in">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
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
