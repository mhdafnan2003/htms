'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

interface Exam {
    _id: string;
    examId: string;
    examName: string;
    classGrade: string;
    subject: string;
    totalMarks: number;
    examDate: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

const subjects = [
    'Mathematics',
    'English',
    'Science',
    'Social Studies',
    'Hindi',
    'Computer Science',
    'Physical Education',
    'Art & Craft'
];

export default function MarksPage() {
    const router = useRouter();
    const [exams, setExams] = useState<Exam[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedClass, setSelectedClass] = useState<string>('all');

    const [formData, setFormData] = useState({
        examName: '',
        classGrade: '',
        subject: subjects[0],
        totalMarks: 100,
        examDate: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (classes.length > 0) {
            fetchExams();
        }
    }, [selectedClass, classes]);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const uniqueClasses = [...new Set(data.students.map((s: any) => s.classGrade))].sort() as string[];
                setClasses(uniqueClasses);
                if (uniqueClasses.length > 0) {
                    setFormData(prev => ({ ...prev, classGrade: uniqueClasses[0] }));
                }
                // Fetch exams after classes are loaded
                fetchExams();
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            setLoading(false);
        }
    };

    const fetchExams = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (selectedClass !== 'all') params.append('class', selectedClass);

            const response = await fetch(`/api/marks/exams?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setExams(data.exams || []);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const createExam = async () => {
        if (!formData.examName || !formData.classGrade || !formData.subject) {
            alert('Please fill all required fields');
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/marks/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert(`Exam "${formData.examName}" created successfully!`);
                setShowForm(false);
                setFormData({
                    examName: '',
                    classGrade: classes[0] || '',
                    subject: subjects[0],
                    totalMarks: 100,
                    examDate: new Date().toISOString().split('T')[0],
                    description: ''
                });
                fetchExams();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error creating exam:', error);
            alert('Error creating exam. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const deleteExam = async (examId: string) => {
        if (!confirm('Are you sure you want to delete this exam? All marks will be deleted.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/marks/exams/${examId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Exam deleted successfully');
                fetchExams();
            } else {
                alert('Error deleting exam');
            }
        } catch (error) {
            console.error('Error deleting exam:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <AdminLayout title="Exams & Marks">
            <div className="space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
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
                        </div>

                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                        >
                            <AddIcon />
                            Create New Exam
                        </button>
                    </div>
                </div>

                {/* Exams List */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-gray-500">Loading exams...</div>
                    </div>
                ) : exams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exams.map(exam => (
                            <div key={exam._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <AssignmentIcon className="text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{exam.examName}</h3>
                                                <p className="text-sm text-gray-500">{exam.examId}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                exam.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {exam.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Class:</span>
                                            <span className="font-medium text-gray-900">{exam.classGrade}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Subject:</span>
                                            <span className="font-medium text-gray-900">{exam.subject}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Total Marks:</span>
                                            <span className="font-medium text-gray-900">{exam.totalMarks}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Date:</span>
                                            <span className="font-medium text-gray-900">{formatDate(exam.examDate)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
                                    <button
                                        onClick={() => router.push(`/admin/marks/add/${exam._id}`)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600"
                                    >
                                        <EditIcon style={{ fontSize: 16 }} />
                                        Add/Edit Marks
                                    </button>
                                    <button
                                        onClick={() => deleteExam(exam._id)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 text-sm rounded-lg"
                                    >
                                        <DeleteIcon style={{ fontSize: 16 }} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <AssignmentIcon style={{ fontSize: 48 }} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No exams found</p>
                        <p className="text-gray-400 text-sm mt-1">Click "Create New Exam" to add one</p>
                    </div>
                )}
            </div>

            {/* Create Exam Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Create New Exam</h3>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Exam Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.examName}
                                        onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                                        placeholder="e.g., Unit Test 1, Mid Term, Final Exam"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Class *
                                        </label>
                                        <select
                                            value={formData.classGrade}
                                            onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                                        >
                                            {classes.map(cls => (
                                                <option key={cls} value={cls}>{cls}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subject *
                                        </label>
                                        <select
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                                        >
                                            {subjects.map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Marks *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.totalMarks}
                                            onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Exam Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.examDate}
                                            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        placeholder="Any additional notes about this exam..."
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createExam}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <AddIcon style={{ fontSize: 18 }} />
                                    {processing ? 'Creating...' : 'Create Exam'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
