import React from 'react';

export default function ConfirmLogoutModal({ open, onCancel, onConfirm, busy = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={busy ? undefined : onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-amber-200/70 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900 animate-fade-scale"
      >
        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
          Confirm Logout
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          You are about to log out of the system. Do you want to continue?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? 'Logging out...' : 'Yes, Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
