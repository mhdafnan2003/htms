import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Fee from '@/models/Fee';
import Exam from '@/models/Exam';
import { withAuth } from '@/lib/middleware';

async function getParentDashboard(req: NextRequest, context: any, user: any) {
  try {
    await dbConnect();
    
    // Find all children of this parent
    const children = await Student.find({ parentEmail: user.email });
    
    if (children.length === 0) {
      return NextResponse.json(
        { message: 'No children found for this parent' },
        { status: 404 }
      );
    }

    const childrenData = await Promise.all(
      children.map(async (child) => {
        // Get recent attendance (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const attendanceRecords = await Attendance.find({
          studentId: child._id,
          date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 });

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(record => record.status === 'P').length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        // Get pending fees
        const currentMonth = new Date();
        const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        
        const currentFee = await Fee.findOne({
          studentId: child._id,
          month: currentMonthKey
        });

        const feeStatus = currentFee ? currentFee.status : 'PENDING';
        const pendingAmount = currentFee ? currentFee.balanceAmount : child.monthlyFeeAmount;

        // Get recent marks (last 5)
        const recentMarks = await Exam.find({
          studentId: child._id
        })
        .sort({ examDate: -1 })
        .limit(5)
        .select('subject testName obtainedMarks totalMarks percentage examDate');

        return {
          studentInfo: {
            _id: child._id,
            studentId: child.studentId,
            fullName: child.fullName,
            classGrade: child.classGrade,
            section: child.section,
            monthlyFeeAmount: child.monthlyFeeAmount
          },
          attendance: {
            totalDays,
            presentDays,
            percentage: attendancePercentage,
            recentRecords: attendanceRecords.slice(0, 10) // Last 10 days
          },
          fees: {
            currentMonthStatus: feeStatus,
            pendingAmount,
            monthlyFee: child.monthlyFeeAmount
          },
          marks: {
            recent: recentMarks,
            averagePercentage: recentMarks.length > 0 
              ? Math.round(recentMarks.reduce((sum, mark) => sum + mark.percentage, 0) / recentMarks.length)
              : 0
          }
        };
      })
    );

    return NextResponse.json({ children: childrenData });
  } catch (error) {
    console.error('Parent dashboard error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getParentDashboard);