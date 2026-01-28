import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withRole } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

async function getProfile(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const currentUser = await User.findById(user.userId).select('-password');

        if (!currentUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: currentUser
        });
    } catch (error: any) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

async function updateProfile(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        const { name, email, phone, currentPassword, newPassword, profilePhoto, preferences } = await req.json();

        if (!name || !email) {
            return NextResponse.json(
                { message: 'Name and Email are required' },
                { status: 400 }
            );
        }

        // Find the current user
        const currentUser = await User.findById(user.userId);

        if (!currentUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Update basic info
        currentUser.fullName = name;
        currentUser.email = email;
        currentUser.phone = phone;

        if (profilePhoto !== undefined) currentUser.profilePhoto = profilePhoto;

        if (preferences) {
            currentUser.preferences = {
                ...currentUser.preferences,
                ...preferences
            };
        }

        // Update password if requested
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { message: 'Current password is required to set a new password' },
                    { status: 400 }
                );
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
            if (!isMatch) {
                return NextResponse.json(
                    { message: 'Incorrect current password' },
                    { status: 400 }
                );
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            currentUser.password = await bcrypt.hash(newPassword, salt);
        }

        await currentUser.save();

        // Return updated user (excluding password)
        const updatedUser = {
            _id: currentUser._id,
            name: currentUser.fullName,
            email: currentUser.email,
            phone: currentUser.phone,
            role: currentUser.role,
            profilePhoto: currentUser.profilePhoto,
            preferences: currentUser.preferences
        };

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

export const GET = withRole(['ADMIN'])(getProfile);
export const PUT = withRole(['ADMIN'])(updateProfile);
