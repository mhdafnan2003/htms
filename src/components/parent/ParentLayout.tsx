'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaymentIcon from '@mui/icons-material/Payment';
import GradeIcon from '@mui/icons-material/Grade';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';

interface ParentLayoutProps {
    children: React.ReactNode;
    title: string;
}

interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    classGrade: string;
    section?: string;
}

const menuItems = [
    { key: 'info', label: 'Personal Info', icon: <PersonIcon />, href: '/parent' },
    { key: 'attendance', label: 'Attendance', icon: <CalendarTodayIcon />, href: '/parent/attendance' },
    { key: 'marks', label: 'Marks', icon: <GradeIcon />, href: '/parent/marks' },
    { key: 'fees', label: 'Fees', icon: <PaymentIcon />, href: '/parent/fees' },
];

export default function ParentLayout({ children, title }: ParentLayoutProps) {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        // Only redirect if auth is done loading and user is not a parent
        if (!authLoading) {
            if (!user || user.role !== 'PARENT') {
                router.push('/login');
                return;
            }
            fetchStudents();
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (selectedStudent) {
            localStorage.setItem('selectedStudentId', selectedStudent);
            // Dispatch custom event to notify all pages
            window.dispatchEvent(new Event('studentChanged'));
        }
    }, [selectedStudent]);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/parent/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
                if (data.students?.length > 0) {
                    const savedId = localStorage.getItem('selectedStudentId');
                    const validId = data.students.find((s: Student) => s._id === savedId)?._id;
                    setSelectedStudent(validId || data.students[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const isActive = (href: string) => {
        if (href === '/parent') {
            return pathname === '/parent';
        }
        return pathname.startsWith(href);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!user || user.role !== 'PARENT') {
        return null; // Will redirect in useEffect
    }
    const selectedStudentData = students.find(s => s._id === selectedStudent);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`bg-blue-900 text-white h-screen transition-all duration-300 
                fixed left-0 top-0 z-50 overflow-hidden
                ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'}
                w-64
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                {/* Header */}
                <div className="p-4 border-b border-blue-800 flex items-center justify-between">
                    {(!sidebarCollapsed || mobileOpen) && (
                        <div className="flex items-center gap-2">
                            <SchoolIcon />
                            <h1 className="text-lg font-bold">Parent Portal</h1>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 hover:bg-blue-800 rounded-lg transition-colors hidden md:block" // Hide on mobile
                    >
                        <MenuIcon />
                    </button>
                    {/* Close button for mobile optional */}
                </div>

                {/* Student Selector */}
                {(!sidebarCollapsed || mobileOpen) && students.length > 0 && (
                    <div className="p-4 border-b border-blue-800">
                        <label className="block text-xs text-blue-300 mb-1">Viewing Student</label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="w-full bg-blue-800 border border-blue-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {students.map(student => (
                                <option key={student._id} value={student._id}>
                                    {student.fullName}
                                </option>
                            ))}
                        </select>
                        {selectedStudentData && (
                            <p className="text-xs text-blue-300 mt-1">
                                {selectedStudentData.studentId} | Class {selectedStudentData.classGrade}
                            </p>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <nav className="mt-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center px-4 py-3 hover:bg-blue-800 transition-colors ${isActive(item.href) ? 'bg-blue-800 border-r-4 border-yellow-400' : ''
                                }`}
                        >
                            <div className="w-6 h-6 flex items-center justify-center">
                                {item.icon}
                            </div>
                            {(!sidebarCollapsed || mobileOpen) && (
                                <span className="ml-3 text-sm font-medium">{item.label}</span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-3 text-red-300 hover:bg-red-900/50 rounded-lg transition-colors ${sidebarCollapsed && !mobileOpen ? 'justify-center' : ''
                            }`}
                    >
                        <LogoutIcon />
                        {(!sidebarCollapsed || mobileOpen) && (
                            <span className="ml-3 text-sm font-medium">Logout</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 bg-gray-100 min-h-screen ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
                } ml-0`}>
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setMobileOpen(true)}
                                    className="p-2 -ml-2 rounded-lg hover:bg-gray-100 md:hidden"
                                >
                                    <MenuIcon className="text-gray-600" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                    {selectedStudentData && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {selectedStudentData.fullName} | {selectedStudentData.studentId} | Class {selectedStudentData.classGrade}
                                            {selectedStudentData.section && ` - ${selectedStudentData.section}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Parent'}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <PersonIcon className="text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 bg-gray-100 min-h-[calc(100vh-80px)]">
                    {students.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <SchoolIcon style={{ fontSize: 48 }} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Found</h3>
                            <p className="text-gray-600">
                                No student records found associated with your account. Please contact the administration.
                            </p>
                        </div>
                    ) : (
                        children
                    )}
                </main>
            </div>
        </div>
    );
}
