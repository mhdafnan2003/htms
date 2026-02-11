import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import SystemSettings from '@/models/SystemSettings';
import { withRole } from '@/lib/middleware';

async function promoteClasses(req: NextRequest, context: any, user: any) {
    try {
        await dbConnect();

        // Get or create system settings
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                schoolName: 'My Tuition Center',
                address: '123 Education Street',
                email: 'admin@school.com',
                phone: '9876543210',
                currentSession: new Date().getFullYear().toString(),
                currencySymbol: '₹'
            });
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed (0 = January, 3 = April)
        const currentDay = today.getDate();

        // Check if we're past April 1st of this year
        const thisYearApril1 = new Date(currentYear, 3, 1); // Month 3 = April (0-indexed)

        // Check if promotion has already happened this academic year
        if (settings.lastClassPromotionDate) {
            const lastPromotionYear = settings.lastClassPromotionDate.getFullYear();
            const lastPromotionMonth = settings.lastClassPromotionDate.getMonth();

            // If last promotion was in this calendar year and after April 1st, don't promote again
            if (lastPromotionYear === currentYear && lastPromotionMonth >= 3) {
                return NextResponse.json({
                    message: 'Class promotion already done for this academic year',
                    lastPromotionDate: settings.lastClassPromotionDate,
                    studentsPromoted: 0
                });
            }

            // If today is before April 1st of this year, don't promote
            if (today < thisYearApril1) {
                return NextResponse.json({
                    message: `Class promotion scheduled for April 1, ${currentYear}`,
                    nextPromotionDate: thisYearApril1,
                    studentsPromoted: 0
                });
            }
        }

        // Get all active students
        const activeStudents = await Student.find({
            status: { $in: ['ACTIVE', 'INACTIVE'] }
        });

        let promotedCount = 0;
        let graduatedCount = 0;

        for (const student of activeStudents) {
            const currentClass = parseInt(student.classGrade);

            if (isNaN(currentClass)) {
                continue; // Skip if classGrade is not a number
            }

            if (currentClass >= 12) {
                // Students in class 12 or above should be graduated
                await Student.findByIdAndUpdate(student._id, {
                    status: 'GRADUATED'
                });
                graduatedCount++;
            } else {
                // Promote to next class
                await Student.findByIdAndUpdate(student._id, {
                    classGrade: (currentClass + 1).toString()
                });
                promotedCount++;
            }
        }

        // Update last promotion date
        settings.lastClassPromotionDate = today;
        await settings.save();

        return NextResponse.json({
            success: true,
            message: 'Class promotion completed successfully',
            studentsPromoted: promotedCount,
            studentsGraduated: graduatedCount,
            promotionDate: today
        });

    } catch (error: any) {
        console.error('Class promotion error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

export const POST = withRole(['ADMIN'])(promoteClasses);
