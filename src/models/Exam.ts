import mongoose, { Document, Schema } from 'mongoose';

// Exam Definition - The exam template
export interface IExamDefinition extends Document {
  examId: string;
  examName: string;
  classGrade: string;
  subject: string;
  totalMarks: number;
  examDate: Date;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const ExamDefinitionSchema = new Schema<IExamDefinition>({
  examId: {
    type: String,
    required: true,
    unique: true,
  },
  examName: {
    type: String,
    required: true,
  },
  classGrade: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  examDate: {
    type: Date,
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE',
  },
}, {
  timestamps: true,
});

// Exam Result - Individual student marks
export interface IExamResult extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamResultSchema = new Schema<IExamResult>({
  examId: {
    type: Schema.Types.ObjectId,
    ref: 'ExamDefinition',
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  obtainedMarks: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  remarks: String,
}, {
  timestamps: true,
});

// Compound index to prevent duplicate entries
ExamResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export const ExamDefinition = mongoose.models.ExamDefinition || mongoose.model<IExamDefinition>('ExamDefinition', ExamDefinitionSchema);
export const ExamResult = mongoose.models.ExamResult || mongoose.model<IExamResult>('ExamResult', ExamResultSchema);

// Keep old Exam model for backward compatibility
export interface IExam extends Document {
  studentId: mongoose.Types.ObjectId;
  subject: string;
  testName: 'Unit Test' | 'Weekly Test' | 'Mock Test' | 'Final Exam';
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  examDate: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  testName: {
    type: String,
    enum: ['Unit Test', 'Weekly Test', 'Mock Test', 'Final Exam'],
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  obtainedMarks: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  examDate: {
    type: Date,
    required: true,
  },
  remarks: String,
}, {
  timestamps: true,
});

export default mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);
