'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';

interface StudentFee {
  _id: string;
  studentId: string;
  fullName: string;
  classGrade: string;
  monthlyFeeAmount: number;
  parentName: string;
  parentPhone: string;
  feeStatus: 'PAID' | 'PARTIAL' | 'NOT_PAID';
  paidAmount: number;
  balanceAmount: number;
  lastPaymentDate: string | null;
}

interface FeePayment {
  studentId: string;
  month: string;
  paidAmount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Online' | 'UPI' | 'Bank Transfer';
  transactionRef?: string;
  remarks?: string;
}

export default function CollectFeesPage() {
  const [students, setStudents] = useState<StudentFee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().getMonth() + 1; // 1-12
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear();
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<FeePayment>({
    studentId: '',
    month: '',
    paidAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    transactionRef: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);

  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Online', label: 'Online' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Bank Transfer', label: 'Bank Transfer' }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2000; // allow selecting from year 2000
    const endYear = 2050; // allow selecting up to year 2050
    const yearsArr: number[] = [];
    for (let y = startYear; y <= endYear; y++) yearsArr.push(y);
    return yearsArr.reverse();
  }, []);

  // Fetch system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/settings/system', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSystemSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Get unique classes from students
  useEffect(() => {
    const uniqueClasses = [...new Set(students.map(s => s.classGrade))].sort();
    setClasses(uniqueClasses);
  }, [students]);

  // Filter students based on all filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      const matchesSearch = !searchTerm ||
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Class filter
      const matchesClass = selectedClass === 'all' || student.classGrade === selectedClass;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'paid') {
        matchesStatus = student.feeStatus === 'PAID';
      } else if (statusFilter === 'partial') {
        matchesStatus = student.feeStatus === 'PARTIAL';
      } else if (statusFilter === 'unpaid') {
        matchesStatus = student.feeStatus === 'NOT_PAID';
      }

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchTerm, selectedClass, statusFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const paid = students.filter(s => s.feeStatus === 'PAID').length;
    const partial = students.filter(s => s.feeStatus === 'PARTIAL').length;
    const unpaid = students.filter(s => s.feeStatus === 'NOT_PAID').length;
    const totalCollected = students.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalPending = students.reduce((sum, s) => sum + s.balanceAmount, 0);
    return { paid, partial, unpaid, totalCollected, totalPending };
  }, [students]);

  useEffect(() => {
    fetchFeeStatus();
  }, [selectedMonth, selectedYear]);

  const fetchFeeStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const monthValue = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const response = await fetch(`/api/fees/status?month=${monthValue}`, {
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

  const openPaymentForm = (student: StudentFee) => {
    setSelectedStudent(student);
    const monthValue = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    setPaymentData({
      studentId: student._id,
      month: monthValue,
      paidAmount: student.balanceAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      transactionRef: '',
      remarks: ''
    });
    setShowPaymentForm(true);
  };

  const processPayment = async () => {
    if (!selectedStudent) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/fees/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();

        alert(`Payment processed successfully! Receipt Number: ${result.receiptNumber}`);

        setShowPaymentForm(false);
        setSelectedStudent(null);
        fetchFeeStatus(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadReceipt = (student: StudentFee) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      alert('Please allow popups to download receipt');
      return;
    }

    const institutionName = systemSettings?.schoolName || 'STUDENT TUITION MANAGEMENT';
    const logoUrl = systemSettings?.logoUrl || '';
    const receiptNumber = `RCP-${student.studentId}-${selectedYear}${String(selectedMonth).padStart(2, '0')}`;
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${receiptNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .receipt-container {
            border: 2px solid #333;
            padding: 30px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
          }
          .header-content {
            flex: 1;
          }
          .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
          }
          .header h1 {
            margin: 0;
            color: #2563eb;
          }
          .header h2 {
            margin: 5px 0 0 0;
            color: #1e40af;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-section {
            flex: 1;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            margin-bottom: 10px;
          }
          .payment-details {
            margin: 30px 0;
            border: 1px solid #ddd;
            padding: 20px;
            background-color: #f9fafb;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #ddd;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            font-size: 1.2em;
            font-weight: bold;
            border-top: 2px solid #333;
            margin-top: 10px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            border-top: 2px solid #333;
            padding-top: 20px;
          }
          .print-button {
            background-color: #2563eb;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0;
          }
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="logo">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : `
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 10L35 20H25L30 10Z" fill="white"/>
                <rect x="20" y="20" width="20" height="25" fill="white"/>
                <path d="M15 45H45L40 50H20L15 45Z" fill="white"/>
                <circle cx="30" cy="32" r="4" fill="#2563eb"/>
              </svg>
              `}
            </div>
            <div class="header-content">
              <h1>${institutionName}</h1>
              <h2>FEE RECEIPT</h2>
            </div>
          </div>

          <div class="receipt-info">
            <div class="info-section">
              <div class="info-value">
                <span class="info-label">Receipt No:</span> ${receiptNumber}
              </div>
              <div class="info-value">
                <span class="info-label">Receipt Date:</span> ${student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
              </div>
            </div>

            <div class="info-section">
              <div class="info-value">
                <span class="info-label">Student Name:</span> ${student.fullName}
              </div>
              <div style="display: flex; gap: 30px;">
                <div class="info-value" style="flex: 1;">
                  <span class="info-label">Phone:</span> ${student.parentPhone}
                </div>
                <div class="info-value" style="flex: 1;">
                  <span class="info-label">Class:</span> ${student.classGrade}
                </div>
              </div>
            </div>
          </div>

          <div class="payment-details">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <div class="amount-row">
              <span>Fee for ${getMonthName()}</span>
              <span>₹${student.monthlyFeeAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="amount-row">
              <span>Amount Paid</span>
              <span>₹${student.paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="total-row">
              <span>Total Paid</span>
              <span>₹${student.paidAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for your payment!</strong></p>
          </div>
        </div>

        <div style="text-align: center;">
          <button class="print-button" onclick="window.print()">Print Receipt</button>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  const getMonthName = () => {
    return `${months[selectedMonth - 1]} ${selectedYear}`;
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
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <CancelIcon style={{ fontSize: 14 }} />
            Not Paid
          </span>
        );
    }
  };

  if (loading && students.length === 0) {
    return (
      <AdminLayout title="Collect Fees">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Collect Fees">
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
            <p className="text-sm text-green-600">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
            <p className="text-sm text-yellow-600">Partial</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
            <p className="text-sm text-red-600">Unpaid</p>
            <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
            <p className="text-sm text-blue-600">Collected</p>
            <p className="text-xl font-bold text-blue-600">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
          </div>
        </div>

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
                  placeholder="Name, ID, or Parent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Month Filter */}
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

            {/* Year Filter */}
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

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partially Paid</option>
                <option value="unpaid">Not Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Students ({filteredStudents.length}) - {getMonthName()}
            </h2>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Class</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Fee Amount</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Paid</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Balance</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Payment Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {student.fullName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.fullName}</p>
                            <p className="text-xs text-gray-500">{student.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{student.classGrade}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ₹{student.monthlyFeeAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">
                        ₹{student.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">
                        ₹{student.balanceAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(student.feeStatus)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.feeStatus !== 'PAID' ? (
                          <button
                            onClick={() => openPaymentForm(student)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                          >
                            <PaymentIcon style={{ fontSize: 16 }} />
                            Collect
                          </button>
                        ) : (
                          <button
                            onClick={() => downloadReceipt(student)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                          >
                            <ReceiptIcon style={{ fontSize: 16 }} />
                            Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No students found matching your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentForm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Collect Fee Payment</h3>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedStudent.fullName}</p>
                  <p className="text-sm text-gray-600">ID: {selectedStudent.studentId} | Class: {selectedStudent.classGrade}</p>
                  <p className="text-sm text-gray-600">Month: {getMonthName()}</p>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>Total Fee: ₹{selectedStudent.monthlyFeeAmount.toLocaleString('en-IN')}</span>
                    <span className="text-red-600">Balance: ₹{selectedStudent.balanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Pay *
                  </label>
                  <input
                    type="number"
                    value={paymentData.paidAmount}
                    onChange={(e) => setPaymentData({ ...paymentData, paidAmount: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    min="0"
                    max={selectedStudent.balanceAmount}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={paymentData.transactionRef}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionRef: e.target.value })}
                    placeholder="Transaction ID, Cheque number, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={paymentData.remarks}
                    onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={processing || paymentData.paidAmount <= 0}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ReceiptIcon style={{ fontSize: 18 }} />
                  {processing ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}