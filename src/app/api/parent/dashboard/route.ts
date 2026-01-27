import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Fee from '@/models/Fee';
import { ExamDefinition, ExamResult } from '@/models/Exam';
import { withRole } from '@/lib/middleware';

async function getParentDashboard(req: NextRequest, context: any, user: any) {
  try {
    await dbConnect();

    // Find all children of this parent using linkedParentId
    const children = await Student.find({
      linkedParentId: user.userId,
      status: 'ACTIVE'
    });

    if (children.length === 0) {
      return NextResponse.json({ children: [] });
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

        // Get current month's pending fees
        const currentDate = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthName = months[currentDate.getMonth()];
        const currentYear = currentDate.getFullYear();

        const currentFee = await Fee.findOne({
          studentId: child._id,
          month: currentMonthName,
          year: currentYear
        });

        const feeStatus = currentFee ? currentFee.status : 'PENDING';
        const pendingAmount = currentFee ? currentFee.pendingAmount : child.monthlyFeeAmount;

        // Get recent exam results using new ExamResult model
        const exams = await ExamDefinition.find({ classGrade: child.classGrade })
          .sort({ examDate: -1 }).limit(10);

        const examResults = await ExamResult.find({
          studentId: child._id,
          examId: { $in: exams.map(e => e._id) }
        });

        const resultMap = new Map();
        examResults.forEach(r => {
          resultMap.set(r.examId.toString(), r);
        });

        const recentMarks = exams
          .filter(exam => resultMap.has(exam._id.toString()))
          .slice(0, 5)
          .map(exam => {
            const result = resultMap.get(exam._id.toString());
            return {
              subject: exam.subject,
              testName: exam.examName,
              obtainedMarks: result.obtainedMarks,
              totalMarks: exam.totalMarks,
              percentage: result.percentage,
              examDate: exam.examDate
            };
          });

        const avgPercentage = recentMarks.length > 0
          ? Math.round(recentMarks.reduce((sum, m) => sum + m.percentage, 0) / recentMarks.length)
          : 0;

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
            recentRecords: attendanceRecords.slice(0, 10).map(r => ({
              date: r.date,
              status: r.status,
              remarks: r.remarks
            }))
          },
          fees: {
            currentMonthStatus: feeStatus,
            pendingAmount: pendingAmount || 0,
            monthlyFee: child.monthlyFeeAmount
          },
          marks: {
            recent: recentMarks,
            averagePercentage: avgPercentage
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

export const GET = withRole(['PARENT'])(getParentDashboard);