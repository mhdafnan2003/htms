'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface FeeRecord {
    _id: string;
    paymentId: string;
    receiptNumber: string;
    studentId: string;
    studentCode: string;
    studentName: string;
    classGrade: string;
    month: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionRef?: string;
    status: 'PAID' | 'PARTIAL' | 'PENDING';
    remarks?: string;
    createdAt: string;
}

interface Summary {
    totalRecords: number;
    totalCollected: number;
    totalPending: number;
    paidCount: number;
    partialCount: number;
    pendingCount: number;
}

export default function FeeHistoryPage() {
    const [records, setRecords] = useState<FeeRecord[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [startMonth, setStartMonth] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    const [endMonth, setEndMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<string[]>([]);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get unique classes from records
    useEffect(() => {
        const uniqueClasses = [...new Set(records.map(r => r.classGrade))].filter(c => c !== 'N/A').sort();
        setClasses(uniqueClasses);
    }, [records]);

    // Filter records by search term
    const filteredRecords = useMemo(() => {
        if (!searchTerm) return records;
        return records.filter(record =>
            record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.paymentId?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [records, searchTerm]);

    useEffect(() => {
        fetchHistory();
    }, [selectedClass, startMonth, endMonth, statusFilter]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (selectedClass !== 'all') params.append('class', selectedClass);
            if (startMonth) params.append('startMonth', startMonth);
            if (endMonth) params.append('endMonth', endMonth);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/fees/history?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setRecords(data.records || []);
                setSummary(data.summary || null);
            }
        } catch (error) {
            console.error('Error fetching fee history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMonthName = (monthValue: string) => {
        if (!monthValue) return 'N/A';
        const [year, month] = monthValue.split('-');
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircleIcon style={{ fontSize: 14 }} />
                        Paid
                    </span>
                );
            case 'PARTIAL':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <WarningIcon style={{ fontSize: 14 }} />
                        Partial
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        <AccessTimeIcon style={{ fontSize: 14 }} />
                        Pending
                    </span>
                );
        }
    };

    const exportToCSV = () => {
        let csv = 'Receipt No,Payment ID,Student Name,Student ID,Class,Month,Total Amount,Paid Amount,Balance,Status,Payment Date,Payment Method,Transaction Ref,Remarks\n';

        filteredRecords.forEach(record => {
            csv += `"${record.receiptNumber || ''}","${record.paymentId}","${record.studentName}","${record.studentCode}",`;
            csv += `"${record.classGrade}","${getMonthName(record.month)}",${record.totalAmount},${record.paidAmount},${record.balanceAmount},`;
            csv += `"${record.status}","${formatDate(record.paymentDate)}","${record.paymentMethod || ''}","${record.transactionRef || ''}","${record.remarks || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fee_history_${startMonth}_to_${endMonth}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading && records.length === 0) {
        return (
            <AdminLayout title="Fee History">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Fee History">
            <div className="space-y-4">
                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">Total Records</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.totalRecords}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                            <p className="text-sm text-green-600">Paid</p>
                            <p className="text-2xl font-bold text-green-600">{summary.paidCount}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
                            <p className="text-sm text-yellow-600">Partial</p>
                            <p className="text-2xl font-bold text-yellow-600">{summary.partialCount}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-4">
                            <p className="text-sm text-orange-600">Pending</p>
                            <p className="text-2xl font-bold text-orange-600">{summary.pendingCount}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                            <p className="text-sm text-blue-600">Collected</p>
                            <p className="text-xl font-bold text-blue-600">₹{summary.totalCollected.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
                            <p className="text-sm text-red-600">Pending Amt</p>
                            <p className="text-xl font-bold text-red-600">₹{summary.totalPending.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Name, ID, or Receipt..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Class Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                <option value="all">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>

                        {/* Start Month */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                            <input
                                type="month"
                                value={startMonth}
                                onChange={(e) => setStartMonth(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            />
                        </div>

                        {/* End Month */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                            <input
                                type="month"
                                value={endMonth}
                                onChange={(e) => setEndMonth(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                <option value="all">All Status</option>
                                <option value="PAID">Paid</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="PENDING">Pending</option>
                            </select>
                        </div>

                        {/* Export */}
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                            <DownloadIcon style={{ fontSize: 18 }} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Records Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Payment History ({filteredRecords.length} records)
                        </h2>
                    </div>

                    {filteredRecords.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Receipt</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Class</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Month</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Paid</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Balance</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Method</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredRecords.map((record) => (
                                        <tr key={record._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <ReceiptIcon style={{ fontSize: 16 }} className="text-gray-400" />
                                                    <span className="text-sm font-medium text-blue-600">{record.receiptNumber || record.paymentId}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{record.studentName}</p>
                                                    <p className="text-xs text-gray-500">{record.studentCode}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-sm">{record.classGrade}</td>
                                            <td className="px-4 py-3 text-gray-700 text-sm">{getMonthName(record.month)}</td>
                                            <td className="px-4 py-3 text-right text-gray-900 text-sm">
                                                ₹{record.totalAmount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-green-600 font-medium text-sm">
                                                ₹{record.paidAmount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-600 font-medium text-sm">
                                                ₹{record.balanceAmount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(record.status)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-sm">
                                                {formatDate(record.paymentDate)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-sm">
                                                {record.paymentMethod || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <ReceiptIcon style={{ fontSize: 48 }} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No payment records found</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
