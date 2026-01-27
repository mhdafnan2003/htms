import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Fee from '@/models/Fee';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function getFeeStatus(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const classGrade = searchParams.get('class');
        const month = searchParams.get('month'); // Format: "2024-01"

        if (!month) {
            return NextResponse.json(
                { message: 'Month is required' },
                { status: 400 }
            );
        }

        // Build student query
        let studentQuery: any = { status: 'ACTIVE' };
        if (classGrade) {
            studentQuery.classGrade = classGrade;
        }

        // Get all students
        const students = await Student.find(studentQuery)
            .select('_id studentId fullName classGrade monthlyFeeAmount secondaryMobile')
            .populate('linkedParentId', 'name phone')
            .sort({ fullName: 1 });

        // Get all fee records for this month
        const feeRecords = await Fee.find({ month });

        // Create a map of studentId -> fee record
        const feeMap = new Map();
        feeRecords.forEach(fee => {
            feeMap.set(fee.studentId.toString(), fee);
        });

        // Combine student and fee data
        const studentFeeData = students.map(student => {
            const feeRecord = feeMap.get(student._id.toString());

            let feeStatus = 'NOT_PAID';
            let paidAmount = 0;
            let balanceAmount = student.monthlyFeeAmount;
            let lastPaymentDate = null;

            if (feeRecord) {
                feeStatus = feeRecord.status;
                paidAmount = feeRecord.paidAmount;
                balanceAmount = feeRecord.balanceAmount;
                lastPaymentDate = feeRecord.paymentDate;
            }

            return {
                _id: student._id,
                studentId: student.studentId,
                fullName: student.fullName,
                classGrade: student.classGrade,
                monthlyFeeAmount: student.monthlyFeeAmount,
                parentName: student.linkedParentId?.name || '',
                parentPhone: student.linkedParentId?.phone || student.secondaryMobile || '',
                feeStatus,
                paidAmount,
                balanceAmount,
                lastPaymentDate
            };
        });

        return NextResponse.json({
            students: studentFeeData,
            month
        });
    } catch (error) {
        console.error('Get fee status error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getFeeStatus);
