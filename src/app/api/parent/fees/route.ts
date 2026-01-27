import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Fee from '@/models/Fee';
import { withRole } from '@/lib/middleware';

async function getParentFees(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ message: 'Student ID required' }, { status: 400 });
        }

        // Verify the student belongs to this parent
        const student = await Student.findOne({
            _id: studentId,
            linkedParentId: user.userId
        });

        if (!student) {
            return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        // Get all fee records for this student
        const fees = await Fee.find({
            studentId: student._id
        }).sort({ createdAt: -1 });

        // Map to expected format
        const payments = fees.map(fee => {
            // Parse month field - could be "January 2025" or "2025-01"
            let month = fee.month;
            let year = new Date().getFullYear();

            // Try to extract year from month string
            const monthParts = fee.month.split(' ');
            if (monthParts.length === 2) {
                month = monthParts[0];
                year = parseInt(monthParts[1]) || year;
            } else if (fee.month.includes('-')) {
                // Format: "2025-01"
                const [y, m] = fee.month.split('-');
                const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                year = parseInt(y) || year;
                month = months[parseInt(m) - 1] || month;
            }

            return {
                _id: fee._id,
                feeId: fee.paymentId,
                month: month,
                year: year,
                monthlyFee: fee.totalAmount || 0,
                amountPaid: fee.paidAmount || 0,
                discount: 0, // Not in current model
                pendingAmount: fee.balanceAmount || 0,
                status: fee.status,
                paymentDate: fee.paymentDate,
                paymentMode: fee.paymentMethod,
                remarks: fee.remarks
            };
        });

        return NextResponse.json({
            payments,
            monthlyFee: student.monthlyFeeAmount || 0
        });
    } catch (error) {
        console.error('Get parent fees error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['PARENT'])(getParentFees);
