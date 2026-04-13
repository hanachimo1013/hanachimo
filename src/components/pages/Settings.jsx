import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const cards = [
    { icon: 'bi-sliders', title: 'System Settings', desc: 'Configure system-wide preferences and configurations', btnText: 'Configure', color: 'var(--accent-blue)' },
    { icon: 'bi-person-gear', title: 'User Preferences', desc: 'Manage your profile and notification settings', btnText: 'Manage', color: 'var(--accent-green)' },
    { icon: 'bi-shield-lock', title: 'Security', desc: 'Update password and security settings', btnText: 'Update', color: 'var(--accent-red)' },
  ];

  return (
    <section className="glass-card p-5 md:p-8">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Settings</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ icon, title, desc, btnText, color }) => (
          <div key={title} className="glass-subtle rounded-2xl p-5 flex flex-col items-center text-center">
            <span className="mb-3 text-2xl" style={{ color }}><i className={`bi ${icon}`} aria-hidden="true" /></span>
            <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            <button className="btn-apple px-4 py-2 text-sm text-white rounded-xl" style={{ background: color }}>
              <i className={`bi ${icon} mr-2`} aria-hidden="true" />{btnText}
            </button>
          </div>
        ))}

        <div className="glass-subtle rounded-2xl p-5 flex flex-col items-center text-center">
          <span className="mb-3 text-2xl" style={{ color: 'var(--accent-purple)' }}><i className="bi bi-moon-stars" aria-hidden="true" /></span>
          <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Dark Mode</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Toggle the interface theme</p>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Dark mode toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 select-none"
          >
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Off</span>
            <span className="relative inline-flex h-7 w-12 items-center rounded-full shadow-inner transition-colors" style={{ background: theme === 'dark' ? 'var(--accent-green)' : 'rgba(0,0,0,0.15)' }}>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>On</span>
          </button>
        </div>
      </div>
    </section>
  );
}
