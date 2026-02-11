import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings extends Document {
    schoolName: string;
    address: string;
    email: string;
    phone: string;
    website?: string;
    logoUrl?: string;
    currentSession: string; // e.g., "2023-2024"
    currencySymbol: string;
    lastClassPromotionDate?: Date;
    updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
    schoolName: {
        type: String,
        required: true,
        default: 'My Tuition Center'
    },
    address: {
        type: String,
        required: true,
        default: '123 Education Street'
    },
    email: {
        type: String,
        required: true,
        default: 'admin@school.com'
    },
    phone: {
        type: String,
        required: true,
        default: '9876543210'
    },
    website: String,
    logoUrl: String,
    currentSession: {
        type: String,
        required: true,
        default: new Date().getFullYear().toString()
    },
    currencySymbol: {
        type: String,
        required: true,
        default: '₹'
    },
    lastClassPromotionDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    // Ensure we only have one settings document
    capped: { size: 1024, max: 1 }
});

export default mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
