import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function addMarks(req: NextRequest, context: any, user: any) {
  try {
    await dbConnect();
    
    const { studentId, subject, testName, totalMarks, obtainedMarks, examDate, remarks } = await req.json();

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    // Validate marks
    if (obtainedMarks > totalMarks) {
      return NextResponse.json(
        { message: 'Obtained marks cannot exceed total marks' },
        { status: 400 }
      );
    }

    // Calculate percentage
    const percentage = Math.round((obtainedMarks / totalMarks) * 100);

    const exam = new Exam({
      studentId,
      subject,
      testName,
      totalMarks,
      obtainedMarks,
      percentage,
      examDate: new Date(examDate),
      remarks,
    });

    await exam.save();
    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('Add marks error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getStudentMarks(req: NextRequest, context: any, user: any) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { message: 'Student ID is required' },
        { status: 400 }
      );
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    const marks = await Exam.find({ studentId })
      .populate('studentId', 'studentId fullName classGrade')
      .sort({ examDate: -1 });

    return NextResponse.json(marks);
  } catch (error) {
    console.error('Get student marks error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRole(['ADMIN'])(addMarks);
export const GET = withRole(['ADMIN'])(getStudentMarks);
