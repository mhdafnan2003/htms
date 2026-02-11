import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import { withRole } from '@/lib/middleware';
import { generateId, hashPassword } from '@/lib/utils';
import { autoPromoteClasses } from '@/lib/autoPromoteClasses';

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
        fullName: studentData.parentName,
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

    // Auto-check for class promotion (runs once per server instance)
    autoPromoteClasses().catch(err => console.error('[Auto Promotion Error]', err));

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
      .populate('linkedParentId', 'fullName email phone')
      .sort({ createdAt: -1 });

    // Format response for students list page
    const formattedStudents = students.map(student => ({
      _id: student._id,
      studentId: student.studentId,
      admissionNumber: student.admissionNumber,
      admissionType: student.admissionType,
      fullName: student.fullName,
      class: student.classGrade,
      classGrade: student.classGrade,
      section: student.section || '',
      rollNumber: student.rollNumber || '',
      email: student.email || '',
      bloodGroup: student.bloodGroup || '',
      medicalConditions: student.medicalConditions || '',
      parentRelation: student.parentRelation || '',
      city: student.city || '',
      state: student.state || '',
      pincode: student.pincode || '',
      monthlyFee: student.monthlyFeeAmount || 0,
      monthlyFeeAmount: student.monthlyFeeAmount || 0,
      phone: student.secondaryMobile || '',
      contactNumber: student.secondaryMobile || '',
      parentName: student.linkedParentId?.fullName || '',
      parentPhone: student.linkedParentId?.phone || '',
      parentEmail: student.linkedParentId?.email || '',
      dateOfBirth: student.dob,
      dob: student.dob,
      address: student.address,
      subjects: student.subjectsEnrolled || [],
      admissionDate: student.admissionDate,
      joinDate: student.admissionDate,
      status: student.status,
      schoolName: student.schoolName || '',
      documents: student.documents || [],
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