import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  date: Date;
  status: 'P' | 'A' | 'L' | 'H';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['P', 'A', 'L', 'H'],
    required: true,
  },
  remarks: String,
}, {
  timestamps: true,
});

// Create compound index for studentId and date to prevent duplicate entries
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
