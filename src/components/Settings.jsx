import React from 'react';

export default function Settings() {
  return (
    <section className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Settings</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm md:text-left">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-2xl text-gray-700">
                <i className="bi bi-sliders" aria-hidden="true" />
              </span>
              <p className="font-semibold text-gray-800 text-lg">System Settings</p>
              <p className="text-gray-600 text-sm text-center">Configure system-wide preferences and configurations</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg font-medium transition-all">
              <i className="bi bi-sliders mr-2" aria-hidden="true" />
              Configure
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm md:text-left">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-2xl text-gray-700">
                <i className="bi bi-person-gear" aria-hidden="true" />
              </span>
              <p className="font-semibold text-gray-800 text-lg">User Preferences</p>
              <p className="text-gray-600 text-sm text-center">Manage your profile and notification settings</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium transition-all">
              <i className="bi bi-person-gear mr-2" aria-hidden="true" />
              Manage
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm md:text-left">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-2xl text-gray-700">
                <i className="bi bi-shield-lock" aria-hidden="true" />
              </span>
              <p className="font-semibold text-gray-800 text-lg">Security</p>
              <p className="text-gray-600 text-sm text-center">Update password and security settings</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg font-medium transition-all">
              <i className="bi bi-shield-lock mr-2" aria-hidden="true" />
              Update Security
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
