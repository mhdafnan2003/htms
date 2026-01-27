import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function getAttendanceReport(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const reportType = searchParams.get('type'); // 'student-wise' or 'class-wise'
        const classGrade = searchParams.get('classGrade');
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!reportType || !classGrade) {
            return NextResponse.json(
                { message: 'Report type and classGrade are required' },
                { status: 400 }
            );
        }

        // Determine date range
        let dateQuery: any = {};
        if (month && year) {
            const start = new Date(parseInt(year), parseInt(month) - 1, 1);
            const end = new Date(parseInt(year), parseInt(month), 0);
            dateQuery = { $gte: start, $lte: end };
        } else if (startDate && endDate) {
            dateQuery = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else {
            // Default to current month
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            dateQuery = { $gte: start, $lte: end };
        }

        // Get all students in the class
        const students = await Student.find({
            classGrade,
            status: 'ACTIVE'
        })
            .select('_id studentId fullName classGrade section')
            .sort({ fullName: 1 });

        if (students.length === 0) {
            return NextResponse.json({
                reportType,
                classGrade,
                students: [],
                data: [],
                statistics: {}
            });
        }

        // Get attendance records
        const attendanceRecords = await Attendance.find({
            classGrade,
            date: dateQuery
        });

        // Calculate student-wise statistics
        const studentStats = students.map(student => {
            const studentRecords = attendanceRecords.filter(
                r => r.studentId.toString() === student._id.toString()
            );

            const total = studentRecords.length;
            const present = studentRecords.filter(r => r.status === 'P').length;
            const absent = studentRecords.filter(r => r.status === 'A').length;
            const late = studentRecords.filter(r => r.status === 'L').length;
            const holiday = studentRecords.filter(r => r.status === 'H').length;
            const working = total - holiday;
            const percentage = working > 0 ? ((present + late) / working * 100) : 0;

            return {
                studentId: student._id,
                studentNumber: student.studentId,
                fullName: student.fullName,
                section: student.section,
                totalDays: total,
                presentDays: present,
                absentDays: absent,
                lateDays: late,
                holidayDays: holiday,
                workingDays: working,
                attendancePercentage: parseFloat(percentage.toFixed(2))
            };
        });

        // Sort by attendance percentage for ranking
        const sortedStats = [...studentStats].sort((a, b) => b.attendancePercentage - a.attendancePercentage);

        // Calculate overall class statistics
        const classStats = {
            totalStudents: students.length,
            averageAttendance: parseFloat(
                (studentStats.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length).toFixed(2)
            ),
            bestAttendance: sortedStats[0] || null,
            lowestAttendance: sortedStats[sortedStats.length - 1] || null,
            above90: studentStats.filter(s => s.attendancePercentage >= 90).length,
            above75: studentStats.filter(s => s.attendancePercentage >= 75 && s.attendancePercentage < 90).length,
            below75: studentStats.filter(s => s.attendancePercentage < 75).length,
        };

        // Prepare data for charts
        const chartData = {
            // Bar chart data - Top 10 students
            topStudents: sortedStats.slice(0, 10).map(s => ({
                name: s.fullName,
                percentage: s.attendancePercentage
            })),

            // Status distribution for pie chart
            statusDistribution: {
                present: studentStats.reduce((sum, s) => sum + s.presentDays, 0),
                absent: studentStats.reduce((sum, s) => sum + s.absentDays, 0),
                late: studentStats.reduce((sum, s) => sum + s.lateDays, 0),
                holiday: studentStats.reduce((sum, s) => sum + s.holidayDays, 0),
            },

            // Monthly trend (if applicable)
            monthlyTrend: reportType === 'class-wise' ?
                generateMonthlyTrend(attendanceRecords, dateQuery) : null
        };

        return NextResponse.json({
            reportType,
            classGrade,
            dateRange: {
                start: dateQuery.$gte,
                end: dateQuery.$lte
            },
            students: studentStats,
            statistics: classStats,
            chartData
        });
    } catch (error) {
        console.error('Get attendance report error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Helper function to generate monthly trend data
function generateMonthlyTrend(records: any[], dateQuery: any) {
    const trend: Record<string, any> = {};

    records.forEach(record => {
        const dateKey = new Date(record.date).toISOString().split('T')[0];

        if (!trend[dateKey]) {
            trend[dateKey] = { date: dateKey, present: 0, absent: 0, late: 0, total: 0 };
        }

        trend[dateKey].total++;
        if (record.status === 'P') trend[dateKey].present++;
        if (record.status === 'A') trend[dateKey].absent++;
        if (record.status === 'L') trend[dateKey].late++;
    });

    return Object.values(trend).map((day: any) => ({
        date: day.date,
        attendance: day.total > 0 ? parseFloat(((day.present + day.late) / day.total * 100).toFixed(2)) : 0
    }));
}

export const GET = withRole(['ADMIN'])(getAttendanceReport);
