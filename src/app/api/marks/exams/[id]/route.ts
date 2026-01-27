import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ExamDefinition, ExamResult } from '@/models/Exam';
import Student from '@/models/Student';
import { withRole } from '@/lib/middleware';

// GET - Get exam details with student marks
async function getExamResults(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        // Handle both Promise and direct params access
        const params = context.params;
        const examId = params?.id || (await params)?.id;

        if (!examId) {
            return NextResponse.json(
                { message: 'Exam ID is required' },
                { status: 400 }
            );
        }

        // Get exam details
        const exam = await ExamDefinition.findById(examId);
        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            );
        }

        // Get all students in the class
        const students = await Student.find({
            classGrade: exam.classGrade,
            status: 'ACTIVE'
        }).select('_id studentId fullName classGrade section').sort({ fullName: 1 });

        // Get existing results
        const results = await ExamResult.find({ examId: exam._id });
        const resultMap = new Map();
        results.forEach(r => {
            resultMap.set(r.studentId.toString(), r);
        });

        // Combine students with their results
        const studentResults = students.map(student => {
            const result = resultMap.get(student._id.toString());
            return {
                studentId: student._id,
                studentCode: student.studentId,
                fullName: student.fullName,
                section: student.section,
                obtainedMarks: result?.obtainedMarks ?? null,
                percentage: result?.percentage ?? null,
                grade: result?.grade ?? null,
                remarks: result?.remarks ?? '',
                hasResult: !!result
            };
        });

        return NextResponse.json({
            exam: {
                _id: exam._id,
                examId: exam.examId,
                examName: exam.examName,
                classGrade: exam.classGrade,
                subject: exam.subject,
                totalMarks: exam.totalMarks,
                examDate: exam.examDate,
                status: exam.status
            },
            students: studentResults,
            summary: {
                totalStudents: students.length,
                marksEntered: results.length,
                pending: students.length - results.length
            }
        });
    } catch (error) {
        console.error('Get exam results error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Save marks for exam
async function saveExamResults(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const params = context.params;
        const examId = params?.id || (await params)?.id;
        const { results } = await req.json();

        // Get exam details
        const exam = await ExamDefinition.findById(examId);
        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            );
        }

        // Calculate grade
        const getGrade = (percentage: number) => {
            if (percentage >= 90) return 'A+';
            if (percentage >= 80) return 'A';
            if (percentage >= 70) return 'B+';
            if (percentage >= 60) return 'B';
            if (percentage >= 50) return 'C+';
            if (percentage >= 40) return 'C';
            if (percentage >= 33) return 'D';
            return 'F';
        };

        // Process each result
        const operations = results.map((r: any) => {
            const percentage = exam.totalMarks > 0
                ? Math.round((r.obtainedMarks / exam.totalMarks) * 1000) / 10
                : 0;
            const grade = getGrade(percentage);

            return {
                updateOne: {
                    filter: { examId: exam._id, studentId: r.studentId },
                    update: {
                        $set: {
                            obtainedMarks: r.obtainedMarks,
                            percentage,
                            grade,
                            remarks: r.remarks || ''
                        }
                    },
                    upsert: true
                }
            };
        });

        await ExamResult.bulkWrite(operations);

        return NextResponse.json({
            message: 'Results saved successfully',
            count: results.length
        });
    } catch (error) {
        console.error('Save exam results error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete exam
async function deleteExam(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const params = context.params;
        const examId = params?.id || (await params)?.id;

        // Delete exam and all its results
        await ExamResult.deleteMany({ examId });
        await ExamDefinition.findByIdAndDelete(examId);

        return NextResponse.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Delete exam error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getExamResults);
export const POST = withRole(['ADMIN'])(saveExamResults);
export const DELETE = withRole(['ADMIN'])(deleteExam);
