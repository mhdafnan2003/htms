import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

async function bulkMarkAttendance(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { date, classGrade, status, studentIds, entryTime, exitTime, remarks } = await req.json();

        if (!date || !classGrade || !status || !studentIds || !Array.isArray(studentIds)) {
            return NextResponse.json(
                { message: 'Date, classGrade, status, and studentIds array are required' },
                { status: 400 }
            );
        }

        // Verify all students exist and belong to the class
        const students = await Student.find({
            _id: { $in: studentIds },
            classGrade
        });

        if (students.length !== studentIds.length) {
            return NextResponse.json(
                { message: 'Some students not found or do not belong to the specified class' },
                { status: 400 }
            );
        }

        const attendanceDate = new Date(date);
        const bulkOps = [];

        // Prepare bulk operations
        for (const studentId of studentIds) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        studentId,
                        date: attendanceDate
                    },
                    update: {
                        $set: {
                            status,
                            classGrade,
                            entryTime: entryTime || undefined,
                            exitTime: exitTime || undefined,
                            remarks: remarks || undefined,
                            markedBy: user._id,
                            isManualOverride: false
                        }
                    },
                    upsert: true
                }
            });
        }

        // Execute bulk write operation
        const result = await Attendance.bulkWrite(bulkOps);

        return NextResponse.json({
            success: true,
            message: `Attendance marked for ${studentIds.length} students`,
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            matchedCount: result.matchedCount
        });
    } catch (error) {
        console.error('Bulk mark attendance error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = withRole(['ADMIN'])(bulkMarkAttendance);
