import React from 'react';

export default function Settings() {
  return (
    <section className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Settings</h2>
      <div className="space-y-6">
        <div className="border-b pb-6">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">⚙️</span>
            <div>
              <p className="font-semibold text-gray-800 text-lg">System Settings</p>
              <p className="text-gray-600 text-sm">Configure system-wide preferences and configurations</p>
            </div>
          </div>
          <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg font-medium transition-all">
            Configure
          </button>
        </div>
        <div className="border-b pb-6">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">👤</span>
            <div>
              <p className="font-semibold text-gray-800 text-lg">User Preferences</p>
              <p className="text-gray-600 text-sm">Manage your profile and notification settings</p>
            </div>
          </div>
          <button className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium transition-all">
            Manage
          </button>
        </div>
        <div className="pb-6">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">🔒</span>
            <div>
              <p className="font-semibold text-gray-800 text-lg">Security</p>
              <p className="text-gray-600 text-sm">Update password and security settings</p>
            </div>
          </div>
          <button className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg font-medium transition-all">
            Update Security
          </button>
        </div>
      </div>
    </section>
  );
}
