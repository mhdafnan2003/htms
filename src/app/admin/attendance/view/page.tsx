'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
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
    remarks?: string;
}

interface AttendanceMap {
    [studentId: string]: {
        [day: number]: AttendanceRecord;
    };
}

interface Summary {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    holidayDays: number;
    attendancePercentage: number;
}

export default function ViewAttendancePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedStudent, setSelectedStudent] = useState<string>('all');
    const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<string[]>([]);

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

    // Filter students based on selection
    const displayedStudents = useMemo(() => {
        if (selectedStudent === 'all') return students;
        return students.filter(s => s._id === selectedStudent);
    }, [students, selectedStudent]);

    // Calculate summary for displayed students
    const summary = useMemo((): Summary => {
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalHoliday = 0;
        let totalRecords = 0;

        displayedStudents.forEach(student => {
            const studentAttendance = attendanceMap[student._id] || {};
            Object.values(studentAttendance).forEach(record => {
                totalRecords++;
                if (record.status === 'P') totalPresent++;
                if (record.status === 'A') totalAbsent++;
                if (record.status === 'L') totalLate++;
                if (record.status === 'H') totalHoliday++;
            });
        });

        const workingDays = totalRecords - totalHoliday;
        const percentage = workingDays > 0
            ? ((totalPresent + totalLate) / workingDays * 100)
            : 0;

        return {
            totalDays: totalRecords,
            presentDays: totalPresent,
            absentDays: totalAbsent,
            lateDays: totalLate,
            holidayDays: totalHoliday,
            attendancePercentage: Math.round(percentage * 10) / 10
        };
    }, [displayedStudents, attendanceMap]);

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
                const uniqueClasses = [...new Set(data.students.map((s: Student) => s.classGrade))] as string[];
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

    const exportToCSV = () => {
        // Build CSV content
        let csv = 'Student Name,Student ID';
        dayHeaders.forEach(day => {
            csv += `,Day ${day}`;
        });
        csv += ',Present,Absent,Late,Holiday,Attendance %\n';

        displayedStudents.forEach(student => {
            const attendance = attendanceMap[student._id] || {};
            let present = 0, absent = 0, late = 0, holiday = 0;

            csv += `"${student.fullName}",${student.studentId}`;

            dayHeaders.forEach(day => {
                const record = attendance[day];
                if (record) {
                    csv += `,${record.status}`;
                    if (record.status === 'P') present++;
                    if (record.status === 'A') absent++;
                    if (record.status === 'L') late++;
                    if (record.status === 'H') holiday++;
                } else {
                    csv += `,`;
                }
            });

            const working = present + absent + late;
            const pct = working > 0 ? ((present + late) / working * 100).toFixed(1) : '0';
            csv += `,${present},${absent},${late},${holiday},${pct}%\n`;
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${selectedClass}_${months[selectedMonth - 1]}_${selectedYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusDisplay = (status?: 'P' | 'A' | 'L' | 'H') => {
        if (!status) return { text: '-', bg: 'bg-gray-50', color: 'text-gray-400' };
        switch (status) {
            case 'P': return { text: 'P', bg: 'bg-green-50', color: 'text-green-700' };
            case 'A': return { text: 'A', bg: 'bg-red-50', color: 'text-red-700' };
            case 'L': return { text: 'L', bg: 'bg-yellow-50', color: 'text-yellow-700' };
            case 'H': return { text: 'H', bg: 'bg-blue-50', color: 'text-blue-700' };
        }
    };

    const convertTo12Hour = (time24: string) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    if (loading && students.length === 0) {
        return (
            <AdminLayout title="View Attendance">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="View Attendance">
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 min-w-[200px]"
                            >
                                <option value="all">All Students</option>
                                {students.map(student => (
                                    <option key={student._id} value={student._id}>{student.fullName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="ml-auto">
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <CalendarTodayIcon className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Days</p>
                                <p className="text-xl font-bold text-gray-900">{summary.totalDays}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Present</p>
                                <p className="text-xl font-bold text-green-600">{summary.presentDays}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <CancelIcon className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Absent</p>
                                <p className="text-xl font-bold text-red-600">{summary.absentDays}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <AccessTimeIcon className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Late</p>
                                <p className="text-xl font-bold text-yellow-600">{summary.lateDays}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <span className="text-lg font-bold text-blue-600">%</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Attendance</p>
                                <p className="text-xl font-bold text-blue-600">{summary.attendancePercentage}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Grid (Read-only) */}
                {displayedStudents.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 border-b border-gray-300">
                                    <tr>
                                        <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300 min-w-[180px]">
                                            Student
                                        </th>
                                        {dayHeaders.map(day => (
                                            <th key={day} className="px-1 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-200 min-w-[70px]">
                                                {day}
                                            </th>
                                        ))}
                                        <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 min-w-[70px]">
                                            %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedStudents.map(student => {
                                        const attendance = attendanceMap[student._id] || {};
                                        let present = 0, absent = 0, late = 0, holiday = 0;

                                        Object.values(attendance).forEach(r => {
                                            if (r.status === 'P') present++;
                                            if (r.status === 'A') absent++;
                                            if (r.status === 'L') late++;
                                            if (r.status === 'H') holiday++;
                                        });

                                        const working = present + absent + late;
                                        const pct = working > 0 ? ((present + late) / working * 100).toFixed(1) : '0';

                                        return (
                                            <tr key={student._id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="sticky left-0 bg-white z-10 px-4 py-3 border-r border-gray-300">
                                                    <div className="font-medium text-gray-900 text-sm">{student.fullName}</div>
                                                    <div className="text-xs text-gray-500">{student.studentId}</div>
                                                </td>
                                                {dayHeaders.map(day => {
                                                    const record = attendance[day];
                                                    const display = getStatusDisplay(record?.status);

                                                    return (
                                                        <td
                                                            key={day}
                                                            className={`px-1 py-2 text-center border-r border-gray-200 ${display.bg} min-w-[70px]`}
                                                            title={record?.remarks || (record?.entryTime ? `IN: ${convertTo12Hour(record.entryTime)} | OUT: ${record.exitTime ? convertTo12Hour(record.exitTime) : '-'}` : '')}
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <span className={`text-sm font-bold ${display.color}`}>
                                                                    {display.text}
                                                                </span>

                                                                {/* Show times for Present/Late */}
                                                                {(record?.status === 'P' || record?.status === 'L') && record.entryTime && (
                                                                    <div className="flex flex-col text-[10px] leading-tight mt-1">
                                                                        <span className="text-green-700 whitespace-nowrap">
                                                                            In: {convertTo12Hour(record.entryTime)}
                                                                        </span>
                                                                        {record.exitTime && (
                                                                            <span className="text-orange-700 whitespace-nowrap">
                                                                                Out: {convertTo12Hour(record.exitTime)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`text-sm font-bold ${parseFloat(pct) >= 90 ? 'text-green-600' :
                                                        parseFloat(pct) >= 75 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                        {pct}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <p className="text-gray-500">No attendance data found</p>
                        <p className="text-gray-400 text-sm mt-2">Select a class and month to view attendance</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
