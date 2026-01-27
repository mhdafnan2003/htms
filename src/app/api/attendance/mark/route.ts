import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function markAttendance(req: NextRequest, context: any, user: any) {
  try {
    await dbConnect();

    const { studentId, date, status, remarks, classGrade, entryTime, exitTime, isManualOverride } = await req.json();

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    // Use student's classGrade if not provided
    const attendanceClass = classGrade || student.classGrade;

    // Check if attendance already marked for this date
    const existingAttendance = await Attendance.findOne({
      studentId,
      date: new Date(date),
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.classGrade = attendanceClass;
      if (remarks !== undefined) existingAttendance.remarks = remarks;
      if (entryTime !== undefined) existingAttendance.entryTime = entryTime;
      if (exitTime !== undefined) existingAttendance.exitTime = exitTime;
      if (isManualOverride !== undefined) existingAttendance.isManualOverride = isManualOverride;
      existingAttendance.markedBy = user._id;

      await existingAttendance.save();
      return NextResponse.json(existingAttendance);
    }

    // Create new attendance record
    const attendance = new Attendance({
      studentId,
      date: new Date(date),
      status,
      classGrade: attendanceClass,
      entryTime,
      exitTime,
      isManualOverride: isManualOverride || false,
      remarks,
      markedBy: user._id,
    });

    await attendance.save();
    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRole(['ADMIN'])(markAttendance);
