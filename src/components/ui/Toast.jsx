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

  const bgClass = type === 'success' ? 'bg-[#10b981]' : 'bg-red-500';
  const iconClass = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle';

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-6 py-3 rounded-xl text-white shadow-2xl transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      } ${bgClass}`}
    >
      <i className={`bi ${iconClass} text-xl`} />
      <span className="font-semibold">{message}</span>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 hover:opacity-70 transition-opacity"
      >
        <i className="bi bi-x" />
      </button>
    </div>
  );
}
