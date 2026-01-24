'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    gender: string;
    dob: string;
    classGrade: string;
    subjectsEnrolled: string[];
    secondaryMobile: string;
    address: string;
    admissionDate: string;
    monthlyFeeAmount: number;
    status: string;
    schoolName?: string;
    tutorAssigned?: string;
    documents?: Array<{ name: string; url: string }>;
    parent: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        alternativePhone?: string;
    } | null;
}

export default function EditStudent() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        gender: '',
        dob: '',
        classGrade: '',
        subjectsEnrolled: [] as string[],
        secondaryMobile: '',
        address: '',
        admissionDate: '',
        monthlyFeeAmount: 0,
        status: '',
        schoolName: '',
        tutorAssigned: ''
    });

    useEffect(() => {
        if (params.id) {
            fetchStudent(params.id as string);
        }
    }, [params.id]);

    const fetchStudent = async (id: string) => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/students/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch student');
            }

            const data = await response.json();
            const studentData = data.student;
            
            setStudent(studentData);
            
            // Set form data
            setFormData({
                fullName: studentData.fullName || '',
                gender: studentData.gender || '',
                dob: studentData.dob ? new Date(studentData.dob).toISOString().split('T')[0] : '',
                classGrade: studentData.classGrade || '',
                subjectsEnrolled: studentData.subjectsEnrolled || [],
                secondaryMobile: studentData.secondaryMobile || '',
                address: studentData.address || '',
                admissionDate: studentData.admissionDate ? new Date(studentData.admissionDate).toISOString().split('T')[0] : '',
                monthlyFeeAmount: studentData.monthlyFeeAmount || 0,
                status: studentData.status || '',
                schoolName: studentData.schoolName || '',
                tutorAssigned: studentData.tutorAssigned || ''
            });
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'subjectsEnrolled') {
            // Handle multi-select for subjects
            const selectedOptions = Array.from(
                (e.target as HTMLSelectElement).selectedOptions
            ).map(option => option.value);
            setFormData(prev => ({
                ...prev,
                [name]: selectedOptions
            }));
        } else if (name === 'monthlyFeeAmount') {
            setFormData(prev => ({
                ...prev,
                [name]: parseFloat(value) || 0
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('You must be logged in to update students');
            }

            const response = await fetch(`/api/students/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
                    admissionDate: formData.admissionDate ? new Date(formData.admissionDate).toISOString() : undefined
                }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to update student');
            }

            alert('Student updated successfully!');
            router.push(`/admin/students/${params.id}`);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setUpdating(false);
        }
    };

    const availableSubjects = [
        'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
        'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History',
        'Geography', 'Economics', 'Accountancy'
    ];

    if (loading) {
        return (
            <AdminLayout title="Edit Student">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading student data...</div>
                </div>
            </AdminLayout>
        );
    }

    if (error || !student) {
        return (
            <AdminLayout title="Edit Student">
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="text-lg text-red-600 mb-4">{error || 'Student not found'}</div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowBackIcon />
                        Go Back
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Edit Student">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowBackIcon />
                            Back
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                    Personal Information
                                </h3>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="secondaryMobile"
                                    value={formData.secondaryMobile}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="10-digit mobile number"
                                />
                            </div>

                            {/* Academic Information */}
                            <div className="md:col-span-2 mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                    Academic Information
                                </h3>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="classGrade"
                                    value={formData.classGrade}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Class</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(cls => (
                                        <option key={cls} value={cls.toString()}>Class {cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Admission Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="admissionDate"
                                    value={formData.admissionDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Monthly Fee (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="monthlyFeeAmount"
                                    value={formData.monthlyFeeAmount}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    School Name
                                </label>
                                <input
                                    type="text"
                                    name="schoolName"
                                    value={formData.schoolName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tutor Assigned
                                </label>
                                <input
                                    type="text"
                                    name="tutorAssigned"
                                    value={formData.tutorAssigned}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subjects Enrolled
                                </label>
                                <select
                                    name="subjectsEnrolled"
                                    value={formData.subjectsEnrolled}
                                    onChange={handleChange}
                                    multiple
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                                >
                                    {availableSubjects.map(subject => (
                                        <option key={subject} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Hold Ctrl/Cmd to select multiple subjects
                                </p>
                            </div>

                            {/* Other Information */}
                            <div className="md:col-span-2 mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                    Other Information
                                </h3>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="GRADUATED">Graduated</option>
                                </select>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={updating}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updating ? 'Updating...' : 'Update Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}