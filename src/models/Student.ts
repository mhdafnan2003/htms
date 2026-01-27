import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  studentId: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: Date;
  classGrade: string;
  section?: string;
  rollNumber?: string;
  schoolName?: string;
  subjectsEnrolled: string[];
  tutorAssigned?: string;
  linkedParentId: mongoose.Types.ObjectId;
  secondaryMobile?: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  admissionDate: Date;
  monthlyFeeAmount: number;
  bloodGroup?: string;
  medicalConditions?: string;
  parentRelation?: string;
  studentPhotoUrl?: string;
  parentIdCardPhotoUrl?: string;
  studentIdCardPhotoUrl?: string;
  documents?: Array<{ name: string; url: string }>;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
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
  section: String,
  rollNumber: String,
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
  email: String,
  address: {
    type: String,
    required: true,
  },
  city: String,
  state: String,
  pincode: String,
  admissionDate: {
    type: Date,
    default: Date.now,
  },
  monthlyFeeAmount: {
    type: Number,
    required: true,
  },
  bloodGroup: String,
  medicalConditions: String,
  parentRelation: String,
  studentPhotoUrl: String,
  parentIdCardPhotoUrl: String,
  studentIdCardPhotoUrl: String,
  documents: [{
    name: String,
    url: String,
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'GRADUATED'],
    default: 'ACTIVE',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
