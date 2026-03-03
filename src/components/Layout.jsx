import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SidebarBtn = ({ to, text, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to}>
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
  return (
    <div className="flex flex-col w-screen h-screen bg-white font-sans overflow-hidden">
      {/* Header Section */}
      <header className="flex justify-between items-center px-8 py-4 bg-[#f2dede] border-b-4 border-[#bc7676] shadow-md fixed w-full top-0 z-50">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">BDLAG Utility</h1>
        <div className="flex gap-6 text-sm font-semibold">
          <button className="px-4 py-2 hover:bg-[#e6a891] rounded transition-colors">Contact</button>
          <button className="px-4 py-2 hover:bg-[#d59780] rounded transition-colors">Log-Out</button>
        </div>
      </header>

      <div className="flex flex-1 w-screen overflow-hidden gap-0 pt-20">
        {/* Sidebar Section */}
        <aside className="w-72 bg-[#e9dcc9] p-6 flex flex-col items-center rounded-none shadow-lg overflow-y-auto border-r-4 border-[#bc7676]">
          <div className="w-24 h-24 bg-gradient-to-br from-[#bc7676] to-[#a85f66] rounded-full mb-4 shadow-lg flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Admin User</h2>
          <p className="text-xs text-gray-600 mb-8">System Administrator</p>
          
          <div className="w-full flex-1">
            <SidebarBtn to="/dashboard" text="Dashboard" icon="📊" />
            <SidebarBtn to="/employees" text="Employees" icon="👥" />
            <SidebarBtn to="/settings" text="Settings" icon="⚙️" />
            <SidebarBtn to="/reports" text="Reports" icon="📈" />
          </div>

          <button className="w-full py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg shadow-md mt-auto flex-shrink-0 font-semibold transition-all hover:shadow-lg">
            🚪 Logout
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto bg-gray-50 w-full h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
