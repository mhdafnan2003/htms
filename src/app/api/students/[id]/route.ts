import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function getStudentById(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        // Await params in Next.js 15+
        const params = await context.params;
        const { id } = params;

        const student = await Student.findById(id)
            .populate('linkedParentId', 'name email phone alternativePhone');

        if (!student) {
            return NextResponse.json(
                { message: 'Student not found' },
                { status: 404 }
            );
        }

        // Format response
        const formattedStudent = {
            _id: student._id,
            studentId: student.studentId,
            fullName: student.fullName,
            gender: student.gender,
            dob: student.dob,
            dateOfBirth: student.dob,
            class: student.classGrade,
            classGrade: student.classGrade,
            subjects: student.subjectsEnrolled,
            subjectsEnrolled: student.subjectsEnrolled,
            phone: student.secondaryMobile,
            secondaryMobile: student.secondaryMobile,
            address: student.address,
            admissionDate: student.admissionDate,
            monthlyFee: student.monthlyFeeAmount,
            monthlyFeeAmount: student.monthlyFeeAmount,
            status: student.status,
            schoolName: student.schoolName,
            tutorAssigned: student.tutorAssigned,
            studentPhotoUrl: student.studentPhotoUrl,
            parentIdCardPhotoUrl: student.parentIdCardPhotoUrl,
            studentIdCardPhotoUrl: student.studentIdCardPhotoUrl,
            documents: student.documents || [],
            parent: student.linkedParentId ? {
                _id: student.linkedParentId._id,
                name: student.linkedParentId.name,
                email: student.linkedParentId.email,
                phone: student.linkedParentId.phone,
                alternativePhone: student.linkedParentId.alternativePhone,
            } : null,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt,
        };

        return NextResponse.json({ student: formattedStudent });
    } catch (error: any) {
        console.error('Get student by ID error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

async function deleteStudent(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        // Await params in Next.js 15+
        const params = await context.params;
        const { id } = params;

        const student = await Student.findByIdAndDelete(id);

        if (!student) {
            return NextResponse.json(
                { message: 'Student not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete student error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

async function updateStudent(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        // Await params in Next.js 15+
        const params = await context.params;
        const { id } = params;

        const updateData = await req.json();

        // Prepare update object, excluding fields that shouldn't be updated directly
        const { 
            _id, 
            studentId, 
            linkedParentId, 
            createdAt, 
            updatedAt, 
            ...updateFields 
        } = updateData;

        // Handle date fields
        if (updateFields.dob) {
            updateFields.dob = new Date(updateFields.dob);
        }
        if (updateFields.admissionDate) {
            updateFields.admissionDate = new Date(updateFields.admissionDate);
        }

        // Update the student
        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('linkedParentId', 'name email phone alternativePhone');

        if (!updatedStudent) {
            return NextResponse.json(
                { message: 'Student not found' },
                { status: 404 }
            );
        }

        // Format response
        const formattedStudent = {
            _id: updatedStudent._id,
            studentId: updatedStudent.studentId,
            fullName: updatedStudent.fullName,
            gender: updatedStudent.gender,
            dob: updatedStudent.dob,
            dateOfBirth: updatedStudent.dob,
            class: updatedStudent.classGrade,
            classGrade: updatedStudent.classGrade,
            subjects: updatedStudent.subjectsEnrolled,
            subjectsEnrolled: updatedStudent.subjectsEnrolled,
            phone: updatedStudent.secondaryMobile,
            secondaryMobile: updatedStudent.secondaryMobile,
            address: updatedStudent.address,
            admissionDate: updatedStudent.admissionDate,
            monthlyFee: updatedStudent.monthlyFeeAmount,
            monthlyFeeAmount: updatedStudent.monthlyFeeAmount,
            status: updatedStudent.status,
            schoolName: updatedStudent.schoolName,
            tutorAssigned: updatedStudent.tutorAssigned,
            studentPhotoUrl: updatedStudent.studentPhotoUrl,
            parentIdCardPhotoUrl: updatedStudent.parentIdCardPhotoUrl,
            studentIdCardPhotoUrl: updatedStudent.studentIdCardPhotoUrl,
            documents: updatedStudent.documents || [],
            parent: updatedStudent.linkedParentId ? {
                _id: updatedStudent.linkedParentId._id,
                name: updatedStudent.linkedParentId.name,
                email: updatedStudent.linkedParentId.email,
                phone: updatedStudent.linkedParentId.phone,
                alternativePhone: updatedStudent.linkedParentId.alternativePhone,
            } : null,
            createdAt: updatedStudent.createdAt,
            updatedAt: updatedStudent.updatedAt,
        };

        return NextResponse.json({ student: formattedStudent });
    } catch (error: any) {
        console.error('Update student error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getStudentById);
export const DELETE = withRole(['ADMIN'])(deleteStudent);
export const PATCH = withRole(['ADMIN'])(updateStudent);
