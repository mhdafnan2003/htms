import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { withRole } from '@/lib/middleware';

async function getParentAttendance(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        const month = searchParams.get('month'); // Format: YYYY-MM

        if (!studentId) {
            return NextResponse.json({ message: 'Student ID required' }, { status: 400 });
        }

        // Verify the student belongs to this parent
        const student = await Student.findOne({
            _id: studentId,
            linkedParentId: user.userId
        });

        if (!student) {
            return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        // Parse month for date range
        let startDate: Date, endDate: Date;
        if (month) {
            const [year, mon] = month.split('-').map(Number);
            startDate = new Date(year, mon - 1, 1);
            endDate = new Date(year, mon, 0); // Last day of month
        } else {
            // Default to current month
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        // Get attendance records
        const records = await Attendance.find({
            studentId: student._id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });

        // Calculate summary
        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'P').length;
        const absentDays = records.filter(r => r.status === 'A').length;
        const lateDays = records.filter(r => r.status === 'L').length;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        return NextResponse.json({
            records: records.map(r => ({
                date: r.date,
                status: r.status,
                remarks: r.remarks
            })),
            summary: {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                percentage
            }
        });
    } catch (error) {
        console.error('Get parent attendance error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['PARENT'])(getParentAttendance);
