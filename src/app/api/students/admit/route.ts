import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import { withRole } from '@/lib/middleware';
import { generateId, hashPassword } from '@/lib/utils';
import { saveFiles } from '@/lib/fileUpload';

async function admitStudent(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        // Handle both JSON and FormData
        let formData: any = {};
        let files: any[] = [];

        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            const data = await req.formData();
            data.forEach((value, key) => {
                if (key.endsWith('[]')) {
                    const actualKey = key.slice(0, -2);
                    if (!formData[actualKey]) formData[actualKey] = [];
                    formData[actualKey].push(value);
                } else {
                    formData[key] = value;
                }
            });
            files = data.getAll('documents') as any[];
        } else {
            formData = await req.json();
        }

        // Check if parent already exists
        let parent = await User.findOne({ email: formData.parentEmail });

        if (!parent) {
            // Create new parent account with phone as default password
            const hashedPassword = await hashPassword(formData.parentPhone);

            parent = new User({
                email: formData.parentEmail,
                password: hashedPassword,
                fullName: formData.parentName,
                role: 'PARENT',
                phone: formData.parentPhone,
                alternativePhone: formData.parentAlternativePhone,
            });

            await parent.save();
        } else if (formData.parentAlternativePhone) {
            // Update existing parent's alternative phone if provided
            parent.alternativePhone = formData.parentAlternativePhone;
            await parent.save();
        }

        // Generate student ID
        const lastStudent = await Student.findOne().sort({ createdAt: -1 });
        const studentId = generateId('STU', lastStudent?.studentId);

        const admissionType = formData.admissionType?.toUpperCase() || 'PERMANENT';
        let admissionNumber = formData.admissionNumber;

        if (admissionNumber) {
            // Check if admission number already exists
            const existingStudent = await Student.findOne({ admissionNumber });
            if (existingStudent) {
                return NextResponse.json({
                    success: false,
                    message: 'Admission number already exists'
                }, { status: 400 });
            }
        } else {
            // Generate admission number based on admission type and year
            const currentYear = new Date().getFullYear();
            const yearSuffix = currentYear.toString().slice(-2); // Get last 2 digits (e.g., 26 for 2026)
            const prefix = admissionType === 'PERMANENT' ? 'PAC' : 'TAC';

            // Find the latest admission number for this year and type
            const latestAdmission = await Student.findOne({
                admissionNumber: { $regex: `^${prefix}${yearSuffix}/` }
            }).sort({ admissionNumber: -1 });

            let serialNumber = 1;
            if (latestAdmission && latestAdmission.admissionNumber) {
                // Extract the serial number from the latest admission number
                const match = latestAdmission.admissionNumber.match(/\/(\d+)$/);
                if (match) {
                    serialNumber = parseInt(match[1]) + 1;
                }
            }

            admissionNumber = `${prefix}${yearSuffix}/${serialNumber}`;
        }

        // Prepare address string
        const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

        // Save uploaded files to disk
        let documents: { name: string; url: string }[] = [];
        if (files.length > 0) {
            try {
                documents = await saveFiles(files);
            } catch (error: any) {
                console.error('File upload error:', error);
                return NextResponse.json(
                    {
                        success: false,
                        message: 'File upload failed: ' + error.message,
                    },
                    { status: 400 }
                );
            }
        }

        // Create student with mapped field names
        const student = new Student({
            studentId,
            admissionNumber,
            admissionType,
            fullName: formData.fullName,
            gender: formData.gender.toUpperCase(),
            dob: new Date(formData.dateOfBirth),
            classGrade: formData.class,
            section: formData.section,
            rollNumber: formData.rollNumber,
            subjectsEnrolled: formData.subjects || [],
            linkedParentId: parent._id,
            secondaryMobile: formData.phone,
            email: formData.email,
            address: fullAddress,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            admissionDate: new Date(formData.admissionDate),
            monthlyFeeAmount: Number(formData.monthlyFee),
            bloodGroup: formData.bloodGroup,
            medicalConditions: formData.medicalConditions,
            parentRelation: formData.parentRelation,
            documents,
            status: 'ACTIVE',
        });

        await student.save();

        // Populate parent info for response
        await student.populate('linkedParentId', 'name email phone alternativePhone');

        return NextResponse.json({
            success: true,
            message: 'Student admitted successfully',
            student,
            parentCreated: !parent.createdAt || parent.createdAt.getTime() === new Date().getTime(),
        }, { status: 201 });
    } catch (error: any) {
        console.error('Admit student error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Failed to admit student',
                error: error.toString()
            },
            { status: 500 }
        );
    }
}

export const POST = withRole(['ADMIN'])(admitStudent);
