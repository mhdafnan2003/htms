'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PersonIcon from '@mui/icons-material/Person';

interface Student {
    _id: string;
    studentId: string;
    fullName: string;
    classGrade: string;
}

interface ExamResult {
    examId: string;
    examName: string;
    subject: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    examDate: string;
}

interface StudentProgress {
    student: Student;
    results: ExamResult[];
    avgPercentage: number;
    trend: 'up' | 'down' | 'stable';
}

export default function ProgressReportPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(false);

    // Filter students by search
    const filteredStudents = useMemo(() => {
        let filtered = students;
        if (selectedClass !== 'all') {
            filtered = filtered.filter(s => s.classGrade === selectedClass);
        }
        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [students, searchTerm, selectedClass]);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentProgress();
        }
    }, [selectedStudent]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);

                // Get unique classes
                const uniqueClasses = [...new Set(data.students.map((s: Student) => s.classGrade))].sort() as string[];
                setClasses(uniqueClasses);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentProgress = async () => {
        if (!selectedStudent) return;

        setLoadingProgress(true);
        try {
            const token = localStorage.getItem('token');

            // Get all exams
            const examsResponse = await fetch('/api/marks/exams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!examsResponse.ok) return;

            const examsData = await examsResponse.json();
            const allExams = examsData.exams || [];

            // Find the student
            const student = students.find(s => s._id === selectedStudent);
            if (!student) return;

            // Filter exams for student's class
            const classExams = allExams.filter((e: any) => e.classGrade === student.classGrade);

            // Fetch results for each exam
            const results: ExamResult[] = [];

            for (const exam of classExams) {
                const resultResponse = await fetch(`/api/marks/exams/${exam._id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resultResponse.ok) {
                    const resultData = await resultResponse.json();
                    const studentResult = resultData.students.find((s: any) =>
                        s.studentId === selectedStudent && s.hasResult
                    );

                    if (studentResult) {
                        results.push({
                            examId: exam._id,
                            examName: exam.examName,
                            subject: exam.subject,
                            totalMarks: exam.totalMarks,
                            obtainedMarks: studentResult.obtainedMarks,
                            percentage: studentResult.percentage,
                            grade: studentResult.grade,
                            examDate: exam.examDate
                        });
                    }
                }
            }

            // Sort by date
            results.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

            // Calculate average and trend
            const avgPercentage = results.length > 0
                ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
                : 0;

            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (results.length >= 2) {
                const recent = results.slice(-2);
                if (recent[1].percentage > recent[0].percentage + 5) trend = 'up';
                else if (recent[1].percentage < recent[0].percentage - 5) trend = 'down';
            }

            setStudentProgress({
                student,
                results,
                avgPercentage: Math.round(avgPercentage * 10) / 10,
                trend
            });
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setLoadingProgress(false);
        }
    };

    const getGradeColor = (grade: string) => {
        if (['A+', 'A'].includes(grade)) return 'text-green-600 bg-green-100';
        if (['B+', 'B'].includes(grade)) return 'text-blue-600 bg-blue-100';
        if (['C+', 'C'].includes(grade)) return 'text-yellow-600 bg-yellow-100';
        if (grade === 'D') return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const exportReport = () => {
        if (!studentProgress) return;

        const { student, results, avgPercentage } = studentProgress;

        let csv = `Progress Report - ${student.fullName}\n`;
        csv += `Student ID: ${student.studentId}\n`;
        csv += `Class: ${student.classGrade}\n`;
        csv += `Average Percentage: ${avgPercentage}%\n\n`;
        csv += 'Exam Name,Subject,Date,Marks,Percentage,Grade\n';

        results.forEach(r => {
            csv += `"${r.examName}","${r.subject}",${formatDate(r.examDate)},${r.obtainedMarks}/${r.totalMarks},${r.percentage}%,${r.grade}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progress_${student.fullName.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Subject-wise summary
    const subjectSummary = useMemo(() => {
        if (!studentProgress) return [];

        const subjectMap = new Map<string, { total: number; obtained: number; count: number }>();

        studentProgress.results.forEach(r => {
            const existing = subjectMap.get(r.subject) || { total: 0, obtained: 0, count: 0 };
            subjectMap.set(r.subject, {
                total: existing.total + r.totalMarks,
                obtained: existing.obtained + r.obtainedMarks,
                count: existing.count + 1
            });
        });

        return Array.from(subjectMap.entries()).map(([subject, data]) => ({
            subject,
            avgPercentage: Math.round((data.obtained / data.total) * 1000) / 10,
            examsCount: data.count
        }));
    }, [studentProgress]);

    return (
        <AdminLayout title="Progress Report">
            <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        {/* Class Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(''); setStudentProgress(null); }}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                <option value="all">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Student Selector */}
                        <div className="flex-1 min-w-[250px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                <option value="">-- Select a Student --</option>
                                {filteredStudents.map(student => (
                                    <option key={student._id} value={student._id}>
                                        {student.fullName} ({student.studentId}) - {student.classGrade}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Export */}
                        {studentProgress && studentProgress.results.length > 0 && (
                            <button
                                onClick={exportReport}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                <DownloadIcon style={{ fontSize: 18 }} />
                                Export
                            </button>
                        )}
                    </div>
                </div>

                {/* Student Progress */}
                {selectedStudent ? (
                    loadingProgress ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <div className="text-gray-500">Loading progress...</div>
                        </div>
                    ) : studentProgress ? (
                        <>
                            {/* Student Info Card */}
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                            <PersonIcon style={{ fontSize: 32 }} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">{studentProgress.student.fullName}</h2>
                                            <p className="opacity-80">
                                                {studentProgress.student.studentId} | Class {studentProgress.student.classGrade}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg opacity-80">Overall Average</span>
                                            {studentProgress.trend === 'up' && <TrendingUpIcon />}
                                            {studentProgress.trend === 'down' && <TrendingDownIcon />}
                                        </div>
                                        <p className="text-4xl font-bold">{studentProgress.avgPercentage}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                                    <p className="text-sm text-gray-500">Total Exams</p>
                                    <p className="text-2xl font-bold text-gray-900">{studentProgress.results.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4 text-center">
                                    <p className="text-sm text-green-600">Best Score</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {studentProgress.results.length > 0
                                            ? `${Math.max(...studentProgress.results.map(r => r.percentage))}%`
                                            : '-'}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 text-center">
                                    <p className="text-sm text-red-600">Lowest Score</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {studentProgress.results.length > 0
                                            ? `${Math.min(...studentProgress.results.map(r => r.percentage))}%`
                                            : '-'}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 text-center">
                                    <p className="text-sm text-blue-600">Trend</p>
                                    <p className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                                        {studentProgress.trend === 'up' && <><TrendingUpIcon /> Improving</>}
                                        {studentProgress.trend === 'down' && <><TrendingDownIcon /> Declining</>}
                                        {studentProgress.trend === 'stable' && 'Stable'}
                                    </p>
                                </div>
                            </div>

                            {/* Subject-wise Summary */}
                            {subjectSummary.length > 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">Subject-wise Performance</h3>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {subjectSummary.map(subject => (
                                            <div key={subject.subject} className="border border-gray-200 rounded-lg p-3 text-center">
                                                <p className="text-sm text-gray-500 truncate">{subject.subject}</p>
                                                <p className={`text-xl font-bold ${subject.avgPercentage >= 70 ? 'text-green-600' :
                                                        subject.avgPercentage >= 50 ? 'text-blue-600' :
                                                            subject.avgPercentage >= 33 ? 'text-yellow-600' :
                                                                'text-red-600'
                                                    }`}>
                                                    {subject.avgPercentage}%
                                                </p>
                                                <p className="text-xs text-gray-400">{subject.examsCount} exams</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Exam Results Table */}
                            {studentProgress.results.length > 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">Exam History</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Exam</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Marks</th>
                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Percentage</th>
                                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {studentProgress.results.map((result, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{result.examName}</td>
                                                        <td className="px-4 py-3 text-gray-700">{result.subject}</td>
                                                        <td className="px-4 py-3 text-gray-700">{formatDate(result.examDate)}</td>
                                                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                                                            {result.obtainedMarks} / {result.totalMarks}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`font-medium ${result.percentage >= 70 ? 'text-green-600' :
                                                                    result.percentage >= 50 ? 'text-blue-600' :
                                                                        result.percentage >= 33 ? 'text-yellow-600' :
                                                                            'text-red-600'
                                                                }`}>
                                                                {result.percentage}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-sm font-bold ${getGradeColor(result.grade)}`}>
                                                                {result.grade}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                    <p className="text-gray-500">No exam results found for this student</p>
                                </div>
                            )}
                        </>
                    ) : null
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <PersonIcon style={{ fontSize: 48 }} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Select a student to view progress report</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
