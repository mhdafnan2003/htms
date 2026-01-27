'use client';

import Link from 'next/link'; // Not needed but keeping existing imports structure if I can seeing file content again
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = 'Admin Dashboard' }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Here you would implement actual dark mode toggle
    document.documentElement.classList.toggle('dark', !darkMode);
  };

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        } ml-0`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 md:hidden"
              >
                <MenuIcon className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, {user?.name || 'Admin'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </button>

              {/* Notifications */}
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                title="Notifications"
              >
                <NotificationsIcon />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>

                <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <AccountCircleIcon className="w-8 h-8 text-gray-600" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogoutIcon />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}