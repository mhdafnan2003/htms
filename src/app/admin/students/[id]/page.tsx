'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';

interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    gender: string;
    dob: string;
    dateOfBirth: string;
    class: string;
    classGrade: string;
    section?: string;
    rollNumber?: string;
    subjects: string[];
    phone: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    admissionDate: string;
    monthlyFee: number;
    status: string;
    schoolName?: string;
    bloodGroup?: string;
    medicalConditions?: string;
    parentRelation?: string;
    documents?: Array<{ name: string; url: string }>;
    parent: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        alternativePhone?: string;
    } | null;
}

export default function StudentProfile() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
            console.log('Student data received:', data.student);
            setStudent(data.student);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/students/${params.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete student');
            }

            alert('Student deleted successfully');
            router.push('/admin/students');
        } catch (err: any) {
            alert(err.message || 'Failed to delete student');
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Student Profile">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading student profile...</div>
                </div>
            </AdminLayout>
        );
    }

    if (error || !student) {
        return (
            <AdminLayout title="Student Profile">
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

    const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="text-blue-600 mt-1">{icon}</div>
            <div className="flex-1">
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-base font-medium text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );

    return (
        <AdminLayout title="Student Profile">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowBackIcon />
                        Back
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push(`/admin/students/edit/${student._id}?from=profile`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <EditIcon fontSize="small" />
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <DeleteIcon fontSize="small" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Student Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <SchoolIcon className="w-10 h-10 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{student.fullName}</h1>
                            <p className="text-gray-600 mt-1">Student ID: {student.studentId}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${student.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {student.status}
                                </span>
                                <span className="text-sm text-gray-600">Class {student.class}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PersonIcon className="text-blue-600" />
                            Personal Information
                        </h2>
                        <div className="space-y-3">
                            <InfoCard
                                icon={<PersonIcon fontSize="small" />}
                                label="Full Name"
                                value={student.fullName}
                            />
                            <InfoCard
                                icon={<PersonIcon fontSize="small" />}
                                label="Gender"
                                value={student.gender}
                            />
                            <InfoCard
                                icon={<CalendarTodayIcon fontSize="small" />}
                                label="Date of Birth"
                                value={new Date(student.dob).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            />
                            <InfoCard
                                icon={<PhoneIcon fontSize="small" />}
                                label="Phone Number"
                                value={student.phone || 'Not provided'}
                            />
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <SchoolIcon className="text-blue-600" />
                            Academic Information
                        </h2>
                        <div className="space-y-3">
                            <InfoCard
                                icon={<SchoolIcon fontSize="small" />}
                                label="Class"
                                value={`Class ${student.class}`}
                            />
                            {student.section && (
                                <InfoCard
                                    icon={<SchoolIcon fontSize="small" />}
                                    label="Section"
                                    value={student.section}
                                />
                            )}
                            {student.rollNumber && (
                                <InfoCard
                                    icon={<SchoolIcon fontSize="small" />}
                                    label="Roll Number"
                                    value={student.rollNumber}
                                />
                            )}
                            <InfoCard
                                icon={<CalendarTodayIcon fontSize="small" />}
                                label="Admission Date"
                                value={new Date(student.admissionDate).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            />
                            <InfoCard
                                icon={<PaymentIcon fontSize="small" />}
                                label="Monthly Fee"
                                value={`₹${student.monthlyFee.toLocaleString('en-IN')}`}
                            />
                            {student.schoolName && (
                                <InfoCard
                                    icon={<SchoolIcon fontSize="small" />}
                                    label="School Name"
                                    value={student.schoolName}
                                />
                            )}
                        </div>
                    </div>

                    {/* Parent/Guardian Information */}
                    {student.parent && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <PersonIcon className="text-blue-600" />
                                Parent/Guardian Information
                            </h2>
                            <div className="space-y-3">
                                <InfoCard
                                    icon={<PersonIcon fontSize="small" />}
                                    label="Name"
                                    value={student.parent.name}
                                />
                                <InfoCard
                                    icon={<EmailIcon fontSize="small" />}
                                    label="Email"
                                    value={student.parent.email}
                                />
                                <InfoCard
                                    icon={<PhoneIcon fontSize="small" />}
                                    label="Phone"
                                    value={student.parent.phone}
                                />
                                {student.parent.alternativePhone && (
                                    <InfoCard
                                        icon={<PhoneIcon fontSize="small" />}
                                        label="Alternative Phone"
                                        value={student.parent.alternativePhone}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Address Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <HomeIcon className="text-blue-600" />
                            Address Information
                        </h2>
                        <div className="space-y-3">
                            <InfoCard
                                icon={<HomeIcon fontSize="small" />}
                                label="Address"
                                value={student.address}
                            />
                            {student.city && (
                                <InfoCard
                                    icon={<HomeIcon fontSize="small" />}
                                    label="City"
                                    value={student.city}
                                />
                            )}
                            {student.state && (
                                <InfoCard
                                    icon={<HomeIcon fontSize="small" />}
                                    label="State"
                                    value={student.state}
                                />
                            )}
                            {student.pincode && (
                                <InfoCard
                                    icon={<HomeIcon fontSize="small" />}
                                    label="Pincode"
                                    value={student.pincode}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Subjects */}
                {(student.subjects && student.subjects.length > 0 || student.subjectsEnrolled && student.subjectsEnrolled.length > 0) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <SchoolIcon className="text-blue-600" />
                            Enrolled Subjects
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {(student.subjects || student.subjectsEnrolled || []).map((subject, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                >
                                    {subject}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Health & Additional Information */}
                {(student.bloodGroup || student.medicalConditions || student.email || student.parentRelation) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <PersonIcon className="text-blue-600" />
                                Health Information
                            </h2>
                            <div className="space-y-3">
                                {student.bloodGroup && (
                                    <InfoCard
                                        icon={<PersonIcon fontSize="small" />}
                                        label="Blood Group"
                                        value={student.bloodGroup}
                                    />
                                )}
                                {student.medicalConditions && (
                                    <InfoCard
                                        icon={<PersonIcon fontSize="small" />}
                                        label="Medical Conditions"
                                        value={student.medicalConditions}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <PersonIcon className="text-blue-600" />
                                Additional Information
                            </h2>
                            <div className="space-y-3">
                                {student.email && (
                                    <InfoCard
                                        icon={<EmailIcon fontSize="small" />}
                                        label="Student Email"
                                        value={student.email}
                                    />
                                )}
                                {student.parentRelation && (
                                    <InfoCard
                                        icon={<PersonIcon fontSize="small" />}
                                        label="Relation to Parent"
                                        value={student.parentRelation}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents */}
                {student.documents && student.documents.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <DescriptionIcon className="text-blue-600" />
                            Uploaded Documents
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {student.documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded text-blue-600">
                                            {doc.name.toLowerCase().endsWith('.pdf') ? 'PDF' :
                                                doc.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) ? 'IMG' : 'DOC'}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{doc.name}</span>
                                    </div>
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        View
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
