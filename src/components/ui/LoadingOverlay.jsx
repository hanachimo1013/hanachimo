import React from 'react';

const DOTS = [
  { color: 'var(--accent-blue)', delay: '0ms' },
  { color: 'var(--accent-red)', delay: '120ms' },
  { color: 'var(--accent-orange)', delay: '240ms' },
  { color: 'var(--accent-green)', delay: '360ms' }
];

export default function LoadingOverlay({ message = 'Loading...', className = '' }) {
  return (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center ${className}`}
      style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {DOTS.map((dot, index) => (
            <span
              key={index}
              className="h-2.5 w-2.5 rounded-full animate-bounce"
              style={{ background: dot.color, animationDelay: dot.delay }}
            />
          ))}
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{message}</span>
      </div>
    </div>
  );
}
