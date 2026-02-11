import { checkAndPromoteClasses } from '@/lib/classPromotion';

let hasCheckedPromotion = false;
let isCheckingPromotion = false;

/**
 * Automatically checks and promotes students
 * This is called from API routes to ensure it runs periodically
 */
export async function autoPromoteClasses() {
    // Only run once per server instance and prevent concurrent runs
    if (hasCheckedPromotion || isCheckingPromotion) {
        return;
    }

    isCheckingPromotion = true;

    try {
        console.log('[Auto Class Promotion] Checking if promotion is needed...');
        const result = await checkAndPromoteClasses();

        if (result.promoted) {
            console.log(`[Auto Class Promotion] ✅ Promotion completed!`);
            console.log(`[Auto Class Promotion] - Students promoted: ${result.studentsPromoted}`);
            console.log(`[Auto Class Promotion] - Students graduated: ${result.studentsGraduated}`);
        } else {
            console.log(`[Auto Class Promotion] ℹ️ ${result.message}`);
        }

        hasCheckedPromotion = true;
    } catch (error) {
        console.error('[Auto Class Promotion] ❌ Error:', error);
    } finally {
        isCheckingPromotion = false;
    }
}
