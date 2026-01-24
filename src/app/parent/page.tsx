'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaymentIcon from '@mui/icons-material/Payment';
import GradeIcon from '@mui/icons-material/Grade';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface ChildData {
  studentInfo: {
    _id: string;
    studentId: string;
    fullName: string;
    classGrade: string;
    section: string;
    monthlyFeeAmount: number;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
    recentRecords: Array<{
      date: string;
      status: 'P' | 'A' | 'L' | 'H';
      remarks?: string;
    }>;
  };
  fees: {
    currentMonthStatus: string;
    pendingAmount: number;
    monthlyFee: number;
  };
  marks: {
    recent: Array<{
      subject: string;
      testName: string;
      obtainedMarks: number;
      totalMarks: number;
      percentage: number;
      examDate: string;
    }>;
    averagePercentage: number;
  };
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'PARENT') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/parent/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case 'P': return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'A': return <CancelIcon className="w-4 h-4 text-red-500" />;
      case 'L': return <AccessTimeIcon className="w-4 h-4 text-yellow-500" />;
      case 'H': return <HomeIcon className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getFeeStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-100';
      case 'PARTIAL': return 'text-yellow-600 bg-yellow-100';
      case 'PENDING': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!user || user.role !== 'PARENT') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.fullName || 'Parent'}
              </p>
            </div>
            
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <SchoolIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Children Found</h2>
            <p className="text-gray-600">
              No student records found associated with your account. Please contact the school administration.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {children.map((child) => (
              <div key={child.studentInfo._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Child Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <SchoolIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {child.studentInfo.fullName}
                      </h2>
                      <p className="text-sm text-gray-600">
                        ID: {child.studentInfo.studentId} | Class: {child.studentInfo.classGrade}
                        {child.studentInfo.section && ` - ${child.studentInfo.section}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Attendance Card */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-green-800">Attendance (Last 30 Days)</h3>
                        <CalendarTodayIcon className="w-5 h-5 text-green-600" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-green-900">
                            {child.attendance.percentage}%
                          </span>
                          <span className="text-sm text-green-700">
                            {child.attendance.presentDays}/{child.attendance.totalDays} days
                          </span>
                        </div>
                        
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${child.attendance.percentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Recent attendance */}
                        <div className="mt-3">
                          <p className="text-xs text-green-700 mb-2">Last 7 days:</p>
                          <div className="flex gap-1">
                            {child.attendance.recentRecords.slice(0, 7).map((record, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full flex items-center justify-center bg-white border"
                                title={`${new Date(record.date).toLocaleDateString()} - ${record.status === 'P' ? 'Present' : record.status === 'A' ? 'Absent' : record.status === 'L' ? 'Late' : 'Holiday'}`}
                              >
                                {getAttendanceStatusIcon(record.status)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fees Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-blue-800">Fee Status</h3>
                        <PaymentIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Monthly Fee:</span>
                          <span className="font-semibold text-blue-900">
                            ₹{child.fees.monthlyFee.toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Pending:</span>
                          <span className="font-semibold text-blue-900">
                            ₹{child.fees.pendingAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getFeeStatusColor(child.fees.currentMonthStatus)}`}
                          >
                            {child.fees.currentMonthStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Marks Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-purple-800">Academic Performance</h3>
                        <GradeIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700">Average:</span>
                          <span className={`text-2xl font-bold ${getGradeColor(child.marks.averagePercentage)}`}>
                            {child.marks.averagePercentage}%
                          </span>
                        </div>
                        
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-purple-700 mb-2">Recent Tests:</p>
                          {child.marks.recent.slice(0, 3).map((mark, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-purple-700 truncate">
                                {mark.subject} - {mark.testName}
                              </span>
                              <span className={`font-medium ${getGradeColor(mark.percentage)}`}>
                                {mark.percentage}%
                              </span>
                            </div>
                          ))}
                          {child.marks.recent.length === 0 && (
                            <p className="text-xs text-purple-600">No recent marks available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Summary */}
                  {child.marks.recent.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Test Results</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 border-b">
                              <th className="pb-2">Subject</th>
                              <th className="pb-2">Test</th>
                              <th className="pb-2">Marks</th>
                              <th className="pb-2">Percentage</th>
                              <th className="pb-2">Date</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-800">
                            {child.marks.recent.map((mark, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-2 font-medium">{mark.subject}</td>
                                <td className="py-2">{mark.testName}</td>
                                <td className="py-2">{mark.obtainedMarks}/{mark.totalMarks}</td>
                                <td className="py-2">
                                  <span className={`font-medium ${getGradeColor(mark.percentage)}`}>
                                    {mark.percentage}%
                                  </span>
                                </td>
                                <td className="py-2">{new Date(mark.examDate).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}