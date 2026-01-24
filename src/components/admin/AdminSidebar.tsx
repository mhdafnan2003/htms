'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HomeIcon from '@mui/icons-material/Home';

const menuItems = [
  {
    icon: <DashboardIcon />,
    label: 'Dashboard',
    href: '/admin',
    key: 'dashboard'
  },
  {
    icon: <HomeIcon />,
    label: 'Admission',
    key: 'admission',
    href: '/admin/admission/list'
  },
  {
    icon: <SchoolIcon />,
    label: 'Student',
    key: 'student',
    href: '/admin/students'
  },
  {
    icon: <CalendarIcon />,
    label: 'Attendance',
    key: 'attendance',
    children: [
      { label: 'Mark Attendance', href: '/admin/attendance/mark' },
      { label: 'View Attendance', href: '/admin/attendance/view' },
      { label: 'Attendance Report', href: '/admin/attendance/report' }
    ]
  },
  {
    icon: <PaymentIcon />,
    label: 'Fees',
    key: 'fees',
    children: [
      { label: 'Collect Fees', href: '/admin/fees/collect' },
      { label: 'Fee History', href: '/admin/fees/history' },
      { label: 'Fee Report', href: '/admin/fees/report' }
    ]
  },
  {
    icon: <AssessmentIcon />,
    label: 'Exam/Mark',
    key: 'exam',
    children: [
      { label: 'Add Marks', href: '/admin/marks/add' },
      { label: 'View Marks', href: '/admin/marks/view' },
      { label: 'Progress Report', href: '/admin/marks/report' }
    ]
  },
  {
    icon: <SettingsIcon />,
    label: 'Settings',
    key: 'settings',
    children: [
      { label: 'Profile Settings', href: '/admin/settings/profile' },
      { label: 'System Settings', href: '/admin/settings/system' }
    ]
  }
];

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = (key: string) => {
    if (collapsed) return; // Don't expand if sidebar is collapsed
    
    setExpandedItems(prev => 
      prev.includes(key) 
        ? prev.filter(item => item !== key)
        : [...prev, key]
    );
  };

  const isActive = (href?: string, children?: Array<{href: string}>) => {
    if (href && pathname === href) return true;
    if (children) {
      return children.some(child => pathname.startsWith(child.href));
    }
    return false;
  };

  return (
    <div className={`bg-blue-900 text-white h-screen transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } fixed left-0 top-0 z-50 overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-blue-800 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold">HTMS Admin</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4">
        {menuItems.map((item) => (
          <div key={item.key}>
            {item.href ? (
              // Simple menu item
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 hover:bg-blue-800 transition-colors ${
                  isActive(item.href) ? 'bg-blue-800 border-r-4 border-yellow-400' : ''
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {item.icon}
                </div>
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                )}
              </Link>
            ) : (
              // Menu item with submenu
              <div>
                <button
                  onClick={() => toggleExpanded(item.key)}
                  className={`w-full flex items-center px-4 py-3 hover:bg-blue-800 transition-colors ${
                    isActive(undefined, item.children) ? 'bg-blue-800' : ''
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="ml-3 text-sm font-medium flex-grow text-left">
                        {item.label}
                      </span>
                      {expandedItems.includes(item.key) ? (
                        <KeyboardArrowDownIcon className="w-5 h-5" />
                      ) : (
                        <KeyboardArrowRightIcon className="w-5 h-5" />
                      )}\n                    </>
                  )}
                </button>
                
                {/* Submenu */}
                {!collapsed && expandedItems.includes(item.key) && item.children && (
                  <div className="bg-blue-800">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block pl-12 pr-4 py-2 text-sm hover:bg-blue-700 transition-colors ${
                          pathname === child.href ? 'bg-blue-700 border-r-4 border-yellow-400' : ''
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}