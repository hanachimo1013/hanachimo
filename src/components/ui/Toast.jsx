import React, { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to finish
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)';
  const iconClass = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl transition-all duration-300 transform backdrop-blur-lg ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
      style={{ background: bgColor }}
    >
      <i className={`bi ${iconClass} text-lg`} aria-hidden="true" />
      <span className="font-medium text-sm">{message}</span>
      <button 
        aria-label="Close notification"
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-1 hover:opacity-70 transition-opacity"
      >
        <i className="bi bi-x text-lg" aria-hidden="true" />
      </button>
    </div>
  );
}
