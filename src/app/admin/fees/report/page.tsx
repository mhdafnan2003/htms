'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';

interface StudentFee {
    _id: string;
    studentId: string;
    fullName: string;
    classGrade: string;
    monthlyFeeAmount: number;
    feeStatus: 'PAID' | 'PARTIAL' | 'NOT_PAID';
    paidAmount: number;
    balanceAmount: number;
}

interface ClassSummary {
    classGrade: string;
    totalStudents: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
}

export default function FeeReportPage() {
    const [students, setStudents] = useState<StudentFee[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [loading, setLoading] = useState(true);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Overall summary
    const overallSummary = useMemo(() => {
        const totalStudents = students.length;
        const paidCount = students.filter(s => s.feeStatus === 'PAID').length;
        const partialCount = students.filter(s => s.feeStatus === 'PARTIAL').length;
        const unpaidCount = students.filter(s => s.feeStatus === 'NOT_PAID').length;
        const totalExpected = students.reduce((sum, s) => sum + s.monthlyFeeAmount, 0);
        const totalCollected = students.reduce((sum, s) => sum + s.paidAmount, 0);
        const totalPending = students.reduce((sum, s) => sum + s.balanceAmount, 0);
        const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected * 100) : 0;

        return {
            totalStudents,
            paidCount,
            partialCount,
            unpaidCount,
            totalExpected,
            totalCollected,
            totalPending,
            collectionRate: Math.round(collectionRate * 10) / 10
        };
    }, [students]);

    // Class-wise summary
    const classSummaries = useMemo((): ClassSummary[] => {
        const classMap = new Map<string, StudentFee[]>();

        students.forEach(student => {
            const cls = student.classGrade;
            if (!classMap.has(cls)) classMap.set(cls, []);
            classMap.get(cls)!.push(student);
        });

        const summaries: ClassSummary[] = [];
        classMap.forEach((classStudents, classGrade) => {
            const paidCount = classStudents.filter(s => s.feeStatus === 'PAID').length;
            const partialCount = classStudents.filter(s => s.feeStatus === 'PARTIAL').length;
            const unpaidCount = classStudents.filter(s => s.feeStatus === 'NOT_PAID').length;
            const totalExpected = classStudents.reduce((sum, s) => sum + s.monthlyFeeAmount, 0);
            const totalCollected = classStudents.reduce((sum, s) => sum + s.paidAmount, 0);
            const totalPending = classStudents.reduce((sum, s) => sum + s.balanceAmount, 0);
            const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected * 100) : 0;

            summaries.push({
                classGrade,
                totalStudents: classStudents.length,
                paidCount,
                partialCount,
                unpaidCount,
                totalExpected,
                totalCollected,
                totalPending,
                collectionRate: Math.round(collectionRate * 10) / 10
            });
        });

        return summaries.sort((a, b) => a.classGrade.localeCompare(b.classGrade));
    }, [students]);

    // Defaulters list (unpaid or partial)
    const defaulters = useMemo(() => {
        return students
            .filter(s => s.feeStatus !== 'PAID')
            .sort((a, b) => b.balanceAmount - a.balanceAmount);
    }, [students]);

    useEffect(() => {
        fetchFeeStatus();
    }, [selectedMonth]);

    const fetchFeeStatus = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/fees/status?month=${selectedMonth}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
            }
        } catch (error) {
            console.error('Error fetching fee status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (monthValue: string) => {
        const [year, month] = monthValue.split('-');
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    const exportReport = () => {
        // Export class-wise summary
        let csv = `Fee Report - ${getMonthName(selectedMonth)}\n\n`;
        csv += 'OVERALL SUMMARY\n';
        csv += `Total Students,${overallSummary.totalStudents}\n`;
        csv += `Paid,${overallSummary.paidCount}\n`;
        csv += `Partial,${overallSummary.partialCount}\n`;
        csv += `Unpaid,${overallSummary.unpaidCount}\n`;
        csv += `Total Expected,₹${overallSummary.totalExpected}\n`;
        csv += `Total Collected,₹${overallSummary.totalCollected}\n`;
        csv += `Total Pending,₹${overallSummary.totalPending}\n`;
        csv += `Collection Rate,${overallSummary.collectionRate}%\n\n`;

        csv += 'CLASS-WISE SUMMARY\n';
        csv += 'Class,Students,Paid,Partial,Unpaid,Expected,Collected,Pending,Collection %\n';
        classSummaries.forEach(cls => {
            csv += `${cls.classGrade},${cls.totalStudents},${cls.paidCount},${cls.partialCount},${cls.unpaidCount},`;
            csv += `${cls.totalExpected},${cls.totalCollected},${cls.totalPending},${cls.collectionRate}%\n`;
        });

        csv += '\nDEFAULTERS LIST\n';
        csv += 'Student Name,Student ID,Class,Fee Amount,Paid,Balance,Status\n';
        defaulters.forEach(d => {
            csv += `"${d.fullName}",${d.studentId},${d.classGrade},${d.monthlyFeeAmount},${d.paidAmount},${d.balanceAmount},${d.feeStatus}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fee_report_${selectedMonth}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading && students.length === 0) {
        return (
            <AdminLayout title="Fee Report">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Fee Report">
            <div className="space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                                >
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const date = new Date();
                                        date.setMonth(date.getMonth() - 6 + i);
                                        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                        const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
                                        return <option key={value} value={value}>{label}</option>;
                                    })}
                                </select>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Fee Report - {getMonthName(selectedMonth)}
                            </h2>
                        </div>

                        <button
                            onClick={exportReport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                            <DownloadIcon style={{ fontSize: 18 }} />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Overall Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-5 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <PeopleIcon />
                            </div>
                            <span className="text-sm font-medium opacity-90">Total Students</span>
                        </div>
                        <p className="text-3xl font-bold">{overallSummary.totalStudents}</p>
                        <p className="text-sm opacity-80 mt-1">
                            {overallSummary.paidCount} paid • {overallSummary.unpaidCount} unpaid
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-5 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingUpIcon />
                            </div>
                            <span className="text-sm font-medium opacity-90">Collected</span>
                        </div>
                        <p className="text-3xl font-bold">₹{overallSummary.totalCollected.toLocaleString('en-IN')}</p>
                        <p className="text-sm opacity-80 mt-1">{overallSummary.collectionRate}% collection rate</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-sm p-5 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingDownIcon />
                            </div>
                            <span className="text-sm font-medium opacity-90">Pending</span>
                        </div>
                        <p className="text-3xl font-bold">₹{overallSummary.totalPending.toLocaleString('en-IN')}</p>
                        <p className="text-sm opacity-80 mt-1">{overallSummary.partialCount + overallSummary.unpaidCount} defaulters</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-5 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <AccountBalanceIcon />
                            </div>
                            <span className="text-sm font-medium opacity-90">Expected</span>
                        </div>
                        <p className="text-3xl font-bold">₹{overallSummary.totalExpected.toLocaleString('en-IN')}</p>
                        <p className="text-sm opacity-80 mt-1">Total fee for month</p>
                    </div>
                </div>

                {/* Class-wise Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Class-wise Summary</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Class</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Students</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-green-600">Paid</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-yellow-600">Partial</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-red-600">Unpaid</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Expected</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Collected</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Pending</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Collection %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {classSummaries.map((cls) => (
                                    <tr key={cls.classGrade} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{cls.classGrade}</td>
                                        <td className="px-4 py-3 text-center text-gray-700">{cls.totalStudents}</td>
                                        <td className="px-4 py-3 text-center text-green-600 font-medium">{cls.paidCount}</td>
                                        <td className="px-4 py-3 text-center text-yellow-600 font-medium">{cls.partialCount}</td>
                                        <td className="px-4 py-3 text-center text-red-600 font-medium">{cls.unpaidCount}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">₹{cls.totalExpected.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">₹{cls.totalCollected.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-right text-red-600 font-medium">₹{cls.totalPending.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${cls.collectionRate >= 90 ? 'bg-green-100 text-green-700' :
                                                    cls.collectionRate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {cls.collectionRate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                <tr>
                                    <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{overallSummary.totalStudents}</td>
                                    <td className="px-4 py-3 text-center font-bold text-green-600">{overallSummary.paidCount}</td>
                                    <td className="px-4 py-3 text-center font-bold text-yellow-600">{overallSummary.partialCount}</td>
                                    <td className="px-4 py-3 text-center font-bold text-red-600">{overallSummary.unpaidCount}</td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{overallSummary.totalExpected.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">₹{overallSummary.totalCollected.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600">₹{overallSummary.totalPending.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-center font-bold text-blue-600">{overallSummary.collectionRate}%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Defaulters List */}
                {defaulters.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-red-200 bg-red-50 flex items-center gap-2">
                            <WarningIcon className="text-red-500" />
                            <h3 className="text-lg font-semibold text-red-700">Defaulters List ({defaulters.length})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">#</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Class</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Fee Amount</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Paid</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Balance Due</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {defaulters.slice(0, 20).map((student, idx) => (
                                        <tr key={student._id} className="hover:bg-red-50">
                                            <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{student.fullName}</p>
                                                    <p className="text-xs text-gray-500">{student.studentId}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{student.classGrade}</td>
                                            <td className="px-4 py-3 text-right text-gray-900">₹{student.monthlyFeeAmount.toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-3 text-right text-green-600">₹{student.paidAmount.toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-3 text-right font-bold text-red-600">₹{student.balanceAmount.toLocaleString('en-IN')}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${student.feeStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {student.feeStatus === 'PARTIAL' ? 'Partial' : 'Not Paid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {defaulters.length > 20 && (
                                <div className="px-4 py-3 bg-gray-50 text-center text-gray-500 text-sm">
                                    Showing top 20 defaulters. Export report to see all {defaulters.length} defaulters.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
