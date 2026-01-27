'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter, useParams } from 'next/navigation';

interface Exam {
    _id: string;
    examId: string;
    examName: string;
    classGrade: string;
    subject: string;
    totalMarks: number;
    examDate: string;
    status: string;
}

interface StudentResult {
    studentId: string;
    studentCode: string;
    fullName: string;
    section: string;
    obtainedMarks: number | null;
    percentage: number | null;
    grade: string | null;
    remarks: string;
    hasResult: boolean;
}

interface MarksEntry {
    studentId: string;
    obtainedMarks: number;
    remarks: string;
}

export default function AddMarksPage() {
    const router = useRouter();
    const params = useParams();
    const examId = params?.id as string;

    const [exam, setExam] = useState<Exam | null>(null);
    const [students, setStudents] = useState<StudentResult[]>([]);
    const [marksEntries, setMarksEntries] = useState<Map<string, MarksEntry>>(new Map());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(s =>
            s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    // Summary stats
    const stats = useMemo(() => {
        const total = students.length;
        const entered = Array.from(marksEntries.values()).filter(m => m.obtainedMarks >= 0).length;
        return { total, entered, pending: total - entered };
    }, [students, marksEntries]);

    useEffect(() => {
        fetchExamData();
    }, [examId]);

    const fetchExamData = async () => {
        if (!examId) {
            console.error('No examId provided');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching exam:', examId);

            const response = await fetch(`/api/marks/exams/${examId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Exam data:', data);
                setExam(data.exam);
                setStudents(data.students || []);

                // Initialize marks entries from existing data
                const entries = new Map<string, MarksEntry>();
                data.students.forEach((s: StudentResult) => {
                    if (s.hasResult) {
                        entries.set(s.studentId, {
                            studentId: s.studentId,
                            obtainedMarks: s.obtainedMarks ?? 0,
                            remarks: s.remarks || ''
                        });
                    }
                });
                setMarksEntries(entries);
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(`Error: ${errorData.message || 'Exam not found'}`);
                router.push('/admin/marks');
            }
        } catch (error) {
            console.error('Error fetching exam data:', error);
            alert('Error connecting to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateMarks = (studentId: string, obtainedMarks: number) => {
        const newEntries = new Map(marksEntries);
        const existing = newEntries.get(studentId) || { studentId, obtainedMarks: 0, remarks: '' };
        newEntries.set(studentId, { ...existing, obtainedMarks });
        setMarksEntries(newEntries);
        setHasChanges(true);
    };

    const updateRemarks = (studentId: string, remarks: string) => {
        const newEntries = new Map(marksEntries);
        const existing = newEntries.get(studentId) || { studentId, obtainedMarks: 0, remarks: '' };
        newEntries.set(studentId, { ...existing, remarks });
        setMarksEntries(newEntries);
        setHasChanges(true);
    };

    const getGradeInfo = (marks: number | null, totalMarks: number) => {
        if (marks === null || marks < 0) return { grade: '-', color: 'text-gray-400', percentage: 0 };
        const percentage = totalMarks > 0 ? (marks / totalMarks * 100) : 0;

        if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', percentage };
        if (percentage >= 80) return { grade: 'A', color: 'text-green-600', percentage };
        if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600', percentage };
        if (percentage >= 60) return { grade: 'B', color: 'text-blue-600', percentage };
        if (percentage >= 50) return { grade: 'C+', color: 'text-yellow-600', percentage };
        if (percentage >= 40) return { grade: 'C', color: 'text-yellow-600', percentage };
        if (percentage >= 33) return { grade: 'D', color: 'text-orange-600', percentage };
        return { grade: 'F', color: 'text-red-600', percentage };
    };

    const saveAllMarks = async () => {
        if (marksEntries.size === 0) {
            alert('Please enter marks for at least one student');
            return;
        }

        // Validate marks
        for (const entry of marksEntries.values()) {
            if (entry.obtainedMarks < 0 || entry.obtainedMarks > (exam?.totalMarks || 0)) {
                alert(`Invalid marks entered. Marks should be between 0 and ${exam?.totalMarks}`);
                return;
            }
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const results = Array.from(marksEntries.values());

            const response = await fetch(`/api/marks/exams/${examId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ results })
            });

            if (response.ok) {
                alert(`Marks saved successfully for ${results.length} students!`);
                setHasChanges(false);
                fetchExamData(); // Refresh data
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error saving marks:', error);
            alert('Error saving marks. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <AdminLayout title="Add Marks">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading exam data...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!exam) {
        return (
            <AdminLayout title="Add Marks">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-500">Exam not found</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={`Add Marks - ${exam.examName}`}>
            <div className="space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/admin/marks')}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <ArrowBackIcon />
                            </button>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{exam.examName}</h2>
                                <p className="text-sm text-gray-500">
                                    {exam.subject} | Class {exam.classGrade} | Total Marks: {exam.totalMarks} | {formatDate(exam.examDate)}
                                </p>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                        <p className="text-sm text-gray-500">Total Students</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4 text-center">
                        <p className="text-sm text-green-600">Marks Entered</p>
                        <p className="text-2xl font-bold text-green-600">{stats.entered}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4 text-center">
                        <p className="text-sm text-yellow-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                    </div>
                </div>

                {/* Marks Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">#</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Section</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                        Marks (out of {exam.totalMarks})
                                    </th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Percentage</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Grade</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredStudents.map((student, idx) => {
                                    const entry = marksEntries.get(student.studentId);
                                    const marks = entry?.obtainedMarks ?? student.obtainedMarks;
                                    const gradeInfo = getGradeInfo(marks, exam.totalMarks);

                                    return (
                                        <tr key={student.studentId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{student.fullName}</p>
                                                    <p className="text-xs text-gray-500">{student.studentCode}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{student.section || '-'}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={marks ?? ''}
                                                    onChange={(e) => updateMarks(student.studentId, Number(e.target.value))}
                                                    placeholder="Enter marks"
                                                    min="0"
                                                    max={exam.totalMarks}
                                                    className="w-24 mx-auto block border border-gray-300 rounded-lg px-3 py-2 text-center text-gray-900"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-medium ${marks !== null && marks >= 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {marks !== null && marks >= 0 ? `${Math.round(gradeInfo.percentage * 10) / 10}%` : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold text-lg ${gradeInfo.color}`}>
                                                    {gradeInfo.grade}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={entry?.remarks ?? student.remarks ?? ''}
                                                    onChange={(e) => updateRemarks(student.studentId, e.target.value)}
                                                    placeholder="Optional remarks"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Save Action */}
                <div className="flex justify-end bg-white p-4 rounded-lg border border-gray-200 shadow-sm mt-4">
                    <button
                        onClick={saveAllMarks}
                        disabled={saving || !hasChanges}
                        className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                        <SaveIcon />
                        {saving ? 'Saving...' : 'Save All Marks'}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
