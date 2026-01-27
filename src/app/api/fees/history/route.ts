import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Fee from '@/models/Fee';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function getFeeHistory(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const classGrade = searchParams.get('class');
        const studentId = searchParams.get('studentId');
        const startMonth = searchParams.get('startMonth'); // Format: "2024-01"
        const endMonth = searchParams.get('endMonth'); // Format: "2024-12"
        const status = searchParams.get('status'); // PAID, PARTIAL, PENDING

        // Build query
        let query: any = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by month range
        if (startMonth && endMonth) {
            query.month = { $gte: startMonth, $lte: endMonth };
        } else if (startMonth) {
            query.month = { $gte: startMonth };
        } else if (endMonth) {
            query.month = { $lte: endMonth };
        }

        // If specific student
        if (studentId) {
            query.studentId = studentId;
        }

        // Get fee records with student details
        let feeRecords = await Fee.find(query)
            .populate('studentId', 'studentId fullName classGrade')
            .sort({ paymentDate: -1, createdAt: -1 });

        // Filter by class if specified
        if (classGrade && classGrade !== 'all') {
            feeRecords = feeRecords.filter((fee: any) =>
                fee.studentId?.classGrade === classGrade
            );
        }

        // Format response
        const formattedRecords = feeRecords.map((fee: any) => ({
            _id: fee._id,
            paymentId: fee.paymentId,
            receiptNumber: fee.receiptNumber,
            studentId: fee.studentId?._id,
            studentCode: fee.studentId?.studentId || 'N/A',
            studentName: fee.studentId?.fullName || 'Unknown',
            classGrade: fee.studentId?.classGrade || 'N/A',
            month: fee.month,
            totalAmount: fee.totalAmount,
            paidAmount: fee.paidAmount,
            balanceAmount: fee.balanceAmount,
            paymentDate: fee.paymentDate,
            paymentMethod: fee.paymentMethod,
            transactionRef: fee.transactionRef,
            status: fee.status,
            remarks: fee.remarks,
            createdAt: fee.createdAt
        }));

        // Calculate summary
        const summary = {
            totalRecords: formattedRecords.length,
            totalCollected: formattedRecords.reduce((sum: number, f: any) => sum + f.paidAmount, 0),
            totalPending: formattedRecords.reduce((sum: number, f: any) => sum + f.balanceAmount, 0),
            paidCount: formattedRecords.filter((f: any) => f.status === 'PAID').length,
            partialCount: formattedRecords.filter((f: any) => f.status === 'PARTIAL').length,
            pendingCount: formattedRecords.filter((f: any) => f.status === 'PENDING').length
        };

        return NextResponse.json({
            records: formattedRecords,
            summary
        });
    } catch (error) {
        console.error('Get fee history error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getFeeHistory);
