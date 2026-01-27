'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useRouter } from 'next/navigation';

interface StudentFormData {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    class: string;
    section: string;
    rollNumber: string;
    admissionDate: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    parentAlternativePhone: string;
    parentRelation: string;
    monthlyFee: number;
    subjects: string[];
    bloodGroup: string;
    medicalConditions: string;
}

export default function NewAdmission() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [formData, setFormData] = useState<StudentFormData>({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        class: '',
        section: '',
        rollNumber: '',
        admissionDate: new Date().toISOString().split('T')[0],
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        parentAlternativePhone: '',
        parentRelation: 'Father',
        monthlyFee: 0,
        subjects: [],
        bloodGroup: '',
        medicalConditions: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            subjects: checked
                ? [...prev.subjects, value]
                : prev.subjects.filter(s => s !== value)
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('You must be logged in to admit students');
            }

            const data = new FormData();
            
            // Append form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => data.append(`${key}[]`, item));
                } else {
                    data.append(key, value.toString());
                }
            });

            console.log('FormData being sent:', {
                section: formData.section,
                rollNumber: formData.rollNumber,
                email: formData.email,
                bloodGroup: formData.bloodGroup,
                medicalConditions: formData.medicalConditions,
                parentRelation: formData.parentRelation,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
            });

            // Append files
            selectedFiles.forEach(file => {
                data.append('documents', file);
            });

            const response = await fetch('/api/students/admit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to admit student');
            }

            alert('Student admitted successfully!');
            router.push('/admin/admission/list');
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const availableSubjects = [
        'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
        'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History',
        'Geography', 'Economics', 'Accountancy'
    ];

    return (
        <AdminLayout title="New Student Admission">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Admission Form</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        Date of Birth <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
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
                                        Blood Group
                                    </label>
                                    <select
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        pattern="[0-9]{10}"
                                        placeholder="10-digit mobile number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Medical Conditions (if any)
                                    </label>
                                    <textarea
                                        name="medicalConditions"
                                        value={formData.medicalConditions}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Address Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pincode <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        required
                                        pattern="[0-9]{6}"
                                        placeholder="6-digit pincode"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parent/Guardian Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Parent/Guardian Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Parent/Guardian Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="parentName"
                                        value={formData.parentName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Relation <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="parentRelation"
                                        value={formData.parentRelation}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Guardian">Guardian</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Parent Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="parentPhone"
                                        value={formData.parentPhone}
                                        onChange={handleChange}
                                        required
                                        pattern="[0-9]{10}"
                                        placeholder="10-digit mobile number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alternative Phone Number (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        name="parentAlternativePhone"
                                        value={formData.parentAlternativePhone}
                                        onChange={handleChange}
                                        pattern="[0-9]{10}"
                                        placeholder="10-digit mobile number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Parent Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="parentEmail"
                                        value={formData.parentEmail}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Academic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Class <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="class"
                                        value={formData.class}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Class</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(cls => (
                                            <option key={cls} value={cls}>Class {cls}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Section
                                    </label>
                                    <input
                                        type="text"
                                        name="section"
                                        value={formData.section}
                                        onChange={handleChange}
                                        placeholder="e.g., A, B, C"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Roll Number
                                    </label>
                                    <input
                                        type="text"
                                        name="rollNumber"
                                        value={formData.rollNumber}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
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
                                        name="monthlyFee"
                                        value={formData.monthlyFee}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subjects <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {availableSubjects.map(subject => (
                                            <label key={subject} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    value={subject}
                                                    checked={formData.subjects.includes(subject)}
                                                    onChange={handleSubjectChange}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">{subject}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Documents Upload (Images, PDFs)
                                    </label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                                        <div className="space-y-1 text-center">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                stroke="currentColor"
                                                fill="none"
                                                viewBox="0 0 48 48"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label
                                                    htmlFor="file-upload"
                                                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                                >
                                                    <span>Upload files</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG, PDF up to 10MB
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {selectedFiles.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                                                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Admitting...' : 'Admit Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
