import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function getStudentAttendance(req: NextRequest, context: { params: { studentId: string } }, user: any) {
  try {
    await dbConnect();
    
    const { studentId } = context.params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    let query: any = { studentId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'studentId fullName classGrade')
      .sort({ date: -1 });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Get student attendance error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRole(['ADMIN'])(getStudentAttendance);
