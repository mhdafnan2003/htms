import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { withRole } from '@/lib/middleware';

async function getParentMonthlyAttendance(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        const month = parseInt(searchParams.get('month') || '0');
        const year = parseInt(searchParams.get('year') || '0');

        if (!studentId || !month || !year) {
            return NextResponse.json({ message: 'Student ID, month, and year required' }, { status: 400 });
        }

        // Verify the student belongs to this parent
        const student = await Student.findOne({
            _id: studentId,
            linkedParentId: user.userId
        });

        if (!student) {
            return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        // Get date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        // Get all attendance records for the month
        const records = await Attendance.find({
            studentId: student._id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        // Build attendance data indexed by day
        const attendanceData: { [day: number]: any } = {};
        let presentDays = 0;
        let absentDays = 0;
        let lateDays = 0;
        let holidayDays = 0;

        records.forEach(record => {
            const day = new Date(record.date).getDate();
            attendanceData[day] = {
                status: record.status,
                entryTime: record.entryTime,
                exitTime: record.exitTime,
                remarks: record.remarks
            };

            // Count statuses
            if (record.status === 'P') presentDays++;
            if (record.status === 'A') absentDays++;
            if (record.status === 'L') lateDays++;
            if (record.status === 'H') holidayDays++;
        });

        const totalDays = records.length;
        const workingDays = totalDays - holidayDays;
        const percentage = workingDays > 0
            ? Math.round(((presentDays + lateDays) / workingDays) * 100)
            : 0;

        return NextResponse.json({
            attendanceData,
            summary: {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                holidayDays,
                percentage
            }
        });
    } catch (error) {
        console.error('Get parent monthly attendance error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['PARENT'])(getParentMonthlyAttendance);
