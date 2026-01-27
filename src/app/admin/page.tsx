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
  PieChart,
  Pie,
  Cell,
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

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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

  const classDistribution = stats.classDistribution?.length ? stats.classDistribution : [
    { name: 'No Data', value: 100, count: 0 }
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

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={classDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {classDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {[
                { time: '2 hours ago', activity: 'New student admission: Rahul Sharma (Class 8)', type: 'admission' },
                { time: '4 hours ago', activity: 'Fee payment received: ₹2,500 from Priya Singh', type: 'payment' },
                { time: '6 hours ago', activity: 'Attendance marked for 42 students', type: 'attendance' },
                { time: '1 day ago', activity: 'Exam marks added for Mathematics - Class 10', type: 'marks' },
                { time: '2 days ago', activity: 'Monthly fee report generated', type: 'report' }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'admission' ? 'bg-blue-500' :
                    activity.type === 'payment' ? 'bg-green-500' :
                      activity.type === 'attendance' ? 'bg-yellow-500' :
                        activity.type === 'marks' ? 'bg-purple-500' : 'bg-gray-500'
                    }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.activity}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}