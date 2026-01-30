'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddIcon from '@mui/icons-material/Add';

interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    classGrade: string;
    monthlyFeeAmount: number;
    contactNumber: string;
    parentName: string;
}

interface YearMonthSelection {
    year: number;
    selectedMonths: string[];
}

export default function AddFeePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [amountType, setAmountType] = useState<'predefined' | 'custom'>('predefined');
    const [customAmount, setCustomAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');

    const [yearSelections, setYearSelections] = useState<YearMonthSelection[]>([
        { year: new Date().getFullYear(), selectedMonths: [] }
    ]);

    const [saveAndPrint, setSaveAndPrint] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = students.filter(student =>
                student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredStudents(filtered);
            setShowDropdown(true);
        } else {
            setFilteredStudents([]);
            setShowDropdown(false);
        }
    }, [searchTerm, students]);

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

    const selectStudent = (student: Student) => {
        setSelectedStudent(student);
        setSearchTerm(student.fullName);
        setShowDropdown(false);
        setCustomAmount(student.monthlyFeeAmount);
    };

    const toggleMonth = (yearIndex: number, monthIndex: number) => {
        const newYearSelections = [...yearSelections];
        const monthValue = String(monthIndex + 1).padStart(2, '0');

        if (newYearSelections[yearIndex].selectedMonths.includes(monthValue)) {
            newYearSelections[yearIndex].selectedMonths =
                newYearSelections[yearIndex].selectedMonths.filter(m => m !== monthValue);
        } else {
            newYearSelections[yearIndex].selectedMonths.push(monthValue);
        }

        setYearSelections(newYearSelections);
    };

    const addAnotherYear = () => {
        const lastYear = yearSelections[yearSelections.length - 1].year;
        setYearSelections([...yearSelections, { year: lastYear + 1, selectedMonths: [] }]);
    };

    const removeYear = (index: number) => {
        if (yearSelections.length > 1) {
            setYearSelections(yearSelections.filter((_, i) => i !== index));
        }
    };

    const calculateTotalAmount = () => {
        const totalMonths = yearSelections.reduce((sum, ys) => sum + ys.selectedMonths.length, 0);
        const amountPerMonth = amountType === 'predefined' && selectedStudent
            ? selectedStudent.monthlyFeeAmount
            : customAmount;
        return totalMonths * amountPerMonth;
    };

    const handleSubmit = async () => {
        if (!selectedStudent) {
            alert('Please select a student');
            return;
        }

        const selectedMonthsFormatted: string[] = [];
        yearSelections.forEach(ys => {
            ys.selectedMonths.forEach(month => {
                selectedMonthsFormatted.push(`${ys.year}-${month}`);
            });
        });

        if (selectedMonthsFormatted.length === 0) {
            alert('Please select at least one month');
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const amountPerMonth = amountType === 'predefined'
                ? selectedStudent.monthlyFeeAmount
                : customAmount;

            // Process payment for each month
            for (const month of selectedMonthsFormatted) {
                const response = await fetch('/api/fees/pay', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        studentId: selectedStudent._id,
                        month: month,
                        paidAmount: amountPerMonth,
                        paymentDate: new Date().toISOString().split('T')[0],
                        paymentMethod: paymentMethod,
                        remarks: `Fee payment for ${month}`
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Payment failed');
                }
            }

            alert(`Fee payment successful for ${selectedMonthsFormatted.length} month(s)!`);

            // Reset form
            setSelectedStudent(null);
            setSearchTerm('');
            setAmountType('predefined');
            setCustomAmount(0);
            setPaymentMethod('Cash');
            setYearSelections([{ year: new Date().getFullYear(), selectedMonths: [] }]);
            setSaveAndPrint(false);

        } catch (error: any) {
            console.error('Error processing payment:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Add Fee">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Add Fee">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="space-y-6">
                        {/* Student Search */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Student <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search and select student..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => searchTerm && setShowDropdown(true)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Dropdown */}
                            {showDropdown && filteredStudents.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredStudents.map((student) => (
                                        <div
                                            key={student._id}
                                            onClick={() => selectStudent(student)}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="font-medium text-gray-900">{student.fullName}</div>
                                            <div className="text-sm text-gray-600">
                                                ID: {student.studentId} | Class: {student.classGrade} | Fee: ₹{student.monthlyFeeAmount}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Amount Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Amount <span className="text-red-500">*</span>
                            </label>

                            <div className="space-y-3">
                                <div className="text-sm font-medium text-gray-700">Predefined Amounts</div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="amountType"
                                        checked={amountType === 'predefined'}
                                        onChange={() => setAmountType('predefined')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-gray-900">
                                        ₹{selectedStudent ? selectedStudent.monthlyFeeAmount : 0}
                                        {selectedStudent && <span className="text-sm text-gray-500 ml-1">(Monthly Fee)</span>}
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="amountType"
                                        checked={amountType === 'custom'}
                                        onChange={() => setAmountType('custom')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-gray-900">Custom Amount</span>
                                </label>

                                {amountType === 'custom' && (
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(Number(e.target.value))}
                                        placeholder="Enter custom amount"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="0"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Payment Method <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                {(['Cash', 'UPI', 'Bank Transfer'] as const).map((method) => (
                                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === method}
                                            onChange={() => setPaymentMethod(method)}
                                            className="w-4 h-4 text-green-600"
                                        />
                                        <span className="text-gray-900">{method}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Year-Month Selections */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Year-Month Selections
                            </label>

                            <div className="space-y-4">
                                {yearSelections.map((yearSelection, yearIndex) => (
                                    <div key={yearIndex} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <select
                                                value={yearSelection.year}
                                                onChange={(e) => {
                                                    const newYearSelections = [...yearSelections];
                                                    newYearSelections[yearIndex].year = Number(e.target.value);
                                                    setYearSelections(newYearSelections);
                                                }}
                                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {Array.from({ length: 51 }, (_, i) => 2000 + i).map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>

                                            {yearSelections.length > 1 && (
                                                <button
                                                    onClick={() => removeYear(yearIndex)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    Remove Year
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            {months.map((month, monthIndex) => (
                                                <label key={monthIndex} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={yearSelection.selectedMonths.includes(String(monthIndex + 1).padStart(2, '0'))}
                                                        onChange={() => toggleMonth(yearIndex, monthIndex)}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-900">{month}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addAnotherYear}
                                className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <AddIcon className="w-5 h-5" />
                                Add Another Year
                            </button>
                        </div>

                        {/* Total Amount Display */}
                        {selectedStudent && yearSelections.some(ys => ys.selectedMonths.length > 0) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">Total Amount:</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        ₹{calculateTotalAmount().toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {yearSelections.reduce((sum, ys) => sum + ys.selectedMonths.length, 0)} month(s) ×
                                    ₹{(amountType === 'predefined' ? selectedStudent.monthlyFeeAmount : customAmount).toLocaleString('en-IN')}
                                </div>
                            </div>
                        )}

                        {/* Save and Print */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={saveAndPrint}
                                    onChange={(e) => setSaveAndPrint(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-gray-900">Save and Print Receipt</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={processing || !selectedStudent || yearSelections.every(ys => ys.selectedMonths.length === 0)}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                <ReceiptIcon className="w-5 h-5" />
                                {processing ? 'Processing...' : 'Save Fee'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
