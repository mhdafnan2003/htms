'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ParentLayout from '@/components/parent/ParentLayout';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ReceiptIcon from '@mui/icons-material/Receipt';

interface FeePayment {
    _id: string;
    feeId: string;
    month: string;
    year: number;
    monthlyFee: number;
    amountPaid: number;
    discount: number;
    pendingAmount: number;
    status: 'PAID' | 'PARTIAL' | 'PENDING';
    paymentDate?: string;
    paymentMode?: string;
    remarks?: string;
}

export default function ParentFeesPage() {
    const [payments, setPayments] = useState<FeePayment[]>([]);
    const [monthlyFee, setMonthlyFee] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFees();

        // Listen for student changes
        const handleStudentChange = () => {
            fetchFees();
        };

        window.addEventListener('studentChanged', handleStudentChange);

        return () => {
            window.removeEventListener('studentChanged', handleStudentChange);
        };
    }, []);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const studentId = localStorage.getItem('selectedStudentId');

            if (!studentId) return;

            const response = await fetch(`/api/parent/fees?studentId=${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments || []);
                setMonthlyFee(data.monthlyFee || 0);
            }
        } catch (error) {
            console.error('Error fetching fees:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate summary
    const summary = useMemo(() => {
        const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        const totalPending = payments.reduce((sum, p) => sum + p.pendingAmount, 0);
        const totalDiscount = payments.reduce((sum, p) => sum + (p.discount || 0), 0);
        const paidMonths = payments.filter(p => p.status === 'PAID').length;
        const pendingMonths = payments.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL').length;

        return { totalPaid, totalPending, totalDiscount, paidMonths, pendingMonths };
    }, [payments]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700';
            case 'PARTIAL': return 'bg-yellow-100 text-yellow-700';
            case 'PENDING': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID': return <CheckCircleIcon className="text-green-500" style={{ fontSize: 20 }} />;
            case 'PARTIAL': return <PendingIcon className="text-yellow-500" style={{ fontSize: 20 }} />;
            case 'PENDING': return <PaymentIcon className="text-red-500" style={{ fontSize: 20 }} />;
            default: return null;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <ParentLayout title="Fee Details">
            <div className="space-y-6">
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-gray-500">Loading fees...</div>
                    </div>
                ) : (
                    <>
                        {/* Monthly Fee Info */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-100">Monthly Fee</p>
                                    <p className="text-4xl font-bold">{formatCurrency(monthlyFee)}</p>
                                </div>
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <PaymentIcon style={{ fontSize: 32 }} />
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                                <p className="text-sm text-green-600">Total Paid</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
                                <p className="text-sm text-red-600">Pending Amount</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPending)}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4">
                                <p className="text-sm text-purple-600">Total Discount</p>
                                <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalDiscount)}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                                <p className="text-sm text-blue-600">Months Paid/Pending</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    <span className="text-green-600">{summary.paidMonths}</span>
                                    {' / '}
                                    <span className="text-red-600">{summary.pendingMonths}</span>
                                </p>
                            </div>
                        </div>

                        {/* Payment History */}
                        {payments.length > 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Month</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Fee</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Discount</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Paid</th>
                                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Pending</th>
                                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Payment Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {payments.map((payment) => (
                                                <tr key={payment._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(payment.status)}
                                                            <span className="font-medium text-gray-900">
                                                                {payment.month} {payment.year}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-900">
                                                        {formatCurrency(payment.monthlyFee)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-purple-600">
                                                        {payment.discount > 0 ? `-${formatCurrency(payment.discount)}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                                                        {formatCurrency(payment.amountPaid)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                                                        {payment.pendingAmount > 0 ? formatCurrency(payment.pendingAmount) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <ReceiptIcon style={{ fontSize: 48 }} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No fee records available</p>
                            </div>
                        )}

                        {/* Pending Alert */}
                        {summary.totalPending > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <PaymentIcon className="text-red-500" />
                                    <div>
                                        <p className="font-medium text-red-800">Pending Fee Alert</p>
                                        <p className="text-sm text-red-600">
                                            You have a pending fee of {formatCurrency(summary.totalPending)}.
                                            Please contact the administration for payment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ParentLayout>
    );
}
