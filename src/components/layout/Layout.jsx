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
    <div className="flex flex-col w-screen h-screen bg-white font-sans text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <ConfirmLogoutModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        busy={loggingOut}
      />
      {/* Header Section - Floating on Mobile */}
      <header className="flex justify-between items-center px-4 md:px-8 py-4 bg-[#f2dede] border-b-4 border-[#bc7676] shadow-md fixed md:sticky w-full top-0 z-50 dark:bg-gray-800 dark:border-gray-700">
        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100">
          <span className="md:hidden">BDLAG Utility</span>
          <span className="hidden md:inline">Bato de Luna Art Gallery</span>
        </h1>
        
        <div className="flex gap-2 md:gap-6 text-xs md:text-sm font-semibold items-center">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={toggleSidebar}
            className="md:hidden flex flex-col gap-1.5 p-2 hover:bg-[#e6a891] rounded transition-colors dark:hover:bg-gray-700"
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-gray-900 dark:bg-gray-100 transition-all duration-300 ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-900 dark:bg-gray-100 transition-all duration-300 ${sidebarOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-900 dark:bg-gray-100 transition-all duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          {/* Desktop Menu Items */}
          <button
            onClick={toggleDesktopSidebar}
            className="hidden md:block px-4 py-2 hover:bg-[#e6a891] rounded transition-colors dark:hover:bg-gray-700"
          >
            {sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <button className="hidden md:block px-4 py-2 hover:bg-[#e6a891] rounded transition-colors dark:hover:bg-gray-700">Contact</button>
          <button onClick={openLogout} className="hidden md:block px-4 py-2 hover:bg-[#d59780] rounded transition-colors dark:hover:bg-gray-700">Log-Out</button>
        </div>
      </header>

      <div
        className="flex-1 w-screen overflow-hidden pt-20 md:pt-0"
        style={{ height: 'calc(100vh - 80px)' }}
      >
        <div className={`h-full overflow-x-hidden md:grid ${sidebarVisible ? 'md:grid-cols-[18rem_minmax(0,1fr)]' : 'md:grid-cols-[4rem_minmax(0,1fr)]'}`}>
        {/* Mobile Sidebar Overlay - Glass Effect */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-30 md:hidden"
            onClick={closeSidebar}
          ></div>
        )}

        {/* Sidebar Section - Mobile */}
        <aside
          className={`fixed left-1/2 top-20 -translate-x-1/2 w-80 bg-[#e9dcc9]/90 backdrop-blur-md p-6 flex flex-col items-center rounded-lg shadow-2xl overflow-y-auto border-4 border-[#bc7676] z-40 transition-all duration-300 max-h-[calc(100vh-140px)] dark:bg-gray-800 dark:border-gray-700 md:hidden ${
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
          <aside className="hidden md:flex md:sticky md:top-4 w-72 bg-[#e9dcc9] p-6 flex-col items-center shadow-lg overflow-y-auto border-r-4 border-[#bc7676] dark:bg-gray-800 dark:border-gray-700 max-h-[calc(100vh-120px)]">
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
          <aside className="hidden md:flex md:sticky md:top-4 w-16 bg-[#e9dcc9] p-2 flex-col items-center shadow-lg border-r-4 border-[#bc7676] dark:bg-gray-800 dark:border-gray-700 max-h-[calc(100vh-120px)]">
            <SidebarCollapsed
              isEmployee={isEmployee}
              isViewer={isViewer}
              onClose={closeSidebar}
              onLogout={openLogout}
            />
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-4 md:p-8 gap-4 md:gap-8 bg-gray-50 w-full dark:bg-gray-900 overflow-y-auto">
          {children}
        </main>
        </div>
      </div>
    </div>
  );
}
