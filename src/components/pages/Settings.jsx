import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="bg-white p-6 md:p-8 rounded-lg shadow-md dark:bg-gray-900 dark:text-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 dark:text-gray-100">Settings</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm md:text-left dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-2xl text-gray-700 dark:text-gray-200">
                <i className="bi bi-sliders" aria-hidden="true" />
              </span>
              <p className="font-semibold text-gray-800 text-lg dark:text-gray-100">System Settings</p>
              <p className="text-gray-600 text-sm text-center dark:text-gray-300">Configure system-wide preferences and configurations</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg font-medium transition-all">
              <i className="bi bi-sliders mr-2" aria-hidden="true" />
              Configure
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm md:text-left dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-2xl text-gray-700 dark:text-gray-200">
                <i className="bi bi-person-gear" aria-hidden="true" />
              </span>
              <p className="font-semibold text-gray-800 text-lg dark:text-gray-100">User Preferences</p>
              <p className="text-gray-600 text-sm text-center dark:text-gray-300">Manage your profile and notification settings</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium transition-all">
              <i className="bi bi-person-gear mr-2" aria-hidden="true" />
              Manage
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm md:text-left dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-2xl text-gray-700 dark:text-gray-200">
                <i className="bi bi-shield-lock" aria-hidden="true" />
              </span>
              <p className="font-semibold text-gray-800 text-lg dark:text-gray-100">Security</p>
              <p className="text-gray-600 text-sm text-center dark:text-gray-300">Update password and security settings</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg font-medium transition-all">
              <i className="bi bi-shield-lock mr-2" aria-hidden="true" />
              Update Security
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm md:text-left dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-2xl text-gray-700 dark:text-gray-200">
                <i className="bi bi-moon-stars" aria-hidden="true" />
              </span>
              <p className="font-semibold text-gray-800 text-lg dark:text-gray-100">Dark Mode</p>
              <p className="text-gray-600 text-sm text-center dark:text-gray-300">Toggle the interface theme</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Dark mode toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onTouchEnd={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 select-none"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Off</span>
              <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 shadow-inner transition-colors dark:bg-gray-600">
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">On</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
