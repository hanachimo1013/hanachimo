import React from 'react';

export default function ConfirmLogoutModal({ open, onCancel, onConfirm, busy = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in px-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-md animate-fade-in"
        onClick={busy ? undefined : onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm glass-card p-6 animate-fade-scale"
      >
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Confirm Log Out
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          You are about to log out of the system. Do you want to continue?
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-apple px-4 py-2 text-sm font-medium rounded-xl disabled:opacity-50"
            style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn-apple px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-60"
            style={{ background: 'var(--accent-red)' }}
          >
            {busy ? 'Logging out…' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
