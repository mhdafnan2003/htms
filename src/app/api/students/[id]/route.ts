import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';
import { saveFiles } from '@/lib/fileUpload';

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
                name: student.linkedParentId.fullName,
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

        const contentType = req.headers.get('content-type') || '';
        let updateFields: any = {};
        let existingDocs: Array<{ name: string; url: string }> = [];
        let newFiles: File[] = [];

        // Check if request is FormData (for file uploads) or JSON
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            
            // Extract existing documents
            const existingDocsStr = formData.get('existingDocuments');
            if (existingDocsStr) {
                try {
                    existingDocs = JSON.parse(existingDocsStr as string);
                } catch (e) {
                    console.error('Failed to parse existing documents:', e);
                }
            }

            // Extract new files
            const files = formData.getAll('documents');
            newFiles = files.filter((file): file is File => file instanceof File);

            // Extract form fields
            for (const [key, value] of formData.entries()) {
                if (key !== 'documents' && key !== 'existingDocuments') {
                    if (key.endsWith('[]')) {
                        const actualKey = key.slice(0, -2);
                        if (!updateFields[actualKey]) {
                            updateFields[actualKey] = [];
                        }
                        updateFields[actualKey].push(value);
                    } else {
                        updateFields[key] = value;
                    }
                }
            }

            // Handle file uploads
            let uploadedFiles: Array<{ name: string; url: string }> = [];
            if (newFiles.length > 0) {
                try {
                    uploadedFiles = await saveFiles(newFiles);
                } catch (error: any) {
                    return NextResponse.json(
                        { message: `File upload error: ${error.message}` },
                        { status: 400 }
                    );
                }
            }

            // Combine existing and new documents
            updateFields.documents = [...existingDocs, ...uploadedFiles];
        } else {
            // Handle JSON request (backward compatibility)
            const updateData = await req.json();
            updateFields = updateData;
        }

        // Prepare update object, excluding fields that shouldn't be updated directly
        const { 
            _id, 
            studentId, 
            linkedParentId, 
            createdAt, 
            updatedAt, 
            ...fieldsToUpdate 
        } = updateFields;

        // Handle date fields
        if (fieldsToUpdate.dob) {
            fieldsToUpdate.dob = new Date(fieldsToUpdate.dob);
        }
        if (fieldsToUpdate.admissionDate) {
            fieldsToUpdate.admissionDate = new Date(fieldsToUpdate.admissionDate);
        }

        // Update the student
        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            fieldsToUpdate,
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
                name: updatedStudent.linkedParentId.fullName,
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
