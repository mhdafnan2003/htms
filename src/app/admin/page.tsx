'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

import SchoolIcon from '@mui/icons-material/School';
import PaymentIcon from '@mui/icons-material/Payment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,

  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  monthlyFeeCollection: number;
  pendingFees: number;
  averageAttendance: number;
  totalSubjects: number;
  classDistribution?: Array<{ name: string; value: number; count: number }>;
  attendanceChartData?: Array<{ month: string; attendance: number }>;
  feeChartData?: Array<{ month: string; collected: number; pending: number }>;
}



export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    presentToday: 0,
    monthlyFeeCollection: 0,
    pendingFees: 0,
    averageAttendance: 0,
    totalSubjects: 0,
    classDistribution: [],
    attendanceChartData: [],
    feeChartData: []
  });

  const [loading, setLoading] = useState(true);

  // Use real data from API, with fallback samples if empty
  const attendanceData = stats.attendanceChartData?.length ? stats.attendanceChartData : [
    { month: 'Jan', attendance: 0 },
    { month: 'Feb', attendance: 0 },
    { month: 'Mar', attendance: 0 }
  ];

  const feeCollectionData = stats.feeChartData?.length ? stats.feeChartData : [
    { month: 'Jan', collected: 0, pending: 0 }
  ];



  useEffect(() => {
    // Fetch dashboard statistics
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to default values on error
      setStats({
        totalStudents: 0,
        presentToday: 0,
        monthlyFeeCollection: 0,
        pendingFees: 0,
        averageAttendance: 0,
        totalSubjects: 0,
        classDistribution: [],
        attendanceChartData: [],
        feeChartData: []
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    change,
    changeType,
    icon,
    color
  }: {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative';
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {changeType === 'positive' ? (
                <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            change="+12%"
            changeType="positive"
            icon={<SchoolIcon className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Present Today"
            value={`${stats.presentToday}/${stats.totalStudents}`}
            change={`${stats.totalStudents > 0 ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0}%`}
            changeType="positive"
            icon={<CalendarTodayIcon className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <StatCard
            title="Monthly Collection"
            value={`₹${stats.monthlyFeeCollection.toLocaleString('en-IN')}`}
            change="+8%"
            changeType="positive"
            icon={<PaymentIcon className="w-6 h-6 text-white" />}
            color="bg-yellow-500"
          />
          <StatCard
            title="Pending Fees"
            value={`₹${stats.pendingFees.toLocaleString('en-IN')}`}
            change="-15%"
            changeType="positive"
            icon={<AssessmentIcon className="w-6 h-6 text-white" />}
            color="bg-red-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Fee Collection Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Collection</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feeCollectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${(value || 0).toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="collected" fill="#10b981" name="Collected" />
                <Bar dataKey="pending" fill="#ef4444" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


      </div>
    </AdminLayout>
  );
}