import React from 'react';

/**
 * Apple-style confirmation modal for CRUD operations.
 * @param {{ title: string, message: string, confirmText?: string, cancelText?: string, confirmColor?: string, onConfirm: () => void, onCancel: () => void }} props
 */
export default function ConfirmModal({
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'var(--accent-red)',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 animate-fade-in" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative glass-card p-6 w-full max-w-sm animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${confirmColor} 12%, transparent)` }}>
            <i className="bi bi-exclamation-triangle text-xl" style={{ color: confirmColor }} aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          {message && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{message}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-apple flex-1 px-4 py-2.5 text-sm rounded-xl font-medium"
            style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="btn-apple flex-1 px-4 py-2.5 text-sm text-white rounded-xl font-semibold"
            style={{ background: confirmColor }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
