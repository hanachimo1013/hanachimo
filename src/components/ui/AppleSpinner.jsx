import React from 'react';

/**
 * Apple-style radial activity indicator.
 * Mimics the native iOS / macOS spinner with 8 fading bars.
 *
 * @param {'sm'|'md'|'lg'} [size='md']  – maps to CSS modifier classes
 * @param {boolean} [white=false]       – light variant for dark backgrounds
 * @param {string}  [className='']      – extra CSS classes
 */
export default function AppleSpinner({ size = 'md', white = false, className = '' }) {
  const sizeClass = size === 'sm' ? 'apple-spinner--sm' : size === 'lg' ? 'apple-spinner--lg' : '';
  const colorClass = white ? 'apple-spinner--white' : '';

  return (
    <div
      className={`apple-spinner ${sizeClass} ${colorClass} ${className}`.trim()}
      role="status"
      aria-label="Loading"
    >
      <span /><span /><span /><span />
      <span /><span /><span /><span />
    </div>
  );
}
