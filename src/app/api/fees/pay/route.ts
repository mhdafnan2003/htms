import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Fee from '@/models/Fee';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';
import { generateId, generateReceiptNumber } from '@/lib/utils';

async function payFee(req: NextRequest, context: any, user: any) {
  try {
    await dbConnect();
    
    const { studentId, month, paidAmount, paymentDate, paymentMethod, transactionRef, remarks } = await req.json();

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      );
    }

    const totalAmount = student.monthlyFeeAmount;
    const balanceAmount = totalAmount - paidAmount;
    
    let status: string;
    if (balanceAmount === 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    } else {
      status = 'PENDING';
    }

    // Check if fee record already exists for this month
    const existingFee = await Fee.findOne({ studentId, month });

    if (!existingFee) {
      // Create new fee record
      const lastFee = await Fee.findOne().sort({ createdAt: -1 });
      const paymentId = generateId('PAY', lastFee?.paymentId);
      const receiptNumber = generateReceiptNumber();

      const feeRecord = new Fee({
        paymentId,
        studentId,
        month,
        totalAmount,
        paidAmount,
        balanceAmount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        transactionRef,
        receiptNumber,
        status,
        remarks,
      });

      await feeRecord.save();
      return NextResponse.json(feeRecord, { status: 201 });
    } else {
      // Update existing fee record
      const newPaidAmount = existingFee.paidAmount + paidAmount;
      const newBalanceAmount = existingFee.totalAmount - newPaidAmount;

      if (newPaidAmount > existingFee.totalAmount) {
        return NextResponse.json(
          { message: 'Payment amount exceeds total fee amount' },
          { status: 400 }
        );
      }

      let newStatus: string;
      if (newBalanceAmount === 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = 'PENDING';
      }

      const newReceiptNumber = generateReceiptNumber();

      existingFee.paidAmount = newPaidAmount;
      existingFee.balanceAmount = newBalanceAmount;
      existingFee.paymentDate = new Date(paymentDate);
      existingFee.paymentMethod = paymentMethod;
      if (transactionRef !== undefined) {
        existingFee.transactionRef = transactionRef;
      }
      existingFee.receiptNumber = newReceiptNumber;
      existingFee.status = newStatus;
      if (remarks !== undefined) {
        existingFee.remarks = remarks;
      }

      await existingFee.save();
      return NextResponse.json(existingFee);
    }
  } catch (error) {
    console.error('Pay fee error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRole(['ADMIN'])(payFee);
