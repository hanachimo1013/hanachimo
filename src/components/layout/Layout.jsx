import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ConfirmLogoutModal from '../auth/ConfirmLogoutModal';
import { SidebarContent, SidebarCollapsed } from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const isViewer = user?.role === 'viewer';
  const displayName = user?.name || user?.username || 'User';
  const displayRole = user?.role ? user.role.toUpperCase() : 'USER';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDesktopSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      closeSidebar();
      setLogoutOpen(false);
      setLoggingOut(false);
      navigate('/', { replace: true, state: { loggedOut: true } });
    }, 350);
  };

  const openLogout = () => {
    setLogoutOpen(true);
  };

  return (
    <div className="flex flex-col w-full min-h-screen md:h-screen font-sans" style={{ background: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      <ConfirmLogoutModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        busy={loggingOut}
      />

      {/* Header — frosted glass bar */}
      <header className="glass flex justify-between items-center px-4 md:px-8 py-3 fixed md:sticky w-full top-0 z-50" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h1 className="text-lg md:text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          <span className="md:hidden">BDLAG</span>
          <span className="hidden md:inline">Bato de Luna Art Gallery</span>
        </h1>
        
        <div className="flex gap-1 md:gap-2 text-xs md:text-sm font-medium items-center">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={toggleSidebar}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ background: 'var(--text-primary)' }}></span>
            <span className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${sidebarOpen ? 'opacity-0' : ''}`} style={{ background: 'var(--text-primary)' }}></span>
            <span className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ background: 'var(--text-primary)' }}></span>
          </button>

          {/* Desktop Menu Items */}
          <button
            onClick={toggleDesktopSidebar}
            className="hidden md:block px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            {sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <button className="hidden md:block px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--text-secondary)' }}>Contact</button>
          <button onClick={openLogout} className="hidden md:block px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--accent-red)' }}>Log Out</button>
        </div>
      </header>

      <div className="flex-1 w-full md:overflow-hidden pt-16 md:pt-0">
        <div className={`flex-1 md:h-[calc(100vh-56px)] md:grid transition-[grid-template-columns] duration-300 ease-in-out ${sidebarVisible ? 'md:grid-cols-[17rem_minmax(0,1fr)]' : 'md:grid-cols-[4rem_minmax(0,1fr)]'}`}>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden animate-fade-in"
            onClick={closeSidebar}
          ></div>
        )}

        {/* Sidebar Section - Mobile */}
        <aside
          className={`fixed left-1/2 top-16 -translate-x-1/2 w-80 glass p-6 flex flex-col items-center rounded-2xl z-40 transition-all duration-300 max-h-[calc(100vh-100px)] overflow-y-auto md:hidden ${
            sidebarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <SidebarContent
            displayName={displayName}
            displayRole={displayRole}
            isEmployee={isEmployee}
            isViewer={isViewer}
            onClose={closeSidebar}
            onLogout={openLogout}
          />
        </aside>

        {/* Sidebar Section - Desktop */}
        {sidebarVisible ? (
          <aside className="hidden md:flex md:sticky md:top-0 w-[17rem] glass p-5 flex-col items-center overflow-y-auto max-h-[calc(100vh-56px)] transition-[width,padding] duration-300 ease-in-out custom-scrollbar" style={{ borderRight: '1px solid var(--border-light)', borderRadius: 0 }}>
            <SidebarContent
              displayName={displayName}
              displayRole={displayRole}
              isEmployee={isEmployee}
              isViewer={isViewer}
              onClose={closeSidebar}
              onLogout={openLogout}
            />
          </aside>
        ) : (
          <aside className="hidden md:flex md:sticky md:top-0 w-16 p-2 flex-col items-center overflow-y-auto max-h-[calc(100vh-56px)] transition-[width,padding] duration-300 ease-in-out" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))', borderRight: '1px solid var(--border-light)' }}>
            <SidebarCollapsed
              isEmployee={isEmployee}
              isViewer={isViewer}
              onClose={closeSidebar}
              onLogout={openLogout}
            />
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-4 md:p-8 gap-4 md:gap-6 w-full md:overflow-y-auto custom-scrollbar" style={{ background: 'var(--surface-primary)' }}>
          {children}
        </main>
        </div>
      </div>
    </div>
  );
}
