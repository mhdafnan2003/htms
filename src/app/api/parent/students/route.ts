import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function getParentStudents(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        // Find all students linked to this parent
        const students = await Student.find({
            linkedParentId: user.userId,
            status: 'ACTIVE'
        })
            .select('_id studentId admissionNumber admissionType fullName classGrade section dob gender email secondaryMobile address monthlyFeeAmount admissionDate')
            .sort({ fullName: 1 });

        return NextResponse.json({ students });
    } catch (error) {
        console.error('Get parent students error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['PARENT'])(getParentStudents);
