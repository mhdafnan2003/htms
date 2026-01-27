import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import { withRole } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

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

        console.log('Student from DB:', {
            section: student.section,
            rollNumber: student.rollNumber,
            email: student.email,
            city: student.city,
            state: student.state,
            pincode: student.pincode,
            bloodGroup: student.bloodGroup,
            medicalConditions: student.medicalConditions,
            parentRelation: student.parentRelation,
        });

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
            section: student.section,
            rollNumber: student.rollNumber,
            email: student.email,
            subjects: student.subjectsEnrolled,
            subjectsEnrolled: student.subjectsEnrolled,
            phone: student.secondaryMobile,
            secondaryMobile: student.secondaryMobile,
            address: student.address,
            city: student.city,
            state: student.state,
            pincode: student.pincode,
            admissionDate: student.admissionDate,
            monthlyFee: student.monthlyFeeAmount,
            monthlyFeeAmount: student.monthlyFeeAmount,
            bloodGroup: student.bloodGroup,
            medicalConditions: student.medicalConditions,
            parentRelation: student.parentRelation,
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
            _id: _ignored1,
            studentId: _ignored2,
            linkedParentId: _ignored3,
            createdAt: _ignored4,
            updatedAt: _ignored5,
            // Extract parent fields
            parentName,
            parentEmail,
            parentPhone,
            parentAlternativePhone,
            ...updateFields
        } = updateData;

        // Normalize gender to uppercase as required by Schema enum
        if (updateFields.gender) {
            updateFields.gender = updateFields.gender.toUpperCase();
        }

        // Handle date fields safely
        if (updateFields.dob) {
            const dobDate = new Date(updateFields.dob);
            if (isNaN(dobDate.getTime())) {
                delete updateFields.dob; // Remove invalid date
            } else {
                updateFields.dob = dobDate;
            }
        }

        if (updateFields.admissionDate) {
            const admissionDate = new Date(updateFields.admissionDate);
            if (isNaN(admissionDate.getTime())) {
                delete updateFields.admissionDate; // Remove invalid date
            } else {
                updateFields.admissionDate = admissionDate;
            }
        }

        // First, get the current student to find linked parent
        const currentStudent = await Student.findById(id);
        if (!currentStudent) {
            return NextResponse.json(
                { message: 'Student not found' },
                { status: 404 }
            );
        }

        // Update parent information if provided
        if (currentStudent.linkedParentId && (parentName || parentEmail || parentPhone || parentAlternativePhone)) {
            try {
                const parentUpdateData: any = {};
                if (parentName) parentUpdateData.name = parentName;
                if (parentEmail) parentUpdateData.email = parentEmail;
                if (parentPhone) {
                    parentUpdateData.phone = parentPhone;
                    // Also update password (phone is used as password for parents)
                    parentUpdateData.password = await bcrypt.hash(parentPhone, 12);
                }
                if (parentAlternativePhone !== undefined) parentUpdateData.alternativePhone = parentAlternativePhone;

                await User.findByIdAndUpdate(
                    currentStudent.linkedParentId,
                    parentUpdateData,
                    { runValidators: true }
                );
            } catch (parentError) {
                console.error('Error updating parent:', parentError);
                // Continue with student update even if parent update fails
            }
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
            section: updatedStudent.section,
            rollNumber: updatedStudent.rollNumber,
            email: updatedStudent.email,
            subjects: updatedStudent.subjectsEnrolled,
            subjectsEnrolled: updatedStudent.subjectsEnrolled,
            phone: updatedStudent.secondaryMobile,
            secondaryMobile: updatedStudent.secondaryMobile,
            address: updatedStudent.address,
            city: updatedStudent.city,
            state: updatedStudent.state,
            pincode: updatedStudent.pincode,
            admissionDate: updatedStudent.admissionDate,
            monthlyFee: updatedStudent.monthlyFeeAmount,
            monthlyFeeAmount: updatedStudent.monthlyFeeAmount,
            bloodGroup: updatedStudent.bloodGroup,
            medicalConditions: updatedStudent.medicalConditions,
            parentRelation: updatedStudent.parentRelation,
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
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message, details: error.toString() },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getStudentById);
export const DELETE = withRole(['ADMIN'])(deleteStudent);
export const PATCH = withRole(['ADMIN'])(updateStudent);
