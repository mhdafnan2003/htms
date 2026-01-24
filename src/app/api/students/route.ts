import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import { withRole } from '@/lib/middleware';
import { generateId, hashPassword } from '@/lib/utils';

async function createStudent(req: NextRequest, context: any, user: any) {
  try {
    await dbConnect();

    const studentData = await req.json();

    // Check if parent already exists
    let parent = await User.findOne({ email: studentData.parentEmail });

    if (!parent) {
      // Create new parent account
      const hashedPassword = await hashPassword(studentData.parentPhone);

      parent = new User({
        email: studentData.parentEmail,
        password: hashedPassword,
        name: studentData.parentName,
        role: 'PARENT',
        phone: studentData.parentPhone,
      });

      await parent.save();
    }

    // Generate student ID
    const lastStudent = await Student.findOne().sort({ createdAt: -1 });
    const studentId = generateId('STU', lastStudent?.studentId);

    // Create student
    const student = new Student({
      studentId,
      fullName: studentData.fullName,
      gender: studentData.gender,
      dob: new Date(studentData.dob),
      classGrade: studentData.classGrade,
      schoolName: studentData.schoolName,
      subjectsEnrolled: studentData.subjectsEnrolled,
      tutorAssigned: studentData.tutorAssigned,
      linkedParentId: parent._id,
      secondaryMobile: studentData.secondaryMobile,
      address: studentData.address,
      monthlyFeeAmount: studentData.monthlyFeeAmount,
      studentPhotoUrl: studentData.studentPhotoUrl,
      parentIdCardPhotoUrl: studentData.parentIdCardPhotoUrl,
      studentIdCardPhotoUrl: studentData.studentIdCardPhotoUrl,
    });

    await student.save();

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getStudents(req: NextRequest, context: any, user: any) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query: any = {};

    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { classGrade: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const students = await Student.find(query)
      .populate('linkedParentId', 'name email phone')
      .sort({ createdAt: -1 });

    // Format response for students list page
    const formattedStudents = students.map(student => ({
      _id: student._id,
      studentId: student.studentId,
      fullName: student.fullName,
      classGrade: student.classGrade,
      section: '', // Not in current schema
      monthlyFeeAmount: student.monthlyFeeAmount || 0,
      contactNumber: student.secondaryMobile || '',
      parentName: student.linkedParentId?.name || '',
      parentEmail: student.linkedParentId?.email || '',
      dateOfBirth: student.dob,
      address: student.address,
      subjects: student.subjectsEnrolled || [],
      joinDate: student.admissionDate,
      status: student.status,
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRole(['ADMIN'])(createStudent);
export const GET = withRole(['ADMIN'])(getStudents);