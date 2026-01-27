'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ParentLayout from '@/components/parent/ParentLayout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface AttendanceRecord {
    status: 'P' | 'A' | 'L' | 'H';
    entryTime?: string;
    exitTime?: string;
    remarks?: string;
}

interface AttendanceData {
    [day: number]: AttendanceRecord;
}

interface AttendanceSummary {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    holidayDays: number;
    percentage: number;
}

export default function ParentAttendancePage() {
    const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    }, []);

    const daysInMonth = useMemo(() => {
        return new Date(selectedYear, selectedMonth, 0).getDate();
    }, [selectedYear, selectedMonth]);

    const dayHeaders = useMemo(() => {
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }, [daysInMonth]);

    useEffect(() => {
        fetchAttendance();

        const handleStudentChange = () => {
            fetchAttendance();
        };

        window.addEventListener('studentChanged', handleStudentChange);

        return () => {
            window.removeEventListener('studentChanged', handleStudentChange);
        };
    }, [selectedMonth, selectedYear]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const studentId = localStorage.getItem('selectedStudentId');

            if (!studentId) return;

            const response = await fetch(
                `/api/parent/attendance/monthly?studentId=${studentId}&month=${selectedMonth}&year=${selectedYear}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setAttendanceData(data.attendanceData || {});
                setSummary(data.summary || null);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusDisplay = (status?: 'P' | 'A' | 'L' | 'H') => {
        if (!status) return { text: '-', bg: 'bg-gray-50', color: 'text-gray-400' };
        switch (status) {
            case 'P': return { text: 'P', bg: 'bg-green-50', color: 'text-green-700', icon: <CheckCircleIcon style={{ fontSize: 16 }} /> };
            case 'A': return { text: 'A', bg: 'bg-red-50', color: 'text-red-700', icon: <CancelIcon style={{ fontSize: 16 }} /> };
            case 'L': return { text: 'L', bg: 'bg-yellow-50', color: 'text-yellow-700', icon: <AccessTimeIcon style={{ fontSize: 16 }} /> };
            case 'H': return { text: 'H', bg: 'bg-blue-50', color: 'text-blue-700', icon: <HomeIcon style={{ fontSize: 16 }} /> };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'P': return 'Present';
            case 'A': return 'Absent';
            case 'L': return 'Late';
            case 'H': return 'Holiday';
            default: return status;
        }
    };

    return (
        <ParentLayout title="Attendance">
            <div className="space-y-6">
                {/* Month/Year Selector */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <CalendarTodayIcon className="text-gray-400" />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                {months.map((month, idx) => (
                                    <option key={idx + 1} value={idx + 1}>{month}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-gray-500">Loading attendance...</div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <CalendarTodayIcon className="text-gray-600" style={{ fontSize: 20 }} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Total Days</p>
                                            <p className="text-2xl font-bold text-gray-900">{summary.totalDays}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <CheckCircleIcon className="text-green-600" style={{ fontSize: 20 }} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Present</p>
                                            <p className="text-2xl font-bold text-green-600">{summary.presentDays}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <CancelIcon className="text-red-600" style={{ fontSize: 20 }} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Absent</p>
                                            <p className="text-2xl font-bold text-red-600">{summary.absentDays}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <AccessTimeIcon className="text-yellow-600" style={{ fontSize: 20 }} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Late</p>
                                            <p className="text-2xl font-bold text-yellow-600">{summary.lateDays}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <span className="text-lg font-bold text-blue-600">%</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Attendance</p>
                                            <p className={`text-2xl font-bold ${summary.percentage >= 75 ? 'text-green-600' :
                                                summary.percentage >= 50 ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                {summary.percentage}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Monthly Calendar Grid */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {months[selectedMonth - 1]} {selectedYear} - Daily Attendance
                                </h3>
                            </div>

                            <div className="overflow-x-auto bg-white">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-50 border-b border-gray-300">
                                        <tr>
                                            {dayHeaders.map(day => (
                                                <th
                                                    key={day}
                                                    className="px-2 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-200 min-w-[90px] bg-gray-50"
                                                >
                                                    Day {day}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        <tr className="border-b border-gray-200">
                                            {dayHeaders.map(day => {
                                                const record = attendanceData[day];
                                                const display = getStatusDisplay(record?.status);

                                                return (
                                                    <td
                                                        key={day}
                                                        className={`px-2 py-3 text-center border-r border-gray-200 ${display.bg}`}
                                                        style={{
                                                            backgroundColor: display.bg.includes('green') ? '#f0fdf4' :
                                                                display.bg.includes('red') ? '#fef2f2' :
                                                                    display.bg.includes('yellow') ? '#fefce8' :
                                                                        display.bg.includes('blue') ? '#eff6ff' :
                                                                            '#f9fafb'
                                                        }}
                                                    >
                                                        <div className="flex flex-col items-center gap-1">
                                                            {/* Status */}
                                                            <div className={`text-xl font-bold ${display.color}`}>
                                                                {display.text}
                                                            </div>

                                                            {/* Entry/Exit Times */}
                                                            {(record?.status === 'P' || record?.status === 'L') && (
                                                                <div className="text-xs space-y-0.5 w-full">
                                                                    {record.entryTime && (
                                                                        <div className="flex items-center justify-center gap-1 text-green-700 font-medium">
                                                                            <span>IN:</span>
                                                                            <span>{record.entryTime}</span>
                                                                        </div>
                                                                    )}
                                                                    {record.exitTime ? (
                                                                        <div className="flex items-center justify-center gap-1 text-orange-700 font-medium">
                                                                            <span>OUT:</span>
                                                                            <span>{record.exitTime}</span>
                                                                        </div>
                                                                    ) : record.entryTime && (
                                                                        <div className="text-gray-400 text-[10px]">
                                                                            No exit recorded
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Remarks */}
                                                            {record?.remarks && (
                                                                <div className="text-[10px] text-gray-500 italic truncate max-w-[80px]" title={record.remarks}>
                                                                    {record.remarks}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                                        <span className="text-sm font-bold text-green-700">P</span>
                                    </div>
                                    <span className="text-sm text-gray-600">Present</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
                                        <span className="text-sm font-bold text-red-700">A</span>
                                    </div>
                                    <span className="text-sm text-gray-600">Absent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-yellow-50 rounded flex items-center justify-center">
                                        <span className="text-sm font-bold text-yellow-700">L</span>
                                    </div>
                                    <span className="text-sm text-gray-600">Late</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-700">H</span>
                                    </div>
                                    <span className="text-sm text-gray-600">Holiday</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
                                        <span className="text-sm font-bold text-gray-400">-</span>
                                    </div>
                                    <span className="text-sm text-gray-600">No Record</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </ParentLayout>
    );
}
