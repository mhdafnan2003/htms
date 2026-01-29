import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';
import { withRole } from '@/lib/middleware';
import { saveFiles } from '@/lib/fileUpload';

async function getSystemSettings(req: NextRequest) {
    try {
        await dbConnect();

        // Find the first (and only) settings document
        let settings = await SystemSettings.findOne();

        // If no settings exist yet, create default values
        if (!settings) {
            settings = await SystemSettings.create({
                schoolName: 'Student Tuition Center',
                address: 'Main Street, City',
                email: 'admin@tuition.com',
                currentSession: new Date().getFullYear().toString(),
                currencySymbol: '₹'
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Fetch system settings error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

async function updateSystemSettings(req: NextRequest) {
    try {
        await dbConnect();

        const contentType = req.headers.get('content-type') || '';
        let updateData: any = {};
        let logoFile = null;

        // Handle FormData (with file upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();

            // Extract regular fields
            for (const [key, value] of formData.entries()) {
                if (key === 'logo' && value instanceof File) {
                    logoFile = value;
                } else {
                    updateData[key] = value;
                }
            }

            // Handle logo file upload
            if (logoFile) {
                const savedFiles = await saveFiles([logoFile]);
                if (savedFiles.length > 0) {
                    updateData.logoUrl = savedFiles[0].url;
                }
            }
        } else {
            // Handle JSON
            updateData = await req.json();
        }

        // Find existing settings or create new one if somehow missing (upsert behavior)
        const settings = await SystemSettings.findOneAndUpdate(
            {}, // Match any document (since we intend to have only one)
            updateData,
            {
                new: true, // Return updated doc
                upsert: true, // Create if doesn't exist
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        return NextResponse.json({
            message: 'System settings updated successfully',
            settings
        });

    } catch (error: any) {
        console.error('Update system settings error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

// Only admin can read and write system settings
export const GET = withRole(['ADMIN'])(getSystemSettings);
export const PUT = withRole(['ADMIN'])(updateSystemSettings);
