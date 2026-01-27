import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function getAttendanceSummary(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        const classGrade = searchParams.get('classGrade');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query based on provided parameters
        let query: any = {};

        if (studentId) {
            // Verify student exists
            const student = await Student.findById(studentId);
            if (!student) {
                return NextResponse.json(
                    { message: 'Student not found' },
                    { status: 404 }
                );
            }
            query.studentId = studentId;
        } else if (classGrade) {
            query.classGrade = classGrade;
        } else {
            return NextResponse.json(
                { message: 'Either studentId or classGrade is required' },
                { status: 400 }
            );
        }

        // Add date range if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        // Get all attendance records matching the query
        const attendanceRecords = await Attendance.find(query);

        // Calculate summary statistics
        const totalDays = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'P').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'A').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'L').length;
        const holidayCount = attendanceRecords.filter(r => r.status === 'H').length;

        // Calculate attendance percentage (excluding holidays)
        const workingDays = totalDays - holidayCount;
        const attendancePercentage = workingDays > 0
            ? ((presentCount + lateCount) / workingDays * 100).toFixed(2)
            : 0;

        // If querying by class, get student-wise breakdown
        let studentSummaries = null;
        if (classGrade && !studentId) {
            const students = await Student.find({
                classGrade,
                status: 'ACTIVE'
            }).select('_id studentId fullName');

            studentSummaries = students.map(student => {
                const studentRecords = attendanceRecords.filter(
                    r => r.studentId.toString() === student._id.toString()
                );

                const sTotal = studentRecords.length;
                const sPresent = studentRecords.filter(r => r.status === 'P').length;
                const sAbsent = studentRecords.filter(r => r.status === 'A').length;
                const sLate = studentRecords.filter(r => r.status === 'L').length;
                const sHoliday = studentRecords.filter(r => r.status === 'H').length;
                const sWorking = sTotal - sHoliday;
                const sPercentage = sWorking > 0
                    ? ((sPresent + sLate) / sWorking * 100).toFixed(2)
                    : 0;

                return {
                    studentId: student._id,
                    studentNumber: student.studentId,
                    fullName: student.fullName,
                    totalDays: sTotal,
                    presentDays: sPresent,
                    absentDays: sAbsent,
                    lateDays: sLate,
                    holidayDays: sHoliday,
                    workingDays: sWorking,
                    attendancePercentage: parseFloat(sPercentage)
                };
            });
        }

        return NextResponse.json({
            summary: {
                totalDays,
                presentDays: presentCount,
                absentDays: absentCount,
                lateDays: lateCount,
                holidayDays: holidayCount,
                workingDays,
                attendancePercentage: parseFloat(attendancePercentage as string)
            },
            studentSummaries,
            query: {
                studentId,
                classGrade,
                startDate,
                endDate
            }
        });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getAttendanceSummary);
