import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import SystemSettings from '@/models/SystemSettings';

/**
 * Checks if class promotion is needed and executes it if conditions are met
 * This function can be called on server startup or via cron job
 */
export async function checkAndPromoteClasses(): Promise<{
    promoted: boolean;
    studentsPromoted: number;
    studentsGraduated: number;
    message: string;
}> {
    try {
        await dbConnect();

        // Get system settings
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
        const thisYearApril1 = new Date(currentYear, 3, 1); // April 1st of current year

        // Check if promotion has already happened this academic year
        if (settings.lastClassPromotionDate) {
            const lastPromotionYear = settings.lastClassPromotionDate.getFullYear();
            const lastPromotionMonth = settings.lastClassPromotionDate.getMonth();

            // If last promotion was in this calendar year and after April 1st, skip
            if (lastPromotionYear === currentYear && lastPromotionMonth >= 3) {
                console.log('[Class Promotion] Already completed for this academic year');
                return {
                    promoted: false,
                    studentsPromoted: 0,
                    studentsGraduated: 0,
                    message: 'Already completed for this academic year'
                };
            }
        }

        // Check if today is April 1st or later in the current year
        if (today < thisYearApril1) {
            console.log(`[Class Promotion] Scheduled for April 1, ${currentYear}`);
            return {
                promoted: false,
                studentsPromoted: 0,
                studentsGraduated: 0,
                message: `Scheduled for April 1, ${currentYear}`
            };
        }

        // Perform promotion
        console.log('[Class Promotion] Starting automatic class promotion...');

        const activeStudents = await Student.find({
            status: { $in: ['ACTIVE', 'INACTIVE'] }
        });

        let promotedCount = 0;
        let graduatedCount = 0;

        for (const student of activeStudents) {
            const currentClass = parseInt(student.classGrade);

            if (isNaN(currentClass)) {
                continue;
            }

            if (currentClass >= 12) {
                await Student.findByIdAndUpdate(student._id, {
                    status: 'GRADUATED'
                });
                graduatedCount++;
            } else {
                await Student.findByIdAndUpdate(student._id, {
                    classGrade: (currentClass + 1).toString()
                });
                promotedCount++;
            }
        }

        // Update last promotion date
        settings.lastClassPromotionDate = today;
        await settings.save();

        console.log(`[Class Promotion] Completed: ${promotedCount} promoted, ${graduatedCount} graduated`);

        return {
            promoted: true,
            studentsPromoted: promotedCount,
            studentsGraduated: graduatedCount,
            message: 'Class promotion completed successfully'
        };

    } catch (error) {
        console.error('[Class Promotion] Error:', error);
        return {
            promoted: false,
            studentsPromoted: 0,
            studentsGraduated: 0,
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
