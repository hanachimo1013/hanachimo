import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import adminAvatar from '../assets/admin-avatar.png';
import { useAuth } from '../context/AuthContext';

const SidebarBtn = ({ to, text, icon, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

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

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col w-screen min-h-screen bg-white font-sans text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Header Section - Floating on Mobile */}
      <header className="flex justify-between items-center px-4 md:px-8 py-4 bg-[#f2dede] border-b-4 border-[#bc7676] shadow-md fixed md:static w-full top-0 z-50 dark:bg-gray-800 dark:border-gray-700">
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
          <button className="hidden md:block px-4 py-2 hover:bg-[#e6a891] rounded transition-colors dark:hover:bg-gray-700">Contact</button>
          <button onClick={handleLogout} className="hidden md:block px-4 py-2 hover:bg-[#d59780] rounded transition-colors dark:hover:bg-gray-700">Log-Out</button>
        </div>
      </header>

      <div className="flex flex-1 w-screen overflow-hidden gap-0 pt-20 md:pt-0">
        {/* Mobile Sidebar Overlay - Glass Effect */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-30 md:hidden"
            onClick={closeSidebar}
          ></div>
        )}

        {/* Sidebar Section - Centered Dropdown on Mobile */}
        <aside
          className={`fixed md:static left-1/2 md:left-0 top-20 md:top-auto -translate-x-1/2 md:translate-x-0 w-80 md:w-72 bg-[#e9dcc9]/90 md:bg-[#e9dcc9] backdrop-blur-md md:backdrop-blur-none p-6 flex flex-col items-center rounded-lg md:rounded-none shadow-2xl md:shadow-lg overflow-y-auto border-4 md:border-r-4 md:border-b-0 border-[#bc7676] z-40 transition-all duration-300 max-h-[calc(100vh-140px)] md:max-h-none md:h-auto md:border-b-0 dark:bg-gray-800 dark:border-gray-700 ${
            sidebarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full md:translate-y-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
          }`}
        >
          <div className="w-24 h-24 rounded-full mb-4 shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-white/30">
            <img
              src={adminAvatar}
              alt="Admin avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">はなちも-管理者</h2>
          <p className="text-xs text-gray-600 mb-8 dark:text-gray-300">System Administrator</p>
          
          <div className="w-full flex-1">
            <SidebarBtn to="/dashboard" text="Dashboard" icon={<i className="bi bi-speedometer2" />} onClick={closeSidebar} />
            <SidebarBtn to="/employees" text="Employees" icon={<i className="bi bi-people-fill" />} onClick={closeSidebar} />
            <SidebarBtn to="/settings" text="Settings" icon={<i className="bi bi-gear-fill" />} onClick={closeSidebar} />
            <SidebarBtn to="/reports" text="Reports" icon={<i className="bi bi-bar-chart-fill" />} onClick={closeSidebar} />
          <button onClick={handleLogout} className="w-full py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg shadow-md mt-auto flex-shrink-0 font-semibold transition-all hover:shadow-lg">
            <i className="bi bi-box-arrow-right mr-2" aria-hidden="true" />
            Logout
          </button>
          </div>

          <div className="mt-6 w-full rounded-lg border border-[#bc7676]/40 bg-white/70 p-3 text-center text-[10px] leading-relaxed text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
            Built by hanachimo using React, Vite, Tailwind CSS, and Supabase.
            c.2026
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-4 md:p-8 gap-4 md:gap-8 overflow-y-auto bg-gray-50 w-full dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
