'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';

interface ExamResult {
    _id: string;
    examId: string;
    examName: string;
    subject: string;
    classGrade: string;
    totalMarks: number;
    examDate: string;
    studentCode: string;
    studentName: string;
    obtainedMarks: number;
    percentage: number;
    grade: string;
}

interface Exam {
    _id: string;
    examId: string;
    examName: string;
    classGrade: string;
    subject: string;
    totalMarks: number;
    examDate: string;
}

export default function ViewResultsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [results, setResults] = useState<ExamResult[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);

    // Filter results by search
    const filteredResults = useMemo(() => {
        if (!searchTerm) return results;
        return results.filter(r =>
            r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [results, searchTerm]);

    // Summary stats
    const stats = useMemo(() => {
        if (results.length === 0) return null;
        const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
        const passed = results.filter(r => r.percentage >= 33).length;
        const failed = results.filter(r => r.percentage < 33).length;
        const highest = Math.max(...results.map(r => r.obtainedMarks));
        const lowest = Math.min(...results.map(r => r.obtainedMarks));
        return { avgPercentage: Math.round(avgPercentage * 10) / 10, passed, failed, highest, lowest };
    }, [results]);

    useEffect(() => {
        fetchExams();
    }, [selectedClass]);

    useEffect(() => {
        if (selectedExam) {
            fetchResults();
        }
    }, [selectedExam]);

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

                // Get unique classes
                const uniqueClasses = [...new Set(data.exams.map((e: Exam) => e.classGrade))].sort() as string[];
                setClasses(uniqueClasses);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchResults = async () => {
        if (!selectedExam) return;

        setLoadingResults(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/marks/exams/${selectedExam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const examInfo = data.exam;

                // Transform students with results
                const resultsData = data.students
                    .filter((s: any) => s.hasResult)
                    .map((s: any) => ({
                        _id: s.studentId,
                        examId: examInfo.examId,
                        examName: examInfo.examName,
                        subject: examInfo.subject,
                        classGrade: examInfo.classGrade,
                        totalMarks: examInfo.totalMarks,
                        examDate: examInfo.examDate,
                        studentCode: s.studentCode,
                        studentName: s.fullName,
                        obtainedMarks: s.obtainedMarks,
                        percentage: s.percentage,
                        grade: s.grade
                    }));

                setResults(resultsData);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoadingResults(false);
        }
    };

    const getGradeColor = (grade: string) => {
        if (['A+', 'A'].includes(grade)) return 'text-green-600';
        if (['B+', 'B'].includes(grade)) return 'text-blue-600';
        if (['C+', 'C'].includes(grade)) return 'text-yellow-600';
        if (grade === 'D') return 'text-orange-600';
        return 'text-red-600';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const exportToCSV = () => {
        if (results.length === 0) return;

        const exam = exams.find(e => e._id === selectedExam);
        let csv = `Exam Results - ${exam?.examName}\n`;
        csv += `Subject: ${exam?.subject}, Class: ${exam?.classGrade}, Date: ${formatDate(exam?.examDate || '')}\n\n`;
        csv += 'Rank,Student Name,Student ID,Marks,Percentage,Grade\n';

        const sorted = [...filteredResults].sort((a, b) => b.obtainedMarks - a.obtainedMarks);
        sorted.forEach((r, idx) => {
            csv += `${idx + 1},"${r.studentName}",${r.studentCode},${r.obtainedMarks}/${exam?.totalMarks},${r.percentage}%,${r.grade}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `results_${exam?.examName?.replace(/\s+/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout title="View Exam Results">
            <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        {/* Class Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => { setSelectedClass(e.target.value); setSelectedExam(''); setResults([]); }}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                <option value="all">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>

                        {/* Exam Selector */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
                            <select
                                value={selectedExam}
                                onChange={(e) => setSelectedExam(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                            >
                                <option value="">-- Select an Exam --</option>
                                {exams.map(exam => (
                                    <option key={exam._id} value={exam._id}>
                                        {exam.examName} - {exam.subject} ({exam.classGrade}) - {formatDate(exam.examDate)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        {selectedExam && (
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Student name or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Export */}
                        {results.length > 0 && (
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                <DownloadIcon style={{ fontSize: 18 }} />
                                Export
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Stats */}
                {stats && selectedExam && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                            <p className="text-sm text-gray-500">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4 text-center">
                            <p className="text-sm text-green-600">Passed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 text-center">
                            <p className="text-sm text-red-600">Failed</p>
                            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 text-center">
                            <p className="text-sm text-blue-600">Average</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.avgPercentage}%</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4 text-center">
                            <p className="text-sm text-purple-600">Highest/Lowest</p>
                            <p className="text-xl font-bold text-purple-600">{stats.highest}/{stats.lowest}</p>
                        </div>
                    </div>
                )}

                {/* Results Table */}
                {selectedExam ? (
                    loadingResults ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <div className="text-gray-500">Loading results...</div>
                        </div>
                    ) : filteredResults.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Results ({filteredResults.length} students)
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Marks</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Percentage</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Grade</th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {[...filteredResults]
                                            .sort((a, b) => b.obtainedMarks - a.obtainedMarks)
                                            .map((result, idx) => {
                                                const exam = exams.find(e => e._id === selectedExam);
                                                return (
                                                    <tr key={result._id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                                            'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {idx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-gray-900">{result.studentName}</p>
                                                            <p className="text-xs text-gray-500">{result.studentCode}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                                                            {result.obtainedMarks} / {exam?.totalMarks}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                                                            {result.percentage}%
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`font-bold text-lg ${getGradeColor(result.grade)}`}>
                                                                {result.grade}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.percentage >= 33 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {result.percentage >= 33 ? 'Pass' : 'Fail'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <AssignmentIcon style={{ fontSize: 48 }} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No results found for this exam</p>
                            <p className="text-gray-400 text-sm mt-1">Add marks first to see results</p>
                        </div>
                    )
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <AssignmentIcon style={{ fontSize: 48 }} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Select an exam to view results</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
