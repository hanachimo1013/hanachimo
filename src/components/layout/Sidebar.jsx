import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import adminAvatar from '../../assets/admin-avatar.png';

export const SidebarBtn = ({ to, text, icon, onClick, disabled, title }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  if (disabled) {
    return (
      <button
        className="w-full py-2 px-4 rounded-lg shadow-md transition-all mb-3 font-semibold text-base bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300"
        title={title}
        disabled
      >
        {icon && <span className="mr-2 inline-flex text-sm">{icon}</span>}
        {text}
      </button>
    );
  }

  return (
    <Link to={to} onClick={onClick}>
      <button
        className={`w-full py-2 px-4 rounded-lg shadow-md transition-all mb-3 font-semibold text-base ${
          isActive
            ? 'bg-[#b45309] text-white shadow-lg'
            : 'bg-[#d97706] hover:bg-[#b45309] text-white hover:shadow-lg'
        }`}
      >
        {icon && <span className="mr-2 inline-flex text-sm">{icon}</span>}
        {text}
      </button>
    </Link>
  );
};

export const SidebarIconBtn = ({ to, icon, onClick, title }) => (
  <Link to={to} onClick={onClick} title={title}>
    <button className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-[#d97706] hover:bg-[#b45309] text-white shadow-md transition-all">
      {icon}
    </button>
  </Link>
);

export const SidebarContent = ({ displayName, displayRole, isEmployee, isViewer, onClose, onLogout }) => (
  <>
    <div className="w-24 h-24 rounded-full mb-4 shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-white/30">
      <img
        src={adminAvatar}
        alt="Admin avatar"
        className="w-full h-full object-cover"
      />
    </div>
    <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">{displayName}</h2>
    <p className="text-xs text-gray-600 mb-8 dark:text-gray-300">{displayRole}</p>

    <div className="w-full flex-1">
      <SidebarBtn to="/dashboard" text="Dashboard" icon={<i className="bi bi-speedometer2" />} onClick={onClose} />
      <SidebarBtn to="/employees" text="Employees" icon={<i className="bi bi-people-fill" />} onClick={onClose} />
      {!isEmployee && (
        <SidebarBtn
          to="/settings"
          text="Settings"
          icon={<i className="bi bi-gear-fill" />}
          onClick={onClose}
          disabled={isViewer}
          title={isViewer ? 'You are in viewing mode' : undefined}
        />
      )}
      {!isEmployee && (
        <SidebarBtn
          to="/reports"
          text="Reports"
          icon={<i className="bi bi-bar-chart-fill" />}
          onClick={onClose}
        />
      )}
      <button
        onClick={onLogout}
        className="w-full py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg shadow-md mt-auto flex-shrink-0 font-semibold transition-all hover:shadow-lg"
      >
        <i className="bi bi-box-arrow-right mr-2" aria-hidden="true" />
        Logout
      </button>
    </div>

    <div className="mt-6 w-full rounded-lg border border-[#bc7676]/40 bg-white/70 p-3 text-center text-[10px] leading-relaxed text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
      Built by hanachimo using React, Vite, Tailwind CSS, and Supabase.
      c.2026
    </div>
  </>
);

export const SidebarCollapsed = ({ isEmployee, isViewer, onClose, onLogout }) => (
  <>
    <SidebarIconBtn to="/dashboard" icon={<i className="bi bi-speedometer2" />} onClick={onClose} title="Dashboard" />
    <SidebarIconBtn to="/employees" icon={<i className="bi bi-people-fill" />} onClick={onClose} title="Employees" />
    {!isEmployee && (
      <SidebarIconBtn
        to="/settings"
        icon={<i className="bi bi-gear-fill" />}
        onClick={onClose}
        title={isViewer ? 'You are in viewing mode' : 'Settings'}
      />
    )}
    {!isEmployee && (
      <SidebarIconBtn
        to="/reports"
        icon={<i className="bi bi-bar-chart-fill" />}
        onClick={onClose}
        title="Reports"
      />
    )}
    <button
      onClick={onLogout}
      title="Logout"
      className="w-12 h-12 rounded-xl mt-auto flex items-center justify-center bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-md transition-all"
    >
      <i className="bi bi-box-arrow-right" aria-hidden="true" />
    </button>
  </>
);
