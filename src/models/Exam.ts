import mongoose, { Document, Schema } from 'mongoose';

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
