import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="min-h-screen w-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--accent-blue)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--accent-purple)' }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-medium tracking-wider uppercase" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--accent-red)' }} />
          Page Not Found
        </div>

        <h1 className="text-8xl font-black tracking-tight md:text-[10rem]" style={{ color: 'var(--text-primary)', opacity: 0.15 }}>404</h1>
        <p className="mt-2 max-w-xl text-base" style={{ color: 'var(--text-secondary)' }}>
          The page you are looking for drifted out of the map. Try heading back to the dashboard
          or the employee list.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="btn-apple rounded-full px-6 py-3 text-sm font-semibold text-white"
            style={{ background: 'var(--accent-blue)' }}
          >
            <i className="bi bi-speedometer2 mr-2" aria-hidden="true" />
            Go to Dashboard
          </Link>
          <Link
            to="/employees"
            className="btn-apple rounded-full px-6 py-3 text-sm font-medium"
            style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
          >
            <i className="bi bi-people-fill mr-2" aria-hidden="true" />
            View Employees
          </Link>
        </div>

        <div className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {[
            { title: 'Try Search', body: 'Check the URL or use the app navigation to find your page.' },
            { title: 'Recent Updates', body: 'Pages may have moved after the latest release.' },
            { title: 'Need Help?', body: 'If this keeps happening, contact your administrator.' }
          ].map((item) => (
            <div
              key={item.title}
              className="glass-card p-4"
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
              <p className="mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
