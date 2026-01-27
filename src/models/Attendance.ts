import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  date: Date;
  status: 'P' | 'A' | 'L' | 'H';
  classGrade: string;
  entryTime?: string; // Format: "HH:MM" (e.g., "09:30")
  exitTime?: string; // Format: "HH:MM" (e.g., "16:45")
  isManualOverride?: boolean;
  remarks?: string;
  markedBy?: mongoose.Types.ObjectId;
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
  classGrade: {
    type: String,
    required: true,
  },
  entryTime: String,
  exitTime: String,
  isManualOverride: {
    type: Boolean,
    default: false,
  },
  remarks: String,
  markedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Create compound index for studentId and date to prevent duplicate entries
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
