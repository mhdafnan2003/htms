import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ExamDefinition } from '@/models/Exam';
import { withRole } from '@/lib/middleware';
import { generateId } from '@/lib/utils';

// GET - List all exams
async function getExams(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const classGrade = searchParams.get('class');
        const status = searchParams.get('status');

        let query: any = {};
        if (classGrade && classGrade !== 'all') {
            query.classGrade = classGrade;
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        const exams = await ExamDefinition.find(query)
            .sort({ examDate: -1, createdAt: -1 });

        return NextResponse.json({ exams });
    } catch (error) {
        console.error('Get exams error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new exam
async function createExam(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { examName, classGrade, subject, totalMarks, examDate, description } = await req.json();

        if (!examName || !classGrade || !subject || !totalMarks || !examDate) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate exam ID
        const lastExam = await ExamDefinition.findOne().sort({ createdAt: -1 });
        const examId = generateId('EXAM', lastExam?.examId);

        const exam = new ExamDefinition({
            examId,
            examName,
            classGrade,
            subject,
            totalMarks,
            examDate: new Date(examDate),
            description,
            status: 'ACTIVE'
        });

        await exam.save();

        return NextResponse.json(exam, { status: 201 });
    } catch (error) {
        console.error('Create exam error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getExams);
export const POST = withRole(['ADMIN'])(createExam);
