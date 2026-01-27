import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import { ExamDefinition, ExamResult } from '@/models/Exam';
import { withRole } from '@/lib/middleware';

async function getParentMarks(req: NextRequest, context: any, user: any) {
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

        // Get all exams for the student's class
        const exams = await ExamDefinition.find({
            classGrade: student.classGrade
        }).sort({ examDate: -1 });

        // Get student's results
        const examResults = await ExamResult.find({
            studentId: student._id
        });

        // Create a map of results by exam ID
        const resultMap = new Map();
        examResults.forEach(r => {
            resultMap.set(r.examId.toString(), r);
        });

        // Combine exams with results
        const results = exams
            .filter(exam => resultMap.has(exam._id.toString()))
            .map(exam => {
                const result = resultMap.get(exam._id.toString());
                return {
                    examName: exam.examName,
                    subject: exam.subject,
                    totalMarks: exam.totalMarks,
                    obtainedMarks: result.obtainedMarks,
                    percentage: result.percentage,
                    grade: result.grade,
                    examDate: exam.examDate
                };
            });

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Get parent marks error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['PARENT'])(getParentMarks);
