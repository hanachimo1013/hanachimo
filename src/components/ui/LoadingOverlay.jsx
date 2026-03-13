import React from 'react';

const DOTS = [
  { className: 'bg-blue-500', delay: '0ms' },
  { className: 'bg-red-500', delay: '120ms' },
  { className: 'bg-yellow-500', delay: '240ms' },
  { className: 'bg-green-500', delay: '360ms' }
];

export default function LoadingOverlay({ message = 'Loading...', className = '' }) {
  return (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-gray-900/70 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {DOTS.map((dot, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-full ${dot.className} animate-bounce`}
              style={{ animationDelay: dot.delay }}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{message}</span>
      </div>
    </div>
  );
}
