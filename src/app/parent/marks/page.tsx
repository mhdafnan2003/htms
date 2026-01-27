'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ParentLayout from '@/components/parent/ParentLayout';
import GradeIcon from '@mui/icons-material/Grade';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface ExamResult {
    examName: string;
    subject: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    examDate: string;
}

export default function ParentMarksPage() {
    const [results, setResults] = useState<ExamResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarks();

        // Listen for student changes
        const handleStudentChange = () => {
            fetchMarks();
        };

        window.addEventListener('studentChanged', handleStudentChange);

        return () => {
            window.removeEventListener('studentChanged', handleStudentChange);
        };
    }, []);

    const fetchMarks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const studentId = localStorage.getItem('selectedStudentId');

            if (!studentId) return;

            const response = await fetch(`/api/parent/marks?studentId=${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data.results || []);
            }
        } catch (error) {
            console.error('Error fetching marks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate summary stats
    const summary = useMemo(() => {
        if (results.length === 0) return null;

        const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
        const bestResult = results.reduce((best, r) => r.percentage > best.percentage ? r : best, results[0]);
        const latestResults = [...results].sort((a, b) =>
            new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
        ).slice(0, 2);

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (latestResults.length >= 2) {
            const diff = latestResults[0].percentage - latestResults[1].percentage;
            if (diff > 5) trend = 'up';
            else if (diff < -5) trend = 'down';
        }

        return {
            avgPercentage: Math.round(avgPercentage * 10) / 10,
            totalExams: results.length,
            bestScore: bestResult.percentage,
            bestSubject: bestResult.subject,
            trend
        };
    }, [results]);

    // Group by subject
    const subjectSummary = useMemo(() => {
        const map = new Map<string, { total: number; obtained: number; count: number }>();

        results.forEach(r => {
            const existing = map.get(r.subject) || { total: 0, obtained: 0, count: 0 };
            map.set(r.subject, {
                total: existing.total + r.totalMarks,
                obtained: existing.obtained + r.obtainedMarks,
                count: existing.count + 1
            });
        });

        return Array.from(map.entries()).map(([subject, data]) => ({
            subject,
            avgPercentage: Math.round((data.obtained / data.total) * 1000) / 10,
            examsCount: data.count
        })).sort((a, b) => b.avgPercentage - a.avgPercentage);
    }, [results]);

    const getGradeColor = (grade: string) => {
        if (['A+', 'A'].includes(grade)) return 'bg-green-100 text-green-700';
        if (['B+', 'B'].includes(grade)) return 'bg-blue-100 text-blue-700';
        if (['C+', 'C'].includes(grade)) return 'bg-yellow-100 text-yellow-700';
        if (grade === 'D') return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    const getPercentageColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-blue-600';
        if (percentage >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <ParentLayout title="Exam Marks">
            <div className="space-y-6">
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-gray-500">Loading marks...</div>
                    </div>
                ) : results.length > 0 ? (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                    <p className="text-sm text-purple-100">Overall Average</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-3xl font-bold">{summary.avgPercentage}%</p>
                                        {summary.trend === 'up' && <TrendingUpIcon />}
                                        {summary.trend === 'down' && <TrendingDownIcon />}
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <p className="text-sm text-gray-500">Total Exams</p>
                                    <p className="text-3xl font-bold text-gray-900">{summary.totalExams}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                                    <p className="text-sm text-green-600">Best Score</p>
                                    <p className="text-3xl font-bold text-green-600">{summary.bestScore}%</p>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                                    <p className="text-sm text-blue-600">Best Subject</p>
                                    <p className="text-xl font-bold text-blue-600 truncate">{summary.bestSubject}</p>
                                </div>
                            </div>
                        )}

                        {/* Subject-wise Performance */}
                        {subjectSummary.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Subject-wise Performance</h3>
                                </div>
                                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {subjectSummary.map(subject => (
                                        <div key={subject.subject} className="border border-gray-200 rounded-lg p-3 text-center">
                                            <p className="text-sm text-gray-500 truncate">{subject.subject}</p>
                                            <p className={`text-2xl font-bold ${getPercentageColor(subject.avgPercentage)}`}>
                                                {subject.avgPercentage}%
                                            </p>
                                            <p className="text-xs text-gray-400">{subject.examsCount} exams</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Results Table */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">All Exam Results</h3>
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
                                        {[...results].sort((a, b) =>
                                            new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
                                        ).map((result, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{result.examName}</td>
                                                <td className="px-4 py-3 text-gray-700">{result.subject}</td>
                                                <td className="px-4 py-3 text-gray-700">{formatDate(result.examDate)}</td>
                                                <td className="px-4 py-3 text-center font-medium text-gray-900">
                                                    {result.obtainedMarks} / {result.totalMarks}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`font-bold ${getPercentageColor(result.percentage)}`}>
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
                    </>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <GradeIcon style={{ fontSize: 48 }} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No exam results available</p>
                        <p className="text-gray-400 text-sm mt-1">Results will appear here after exams are conducted</p>
                    </div>
                )}
            </div>
        </ParentLayout>
    );
}
