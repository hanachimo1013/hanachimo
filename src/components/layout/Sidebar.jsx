import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import adminAvatar from '../../assets/admin-avatar.png';

export const SidebarBtn = ({ to, text, icon, onClick, disabled, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === to;

  if (disabled) {
    return (
      <button
        className="w-full py-2.5 px-4 rounded-xl transition-all mb-2 font-medium text-sm cursor-not-allowed opacity-40"
        style={{ color: 'var(--text-tertiary)' }}
        title={title}
        disabled
      >
        {icon && <span className="mr-2 inline-flex text-sm">{icon}</span>}
        {text}
      </button>
    );
  }

  const handleNavigate = () => {
    if (disabled) return;
    if (onClick) onClick();
    navigate(to);
  };

  return (
    <button
      type="button"
      onClick={handleNavigate}
      className={`w-full py-2.5 px-4 rounded-xl transition-all mb-2 font-medium text-sm text-left ${
        isActive
          ? 'text-white shadow-md'
          : 'hover:bg-black/5 dark:hover:bg-white/8'
      }`}
      style={isActive ? { background: 'var(--accent-blue)', color: '#fff' } : { color: 'var(--text-primary)' }}
    >
      {icon && <span className="mr-2 inline-flex text-sm">{icon}</span>}
      {text}
    </button>
  );
};

export const SidebarIconBtn = ({ to, icon, onClick, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === to;

  const handleNavigate = () => {
    if (onClick) onClick();
    navigate(to);
  };

  return (
    <button
      type="button"
      onClick={handleNavigate}
      title={title}
      className={`w-10 h-10 rounded-xl mb-2 inline-flex items-center justify-center transition-all text-sm ${
        isActive ? 'text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/8'
      }`}
      style={isActive ? { background: 'var(--accent-blue)', color: '#fff' } : { color: 'var(--text-secondary)' }}
    >
      {icon}
    </button>
  );
};

export const SidebarContent = ({ displayName, displayRole, isEmployee, isViewer, onClose, onLogout }) => (
  <>
    <div className="w-20 h-20 rounded-full mb-3 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg" style={{ border: '2px solid var(--glass-border)' }}>
      <img
        src={adminAvatar}
        alt="Admin avatar"
        className="w-full h-full object-cover"
      />
    </div>
    <h2 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{displayName}</h2>
    <p className="text-[11px] font-medium mb-6 tracking-wide" style={{ color: 'var(--text-secondary)' }}>{displayRole}</p>

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

      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
        <button
          onClick={onLogout}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all hover:opacity-80 text-left"
          style={{ color: 'var(--accent-red)' }}
        >
          <i className="bi bi-box-arrow-right mr-2" aria-hidden="true" />
          Log Out
        </button>
      </div>
    </div>

    <div className="mt-6 w-full glass-subtle rounded-xl p-3 text-center text-[10px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
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
      className="w-10 h-10 rounded-xl mt-auto flex items-center justify-center transition-all hover:opacity-80 text-sm"
      style={{ color: 'var(--accent-red)' }}
    >
      <i className="bi bi-box-arrow-right" aria-hidden="true" />
    </button>
  </>
);
