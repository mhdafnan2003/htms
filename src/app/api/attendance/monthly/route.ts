import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function getMonthlyAttendance(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const classGrade = searchParams.get('class');
        const month = searchParams.get('month'); // 1-12
        const year = searchParams.get('year'); // e.g., "2024"

        if (!classGrade || !month || !year) {
            return NextResponse.json(
                { message: 'Class, month, and year are required' },
                { status: 400 }
            );
        }

        // Get all students in the class
        const students = await Student.find({
            classGrade,
            status: 'ACTIVE'
        })
            .select('_id studentId admissionNumber fullName classGrade section')
            .sort({ fullName: 1 });

        if (students.length === 0) {
            return NextResponse.json({
                students: [],
                attendance: [],
                month: parseInt(month),
                year: parseInt(year),
                daysInMonth: 0
            });
        }

        // Calculate date range for the month
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
        const daysInMonth = endDate.getDate();

        // Get all attendance records for this class and month
        const attendance = await Attendance.find({
            classGrade,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .populate('studentId', 'studentId fullName')
            .populate('markedBy', 'name')
            .sort({ date: 1 });

        // Format attendance data for easier consumption
        const attendanceMap: Record<string, any> = {};

        attendance.forEach(record => {
            const dateKey = new Date(record.date).getDate(); // Day of month (1-31)
            const studentKey = record.studentId._id.toString();

            if (!attendanceMap[studentKey]) {
                attendanceMap[studentKey] = {};
            }

            attendanceMap[studentKey][dateKey] = {
                status: record.status,
                entryTime: record.entryTime,
                exitTime: record.exitTime,
                isManualOverride: record.isManualOverride,
                remarks: record.remarks,
                markedBy: record.markedBy,
                _id: record._id
            };
        });

        return NextResponse.json({
            students,
            attendanceMap,
            month: parseInt(month),
            year: parseInt(year),
            daysInMonth,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Get monthly attendance error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getMonthlyAttendance);
