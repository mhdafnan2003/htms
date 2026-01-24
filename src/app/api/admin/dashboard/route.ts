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
    const currentMonth = today.toISOString().slice(0, 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Execute all queries in parallel
    const [
      totalStudents,
      presentToday,
      monthlyFeeCollection,
      pendingFees,
      averageAttendance,
      totalSubjects
    ] = await Promise.all([
      // Total active students
      Student.countDocuments({ status: 'ACTIVE' }),

      // Today's present students
      Attendance.countDocuments({
        date: { $gte: startOfDay, $lt: endOfDay },
        status: 'P'
      }),

      // Current month fee collection
      Fee.aggregate([
        { $match: { month: currentMonth } },
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
        { $unwind: "$subjectsEnrolled" },
        { $group: { _id: null, uniqueSubjects: { $addToSet: "$subjectsEnrolled" } } },
        { $project: { totalSubjects: { $size: "$uniqueSubjects" } } }
      ])
    ]);

    // Format response
    const dashboardStats = {
      totalStudents,
      presentToday,
      monthlyFeeCollection: monthlyFeeCollection[0]?.total || 0,
      pendingFees: pendingFees[0]?.total || 0,
      averageAttendance: Math.round(averageAttendance[0]?.averageRate || 0),
      totalSubjects: totalSubjects[0]?.totalSubjects || 0
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