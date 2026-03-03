import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

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
        {icon} {text}
      </button>
    </Link>
  );
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col w-screen min-h-screen bg-white font-sans">
      {/* Header Section - Floating on Mobile */}
      <header className="flex justify-between items-center px-4 md:px-8 py-4 bg-[#f2dede] border-b-4 border-[#bc7676] shadow-md fixed md:static w-full top-0 z-50">
        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-gray-900">BDLAG Utility</h1>
        
        <div className="flex gap-2 md:gap-6 text-xs md:text-sm font-semibold items-center">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={toggleSidebar}
            className="md:hidden flex flex-col gap-1.5 p-2 hover:bg-[#e6a891] rounded transition-colors"
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${sidebarOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          {/* Desktop Menu Items */}
          <button className="hidden md:block px-4 py-2 hover:bg-[#e6a891] rounded transition-colors">Contact</button>
          <button className="hidden md:block px-4 py-2 hover:bg-[#d59780] rounded transition-colors">Log-Out</button>
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
          className={`fixed md:static left-1/2 md:left-0 top-20 md:top-auto -translate-x-1/2 md:translate-x-0 w-80 md:w-72 bg-[#e9dcc9]/90 md:bg-[#e9dcc9] backdrop-blur-md md:backdrop-blur-none p-6 flex flex-col items-center rounded-lg md:rounded-none shadow-2xl md:shadow-lg overflow-y-auto border-4 md:border-r-4 md:border-b-0 border-[#bc7676] z-40 transition-all duration-300 max-h-[calc(100vh-140px)] md:max-h-none md:h-auto md:border-b-0 ${
            sidebarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full md:translate-y-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
          }`}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-[#bc7676] to-[#a85f66] rounded-full mb-4 shadow-lg flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Admin User</h2>
          <p className="text-xs text-gray-600 mb-8">System Administrator</p>
          
          <div className="w-full flex-1">
            <SidebarBtn to="/dashboard" text="Dashboard" icon="📊" onClick={closeSidebar} />
            <SidebarBtn to="/employees" text="Employees" icon="👥" onClick={closeSidebar} />
            <SidebarBtn to="/settings" text="Settings" icon="⚙️" onClick={closeSidebar} />
            <SidebarBtn to="/reports" text="Reports" icon="📈" onClick={closeSidebar} />
          </div>

          <button className="w-full py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg shadow-md mt-auto flex-shrink-0 font-semibold transition-all hover:shadow-lg">
            🚪 Logout
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-4 md:p-8 gap-4 md:gap-8 overflow-y-auto bg-gray-50 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
