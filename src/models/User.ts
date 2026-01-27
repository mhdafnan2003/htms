import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'PARENT';
  phone: string;
  alternativePhone?: string;
  isActive: boolean;
  profilePhoto?: string;
  preferences?: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['ADMIN', 'PARENT'],
  },
  phone: {
    type: String,
    required: true,
  },
  alternativePhone: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  profilePhoto: String,
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
