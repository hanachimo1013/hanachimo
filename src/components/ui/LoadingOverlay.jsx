import React from 'react';
import AppleSpinner from './AppleSpinner';

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
        <AppleSpinner size="lg" />
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{message}</span>
      </div>
    </div>
  );
}
