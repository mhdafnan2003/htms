import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  studentId: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: Date;
  classGrade: string;
  schoolName?: string;
  subjectsEnrolled: string[];
  tutorAssigned?: string;
  linkedParentId: mongoose.Types.ObjectId;
  secondaryMobile?: string;
  address: string;
  admissionDate: Date;
  monthlyFeeAmount: number;
  studentPhotoUrl?: string;
  parentIdCardPhotoUrl?: string;
  studentIdCardPhotoUrl?: string;
  documents?: Array<{ name: string; url: string }>;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['MALE', 'FEMALE', 'OTHER'],
  },
  dob: {
    type: Date,
    required: true,
  },
  classGrade: {
    type: String,
    required: true,
  },
  schoolName: String,
  subjectsEnrolled: {
    type: [String],
    default: [],
  },
  tutorAssigned: String,
  linkedParentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  secondaryMobile: String,
  address: {
    type: String,
    required: true,
  },
  admissionDate: {
    type: Date,
    default: Date.now,
  },
  monthlyFeeAmount: {
    type: Number,
    required: true,
  },
  studentPhotoUrl: String,
  parentIdCardPhotoUrl: String,
  studentIdCardPhotoUrl: String,
  documents: [{
    name: String,
    url: String,
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
