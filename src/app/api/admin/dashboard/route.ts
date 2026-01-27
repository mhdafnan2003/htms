import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import Fee from '@/models/Fee';
import Attendance from '@/models/Attendance';
import { withRole } from '@/lib/middleware';

async function getDashboardStats(_req: NextRequest, _context: unknown, _user: unknown) {
  try {
    await dbConnect();

    // Get date ranges
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Month names for fee matching
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = months[today.getMonth()];
    const currentYear = today.getFullYear();

    // Execute all queries in parallel
    const [
      totalStudents,
      presentToday,
      monthlyFeeCollection,
      pendingFees,
      averageAttendance,
      totalSubjects,
      classDistribution,
      monthlyAttendance,
      monthlyFees
    ] = await Promise.all([
      // Total active students
      Student.countDocuments({ status: 'ACTIVE' }),

      // Today's present students
      Attendance.countDocuments({
        date: { $gte: startOfDay, $lt: endOfDay },
        status: 'P'
      }),

      // Current month fee collection - match month name or year-month format
      Fee.aggregate([
        {
          $match: {
            $or: [
              { month: { $regex: `^${currentMonthName}`, $options: 'i' } },
              { month: `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}` }
            ]
          }
        },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } }
      ]),

      // Total pending fees
      Fee.aggregate([
        { $match: { status: { $in: ['PENDING', 'PARTIAL'] } } },
        { $group: { _id: null, total: { $sum: "$balanceAmount" } } }
      ]),

      // 30-day average attendance
      Attendance.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            averageRate: { $multiply: [{ $divide: ["$presentDays", "$totalDays"] }, 100] }
          }
        }
      ]),

      // Total unique subjects
      Student.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $unwind: { path: "$subjectsEnrolled", preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, uniqueSubjects: { $addToSet: "$subjectsEnrolled" } } },
        { $project: { totalSubjects: { $size: "$uniqueSubjects" } } }
      ]),

      // Class distribution
      Student.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: "$classGrade", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),

      // Monthly attendance for last 6 months
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" }
            },
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] } }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),

      // Monthly fee collection for last 6 months
      Fee.aggregate([
        { $group: { _id: "$month", collected: { $sum: "$paidAmount" }, pending: { $sum: "$balanceAmount" } } },
        { $sort: { _id: -1 } },
        { $limit: 6 }
      ])
    ]);

    // Format class distribution for pie chart
    const totalStudentCount = totalStudents || 1;
    const classDistributionData = classDistribution.map((item: { _id: string; count: number }) => ({
      name: `Class ${item._id}`,
      value: Math.round((item.count / totalStudentCount) * 100),
      count: item.count
    }));

    // Format monthly attendance for line chart
    const attendanceChartData = monthlyAttendance.map((item: { _id: { year: number; month: number }; total: number; present: number }) => ({
      month: months[item._id.month - 1]?.substring(0, 3) || '',
      attendance: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
    }));

    // Format fee collection for bar chart
    const feeChartData = monthlyFees.map((item: { _id: string; collected: number; pending: number }) => {
      // Extract month name
      let monthLabel = item._id;
      if (item._id.includes(' ')) {
        monthLabel = item._id.split(' ')[0].substring(0, 3);
      } else if (item._id.includes('-')) {
        const monthNum = parseInt(item._id.split('-')[1]) - 1;
        monthLabel = months[monthNum]?.substring(0, 3) || '';
      }
      return {
        month: monthLabel,
        collected: item.collected || 0,
        pending: item.pending || 0
      };
    }).reverse();

    // Format response
    const dashboardStats = {
      totalStudents,
      presentToday,
      monthlyFeeCollection: monthlyFeeCollection[0]?.total || 0,
      pendingFees: pendingFees[0]?.total || 0,
      averageAttendance: Math.round(averageAttendance[0]?.averageRate || 0),
      totalSubjects: totalSubjects[0]?.totalSubjects || 0,
      // Chart data
      classDistribution: classDistributionData,
      attendanceChartData,
      feeChartData
    };

    return NextResponse.json(dashboardStats);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRole(['ADMIN'])(getDashboardStats);