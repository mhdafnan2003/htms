'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GroupsIcon from '@mui/icons-material/Groups';
import DownloadIcon from '@mui/icons-material/Download';

interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    classGrade: string;
    section: string;
}

interface AttendanceRecord {
    status: 'P' | 'A' | 'L' | 'H';
    entryTime?: string;
    exitTime?: string;
}

interface AttendanceMap {
    [studentId: string]: {
        [day: number]: AttendanceRecord;
    };
}

interface StudentStats {
    student: Student;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    holidayDays: number;
    workingDays: number;
    percentage: number;
}

export default function AttendanceReportPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'name' | 'percentage'>('percentage');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    }, []);

    // Calculate stats for each student
    const studentStats = useMemo((): StudentStats[] => {
        return students.map(student => {
            const attendance = attendanceMap[student._id] || {};
            let present = 0, absent = 0, late = 0, holiday = 0;

            Object.values(attendance).forEach(r => {
                if (r.status === 'P') present++;
                if (r.status === 'A') absent++;
                if (r.status === 'L') late++;
                if (r.status === 'H') holiday++;
            });

            const total = present + absent + late + holiday;
            const working = total - holiday;
            const percentage = working > 0 ? ((present + late) / working * 100) : 0;

            return {
                student,
                totalDays: total,
                presentDays: present,
                absentDays: absent,
                lateDays: late,
                holidayDays: holiday,
                workingDays: working,
                percentage: Math.round(percentage * 10) / 10
            };
        });
    }, [students, attendanceMap]);

    // Sort students
    const sortedStats = useMemo(() => {
        return [...studentStats].sort((a, b) => {
            if (sortBy === 'name') {
                return sortOrder === 'asc'
                    ? a.student.fullName.localeCompare(b.student.fullName)
                    : b.student.fullName.localeCompare(a.student.fullName);
            } else {
                return sortOrder === 'asc'
                    ? a.percentage - b.percentage
                    : b.percentage - a.percentage;
            }
        });
    }, [studentStats, sortBy, sortOrder]);

    // Class statistics
    const classStats = useMemo(() => {
        if (studentStats.length === 0) return null;

        const avgPercentage = studentStats.reduce((sum, s) => sum + s.percentage, 0) / studentStats.length;
        const above90 = studentStats.filter(s => s.percentage >= 90).length;
        const between75and90 = studentStats.filter(s => s.percentage >= 75 && s.percentage < 90).length;
        const below75 = studentStats.filter(s => s.percentage < 75).length;

        const sortedByPercentage = [...studentStats].sort((a, b) => b.percentage - a.percentage);
        const best = sortedByPercentage[0];
        const lowest = sortedByPercentage[sortedByPercentage.length - 1];

        return {
            avgPercentage: Math.round(avgPercentage * 10) / 10,
            totalStudents: studentStats.length,
            above90,
            between75and90,
            below75,
            best,
            lowest
        };
    }, [studentStats]);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchMonthlyData();
        }
    }, [selectedClass, selectedMonth, selectedYear]);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const uniqueClasses = [...new Set(data.students.map((s: Student) => s.classGrade))];
                setClasses(uniqueClasses.sort());
                if (uniqueClasses.length > 0 && !selectedClass) {
                    setSelectedClass(uniqueClasses[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchMonthlyData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `/api/attendance/monthly?class=${selectedClass}&month=${selectedMonth}&year=${selectedYear}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
                setAttendanceMap(data.attendanceMap || {});
            }
        } catch (error) {
            console.error('Error fetching monthly data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = () => {
        let csv = 'Rank,Student Name,Student ID,Present,Absent,Late,Holiday,Working Days,Attendance %\n';

        sortedStats.forEach((stat, idx) => {
            csv += `${idx + 1},"${stat.student.fullName}",${stat.student.studentId},`;
            csv += `${stat.presentDays},${stat.absentDays},${stat.lateDays},${stat.holidayDays},`;
            csv += `${stat.workingDays},${stat.percentage}%\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${selectedClass}_${months[selectedMonth - 1]}_${selectedYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleSort = (column: 'name' | 'percentage') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder(column === 'percentage' ? 'desc' : 'asc');
        }
    };

    if (loading && students.length === 0) {
        return (
            <AdminLayout title="Attendance Report">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Attendance Report">
            <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                {classes.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>

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

                        <div className="ml-auto">
                            <button
                                onClick={exportReport}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>

                {/* Class Overview Stats */}
                {classStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Best Attendance */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-5 text-white">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <EmojiEventsIcon className="w-6 h-6" />
                                </div>
                                <div className="text-sm font-medium opacity-90">Best Attendance</div>
                            </div>
                            {classStats.best && (
                                <div>
                                    <p className="text-2xl font-bold">{classStats.best.percentage}%</p>
                                    <p className="text-sm opacity-90">{classStats.best.student.fullName}</p>
                                </div>
                            )}
                        </div>

                        {/* Class Average */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-5 text-white">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <GroupsIcon className="w-6 h-6" />
                                </div>
                                <div className="text-sm font-medium opacity-90">Class Average</div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{classStats.avgPercentage}%</p>
                                <p className="text-sm opacity-90">{classStats.totalStudents} students</p>
                            </div>
                        </div>

                        {/* Lowest Attendance */}
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-sm p-5 text-white">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <TrendingDownIcon className="w-6 h-6" />
                                </div>
                                <div className="text-sm font-medium opacity-90">Needs Improvement</div>
                            </div>
                            {classStats.lowest && (
                                <div>
                                    <p className="text-2xl font-bold">{classStats.lowest.percentage}%</p>
                                    <p className="text-sm opacity-90">{classStats.lowest.student.fullName}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Attendance Distribution */}
                {classStats && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-3xl font-bold text-green-600">{classStats.above90}</p>
                                <p className="text-sm text-green-700">Above 90%</p>
                                <p className="text-xs text-green-600 mt-1">Excellent</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-3xl font-bold text-yellow-600">{classStats.between75and90}</p>
                                <p className="text-sm text-yellow-700">75% - 90%</p>
                                <p className="text-xs text-yellow-600 mt-1">Good</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-3xl font-bold text-red-600">{classStats.below75}</p>
                                <p className="text-sm text-red-700">Below 75%</p>
                                <p className="text-xs text-red-600 mt-1">Needs Attention</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Student Rankings Table */}
                {sortedStats.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Student Rankings</h3>
                            <div className="text-sm text-gray-500">
                                {months[selectedMonth - 1]} {selectedYear}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-16">
                                            Rank
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                                            onClick={() => toggleSort('name')}
                                        >
                                            Student {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                            Present
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                            Absent
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                            Late
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                            Working Days
                                        </th>
                                        <th
                                            className="px-4 py-3 text-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                                            onClick={() => toggleSort('percentage')}
                                        >
                                            Attendance % {sortBy === 'percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStats.map((stat, idx) => (
                                        <tr key={stat.student._id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{stat.student.fullName}</div>
                                                <div className="text-xs text-gray-500">{stat.student.studentId}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-green-600 font-medium">{stat.presentDays}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-red-600 font-medium">{stat.absentDays}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-yellow-600 font-medium">{stat.lateDays}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-700">
                                                {stat.workingDays}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-lg font-bold ${stat.percentage >= 90 ? 'text-green-600' :
                                                    stat.percentage >= 75 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                    {stat.percentage}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${stat.percentage >= 90 ? 'bg-green-100 text-green-700' :
                                                    stat.percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {stat.percentage >= 90 ? 'Excellent' :
                                                        stat.percentage >= 75 ? 'Good' : 'Low'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <p className="text-gray-500">No attendance data found</p>
                        <p className="text-gray-400 text-sm mt-2">Select a class and month to generate report</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
