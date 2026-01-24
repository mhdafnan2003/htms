'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FilterListIcon from '@mui/icons-material/FilterList';

interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  classGrade: string;
  monthlyFeeAmount: number;
  contactNumber: string;
  parentName: string;
}

interface FeePayment {
  studentId: string;
  month: string;
  paidAmount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  transactionRef?: string;
  remarks?: string;
}

export default function CollectFeesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentData, setPaymentData] = useState<FeePayment>({
    studentId: '',
    month: selectedMonth,
    paidAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    transactionRef: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const openPaymentForm = (student: Student) => {
    setSelectedStudent(student);
    setPaymentData({
      studentId: student._id,
      month: selectedMonth,
      paidAmount: student.monthlyFeeAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
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
        
        // Reset form
        setPaymentData({
          studentId: '',
          month: selectedMonth,
          paidAmount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'CASH',
          transactionRef: '',
          remarks: ''
        });
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

  const getMonthName = (monthValue: string) => {
    const [year, month] = monthValue.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  if (loading) {
    return (
      <AdminLayout title="Collect Fees">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading students...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Collect Fees">
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by student name, ID, or parent name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - 6 + i);
                  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Students ({filteredStudents.length}) - {getMonthName(selectedMonth)}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <div key={student._id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {student.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {student.fullName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ID: {student.studentId} | Class: {student.classGrade}
                        </p>
                        <p className="text-sm text-gray-600">
                          Parent: {student.parentName} | {student.contactNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{student.monthlyFeeAmount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-gray-600">Monthly Fee</p>
                    </div>
                    
                    <button
                      onClick={() => openPaymentForm(student)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <PaymentIcon className="w-4 h-4" />
                      Collect Fee
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No students found matching your search' : 'No students found'}
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentForm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-90vh overflow-y-auto">
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
                  <p className="text-sm text-gray-600">ID: {selectedStudent.studentId}</p>
                  <p className="text-sm text-gray-600">Month: {getMonthName(selectedMonth)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Pay *
                  </label>
                  <input
                    type="number"
                    value={paymentData.paidAmount}
                    onChange={(e) => setPaymentData({ ...paymentData, paidAmount: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Monthly fee: ₹{selectedStudent.monthlyFeeAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={paymentData.remarks}
                    onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={processing || paymentData.paidAmount <= 0}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ReceiptIcon className="w-4 h-4" />
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