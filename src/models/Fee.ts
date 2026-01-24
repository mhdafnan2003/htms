import mongoose, { Document, Schema } from 'mongoose';

export interface IFee extends Document {
  paymentId: string;
  studentId: mongoose.Types.ObjectId;
  month: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentDate?: Date;
  paymentMethod?: 'Cash' | 'Online' | 'UPI' | 'Bank Transfer';
  transactionRef?: string;
  receiptNumber?: string;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema = new Schema<IFee>({
  paymentId: {
    type: String,
    required: true,
    unique: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  month: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  balanceAmount: {
    type: Number,
    required: true,
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Online', 'UPI', 'Bank Transfer'],
  },
  transactionRef: String,
  receiptNumber: String,
  status: {
    type: String,
    enum: ['PAID', 'PENDING', 'PARTIAL'],
    default: 'PENDING',
  },
  remarks: String,
}, {
  timestamps: true,
});

// Create compound index for studentId and month to prevent duplicate fee entries
FeeSchema.index({ studentId: 1, month: 1 }, { unique: true });

export default mongoose.models.Fee || mongoose.model<IFee>('Fee', FeeSchema);
