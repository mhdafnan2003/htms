# Automatic Class Promotion

## Overview
Students are automatically promoted to the next class on **April 1st every year**.

## How It Works
- The system automatically checks on server startup if promotion is needed
- If today is April 1st or later and promotion hasn't happened this year, it runs automatically
- Students move from Class 1 → Class 2, Class 2 → Class 3, etc.
- Class 12 students are marked as "GRADUATED"
- Promotion happens only once per academic year

## Technical Details
The promotion runs automatically through:
1. `src/lib/classPromotion.ts` - Core promotion logic
2. `src/lib/autoPromoteClasses.ts` - Auto-initialization on server startup
3. `src/middleware.ts` - Imports the auto-initialization module
4. `src/app/api/students/promote-class/route.ts` - API endpoint (optional manual trigger)

## Manual Trigger (Optional)
You can manually trigger promotion via API:
```bash
POST /api/students/promote-class
Authorization: Bearer {admin-token}
```

## Database
Promotion status is tracked in `SystemSettings.lastClassPromotionDate`
