/**
 * CalorieSmart.ai — Full Demo Data Seed
 *
 * Loads 30 days of realistic meal, exercise, and weight data for the demo account.
 * Run with:  npx tsx prisma/seed-demo.ts
 *
 * What this seeds:
 *  - User profile (Kranthi, 22, 74 kg, 175 cm, 2200 kcal goal, LA timezone)
 *  - 8-day streak (days 1-8 all within ±300 kcal of goal after exercise)
 *  - Day 9: streak-breaker (over 2500 net)
 *  - Days 10-29: realistic mix (on-goal, over, under, one fully missed day)
 *  - Today (day 0): only breakfast + morning run → live demo state
 *  - Weight log: 76.5 → 74.0 kg trend over 30 days
 *  - 3 custom foods for the custom-food feature demo
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USER_EMAIL  = 'kranthikusal.latchupathula@sjsu.edu';
const DEMO_PASSWORD = 'Demo@123';          // shared password for both accounts
const FRESH_EMAIL = 'demo.fresh@caloriesmart.ai'; // onboarding-demo account

// ─── Date helpers ────────────────────────────────────────────────────────────
// In May 2026, Los Angeles is on PDT = UTC−7.
// For a meal to fall within day D in PDT, its UTC timestamp must be between
//   D 07:00 UTC  and  (D+1) 06:59:59 UTC
//
// Safe UTC hours:
//   14 → 7:00 AM PDT   (breakfast)
//   19 → 12:00 PM PDT  (lunch)
//   22 → 3:00 PM PDT   (snack / exercise)
//   25 → 6:00 PM PDT   (dinner) — JS Date.UTC overflows hour 25 to next calendar
//                                  day at hour 1, which is still within PDT endOfDay ✓
//   10 → 3:00 AM PDT   (morning weigh-in)

const B = 14; // breakfast UTC hour
const L = 19; // lunch
const S = 22; // snack / exercise
const D = 25; // dinner (overflows to next UTC day, still in same PDT day)
const W = 10; // weight log (early AM)

function dayUTC(daysAgo: number, utcHour: number = 15): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysAgo,
      utcHour
    )
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type FI = {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSizeG?: number;
};

// ─── Meal Templates ──────────────────────────────────────────────────────────
// Each template is a reusable array of FoodItems.
// Calorie totals are noted in comments so we can plan daily sums precisely.

/** 416 cal */
const LIGHT_BREAKFAST: FI[] = [
  { name: 'Scrambled Eggs (2)', calories: 156, protein: 12.6, carbs: 1.2, fat: 10.6, servingSizeG: 100 },
  { name: 'Whole Wheat Toast (2 slices)', calories: 150, protein: 6.2, carbs: 27.6, fat: 1.6, servingSizeG: 56 },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4, servingSizeG: 118 },
  { name: 'Black Coffee', calories: 5, protein: 0.3, carbs: 0.0, fat: 0.0, servingSizeG: 240 },
];

/** 553 cal */
const HEARTY_BREAKFAST: FI[] = [
  { name: 'Oatmeal with Honey & Berries', calories: 280, protein: 7.5, carbs: 54.0, fat: 5.0, servingSizeG: 240 },
  { name: 'Boiled Eggs (2)', calories: 156, protein: 12.6, carbs: 1.2, fat: 10.6, servingSizeG: 100 },
  { name: 'Orange Juice', calories: 112, protein: 1.7, carbs: 26.0, fat: 0.5, servingSizeG: 240 },
  { name: 'Black Coffee', calories: 5, protein: 0.3, carbs: 0.0, fat: 0.0, servingSizeG: 240 },
];

/** 491 cal */
const INDIAN_BREAKFAST: FI[] = [
  { name: 'Masala Dosa', calories: 210, protein: 5.0, carbs: 36.0, fat: 6.0, servingSizeG: 130 },
  { name: 'Idli (2 pieces)', calories: 116, protein: 4.0, carbs: 23.0, fat: 0.8, servingSizeG: 100 },
  { name: 'Chai', calories: 60, protein: 2.0, carbs: 9.0, fat: 2.0, servingSizeG: 150 },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4, servingSizeG: 118 },
];

/** 759 cal — heavy Indian breakfast for "over" day */
const HEAVY_INDIAN_BREAKFAST: FI[] = [
  { name: 'Masala Dosa (2 pieces)', calories: 420, protein: 10.0, carbs: 72.0, fat: 12.0, servingSizeG: 260 },
  { name: 'Idli (3 pieces)', calories: 174, protein: 6.0, carbs: 34.5, fat: 1.2, servingSizeG: 150 },
  { name: 'Chai', calories: 60, protein: 2.0, carbs: 9.0, fat: 2.0, servingSizeG: 150 },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4, servingSizeG: 118 },
];

/** 872 cal */
const INDIAN_LUNCH: FI[] = [
  { name: 'Chicken Biryani', calories: 430, protein: 27.0, carbs: 50.0, fat: 14.0, servingSizeG: 350 },
  { name: 'Mango Lassi', calories: 180, protein: 5.0, carbs: 32.0, fat: 4.0, servingSizeG: 250 },
  { name: 'Samosa', calories: 262, protein: 5.0, carbs: 30.0, fat: 13.0, servingSizeG: 100 },
];

/** 932 cal */
const MUTTON_LUNCH: FI[] = [
  { name: 'Mutton Biryani', calories: 490, protein: 28.0, carbs: 52.0, fat: 18.0, servingSizeG: 350 },
  { name: 'Mango Lassi', calories: 180, protein: 5.0, carbs: 32.0, fat: 4.0, servingSizeG: 250 },
  { name: 'Samosa', calories: 262, protein: 5.0, carbs: 30.0, fat: 13.0, servingSizeG: 100 },
];

/** 503 cal — light dal lunch */
const LIGHT_DAL_LUNCH: FI[] = [
  { name: 'Dal Makhani', calories: 198, protein: 9.0, carbs: 22.0, fat: 8.0, servingSizeG: 200 },
  { name: 'Roti (2 pieces)', calories: 240, protein: 7.0, carbs: 44.0, fat: 5.0, servingSizeG: 120 },
  { name: 'Raita', calories: 65, protein: 3.0, carbs: 8.0, fat: 2.5, servingSizeG: 100 },
];

/** 579 cal */
const WESTERN_LUNCH: FI[] = [
  { name: 'Grilled Chicken Breast', calories: 239, protein: 27.3, carbs: 0.0, fat: 13.6, servingSizeG: 100 },
  { name: 'Brown Rice', calories: 215, protein: 4.5, carbs: 45.0, fat: 1.8, servingSizeG: 185 },
  { name: 'Steamed Mixed Vegetables', calories: 80, protein: 3.5, carbs: 15.0, fat: 0.5, servingSizeG: 150 },
  { name: 'Side Garden Salad', calories: 45, protein: 2.0, carbs: 8.0, fat: 0.5, servingSizeG: 100 },
];

/** 682 cal */
const BUTTER_CHICKEN_DINNER: FI[] = [
  { name: 'Butter Chicken', calories: 290, protein: 25.0, carbs: 12.0, fat: 16.0, servingSizeG: 250 },
  { name: 'Naan', calories: 262, protein: 8.7, carbs: 45.0, fat: 5.1, servingSizeG: 90 },
  { name: 'Basmati Rice', calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, servingSizeG: 100 },
];

/** 722 cal */
const PANEER_DINNER: FI[] = [
  { name: 'Paneer Tikka Masala', calories: 340, protein: 18.0, carbs: 15.0, fat: 22.0, servingSizeG: 250 },
  { name: 'Naan', calories: 262, protein: 8.7, carbs: 45.0, fat: 5.1, servingSizeG: 90 },
  { name: 'Roti', calories: 120, protein: 3.5, carbs: 22.0, fat: 2.5, servingSizeG: 60 },
];

/** 580 cal */
const PASTA_DINNER: FI[] = [
  { name: 'Pasta Arrabiata', calories: 380, protein: 12.0, carbs: 68.0, fat: 7.0, servingSizeG: 280 },
  { name: 'Garlic Bread (2 slices)', calories: 150, protein: 4.0, carbs: 22.0, fat: 5.5, servingSizeG: 60 },
  { name: 'Caesar Salad', calories: 50, protein: 2.5, carbs: 6.0, fat: 2.0, servingSizeG: 80 },
];

/** 929 cal — heavy Indian dinner */
const HEAVY_DINNER: FI[] = [
  { name: 'Paneer Tikka Masala', calories: 340, protein: 18.0, carbs: 15.0, fat: 22.0, servingSizeG: 250 },
  { name: 'Butter Naan (2 pieces)', calories: 524, protein: 17.4, carbs: 90.0, fat: 10.2, servingSizeG: 180 },
  { name: 'Raita', calories: 65, protein: 3.0, carbs: 8.0, fat: 2.5, servingSizeG: 100 },
];

/** 840 cal — feast dinner */
const FEAST_DINNER: FI[] = [
  { name: 'Chole Bhature', calories: 480, protein: 14.0, carbs: 62.0, fat: 20.0, servingSizeG: 300 },
  { name: 'Palak Paneer', calories: 240, protein: 12.0, carbs: 12.0, fat: 16.0, servingSizeG: 200 },
  { name: 'Roti', calories: 120, protein: 3.5, carbs: 22.0, fat: 2.5, servingSizeG: 60 },
];

/** 265 cal */
const LIGHT_SNACK: FI[] = [
  { name: 'Apple', calories: 95, protein: 0.5, carbs: 25.1, fat: 0.3, servingSizeG: 182 },
  { name: 'Mixed Nuts', calories: 170, protein: 5.0, carbs: 7.0, fat: 15.0, servingSizeG: 28 },
];

/** 360 cal */
const INDIAN_SWEET_SNACK: FI[] = [
  { name: 'Gulab Jamun (2 pieces)', calories: 300, protein: 4.0, carbs: 40.0, fat: 14.0, servingSizeG: 100 },
  { name: 'Chai', calories: 60, protein: 2.0, carbs: 9.0, fat: 2.0, servingSizeG: 150 },
];

/** 466 cal */
const HEAVY_SWEET_SNACK: FI[] = [
  { name: 'Gulab Jamun (2 pieces)', calories: 300, protein: 4.0, carbs: 40.0, fat: 14.0, servingSizeG: 100 },
  { name: 'Rasgulla', calories: 106, protein: 2.6, carbs: 22.0, fat: 1.0, servingSizeG: 60 },
  { name: 'Chai', calories: 60, protein: 2.0, carbs: 9.0, fat: 2.0, servingSizeG: 150 },
];

/** 540 cal */
const LASSI_SNACK: FI[] = [
  { name: 'Gulab Jamun (2 pieces)', calories: 300, protein: 4.0, carbs: 40.0, fat: 14.0, servingSizeG: 100 },
  { name: 'Mango Lassi', calories: 180, protein: 5.0, carbs: 32.0, fat: 4.0, servingSizeG: 250 },
  { name: 'Chai', calories: 60, protein: 2.0, carbs: 9.0, fat: 2.0, servingSizeG: 150 },
];

// ─── DB helpers ──────────────────────────────────────────────────────────────
async function meal(userId: string, type: string, date: Date, items: FI[]) {
  await prisma.mealLog.create({
    data: { userId, type, date, items: { create: items } },
  });
}

async function exercise(
  userId: string,
  activityName: string,
  durationMin: number,
  caloriesBurned: number,
  date: Date
) {
  await prisma.exerciseLog.create({
    data: { userId, activityName, durationMin, caloriesBurned, date },
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) {
    console.error(`❌  User not found: ${USER_EMAIL}`);
    console.error('   Sign up first at http://localhost:3000/signup, then re-run.');
    process.exit(1);
  }
  console.log(`✅  Found user: ${user.email}`);

  // ── 0. Set known password on main account ─────────────────────────────────
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });
  console.log(`✅  Main account password set to: ${DEMO_PASSWORD}`);

  // ── 1. Update profile ──────────────────────────────────────────────────────
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: 'Kranthi',
      age: 22,
      heightCm: 175,
      weightKg: 74,
      gender: 'male',
      activityLevel: 'moderate',
      calorieBound: 2200,
      dietaryPreference: 'Omnivore',
      proteinGoalG: 155,
      carbsGoalG: 240,
      fatGoalG: 65,
      timezone: 'America/Los_Angeles',
      // 8-day streak; lastStreakDate = today so updateStreak() won't overwrite during demo
      currentStreak: 8,
      lastStreakDate: new Date(),
      onboardingComplete: true,
    },
  });
  console.log('✅  Profile updated');

  // ── 2. Clear last 31 days ──────────────────────────────────────────────────
  const clearFrom = dayUTC(31, 0);
  await prisma.mealLog.deleteMany({ where: { userId: user.id, date: { gte: clearFrom } } });
  await prisma.exerciseLog.deleteMany({ where: { userId: user.id, date: { gte: clearFrom } } });
  await prisma.weightLog.deleteMany({ where: { userId: user.id } });
  await prisma.customFood.deleteMany({ where: { userId: user.id } });
  console.log('✅  Cleared old demo data');

  // ── 3. Meal & Exercise Logs ────────────────────────────────────────────────
  //
  // Legend — consumed / burned / net:
  //   ✓  = net within calorieBound ± 300  (streak-eligible)
  //   ✗  = net outside range
  //
  // Analytics "Days on Goal" uses RAW consumed (not net), also ± 300 of 2200.
  // So a day can be ✓ for streak (exercise offset) but ✗ for analytics if eaten over.
  //
  // Day | Consumed | Burned | Net  | Status
  // ─────────────────────────────────────────
  //  0  |   416    |  285   |  131 | Today — partial (demo live state)
  //  1  |  2270    |  200   | 2070 | ✓ Streak day 1
  //  2  |  2036    |    0   | 2036 | ✓ Streak day 2
  //  3  |  2350    |  250   | 2100 | ✓ Streak day 3
  //  4  |  1942    |    0   | 1942 | ✓ Streak day 4
  //  5  |  2270    |  270   | 2000 | ✓ Streak day 5
  //  6  |  2350    |  350   | 2000 | ✓ Streak day 6
  //  7  |  2037    |    0   | 2037 | ✓ Streak day 7
  //  8  |  2372    |  250   | 2122 | ✓ Streak day 8
  //  9  |  2891    |    0   | 2891 | ✗ Streak BREAKER (over)
  // 10  |  2133    |    0   | 2133 | ✓ on goal
  // 11  |  2712    |    0   | 2712 | ✗ over
  // 12  |  2235    |  180   | 2055 | ✓ on goal
  // 13  |   416    |    0   |  416 | ✗ sick / skipped meals
  // 14  |  2075    |    0   | 2075 | ✓ on goal
  // 15  |  2774    |    0   | 2774 | ✗ over
  // 16  |  2140    |    0   | 2140 | ✓ on goal
  // 17  |  2270    |  250   | 2020 | ✓ on goal
  // 18  |  2611    |    0   | 2611 | ✗ over
  // 19  |  2235    |    0   | 2235 | ✓ on goal
  // 20  |  1942    |    0   | 1942 | ✓ on goal
  // 21  |  2412    |  250   | 2162 | ✓ on goal
  // 22  |  2685    |    0   | 2685 | ✗ over
  // 23  |  2133    |    0   | 2133 | ✓ on goal
  // 24  |  2350    |    0   | 2350 | ✓ on goal
  // 25  |  2774    |    0   | 2774 | ✗ over
  // 26  |  2235    |    0   | 2235 | ✓ on goal
  // 27  |  1840    |    0   | 1840 | ✗ slightly under
  // 28  |     0    |    0   |    0 | ✗ fully missed
  // 29  |  2310    |    0   | 2310 | ✓ on goal
  //
  // Analytics result: ~20 / 30 days on goal, avg ≈ 2200 kcal, streak = 8

  // ── Day 0: TODAY — breakfast + run only; lunch/dinner saved for live demo ──
  await meal(user.id, 'Breakfast', dayUTC(0, B), [
    { name: 'Scrambled Eggs (2)', calories: 156, protein: 12.6, carbs: 1.2, fat: 10.6, servingSizeG: 100 },
    { name: 'Whole Wheat Toast (2 slices)', calories: 150, protein: 6.2, carbs: 27.6, fat: 1.6, servingSizeG: 56 },
    { name: 'Banana', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4, servingSizeG: 118 },
    { name: 'Black Coffee', calories: 5, protein: 0.3, carbs: 0.0, fat: 0.0, servingSizeG: 240 },
  ]);
  await exercise(user.id, 'Morning Run', 30, 285, dayUTC(0, S));

  // ── Day 1: 2270 consumed, 200 burned, net 2070 ✓ ──────────────────────────
  await meal(user.id, 'Breakfast', dayUTC(1, B), HEARTY_BREAKFAST);       // 553
  await meal(user.id, 'Lunch',     dayUTC(1, L), INDIAN_LUNCH);            // 872
  await meal(user.id, 'Dinner',    dayUTC(1, D), PASTA_DINNER);            // 580
  await meal(user.id, 'Snack',     dayUTC(1, S), LIGHT_SNACK);             // 265
  await exercise(user.id, 'Cycling', 45, 200, dayUTC(1, S));               // = 2270, net 2070

  // ── Day 2: 2036 consumed, 0 burned, net 2036 ✓ ───────────────────────────
  await meal(user.id, 'Breakfast', dayUTC(2, B), INDIAN_BREAKFAST);        // 491
  await meal(user.id, 'Lunch',     dayUTC(2, L), LIGHT_DAL_LUNCH);         // 503
  await meal(user.id, 'Dinner',    dayUTC(2, D), BUTTER_CHICKEN_DINNER);   // 682
  await meal(user.id, 'Snack',     dayUTC(2, S), INDIAN_SWEET_SNACK);      // 360 = 2036

  // ── Day 3: 2350 consumed, 250 burned, net 2100 ✓ ─────────────────────────
  await meal(user.id, 'Breakfast', dayUTC(3, B), INDIAN_BREAKFAST);        // 491
  await meal(user.id, 'Lunch',     dayUTC(3, L), INDIAN_LUNCH);            // 872
  await meal(user.id, 'Dinner',    dayUTC(3, D), PANEER_DINNER);           // 722
  await meal(user.id, 'Snack',     dayUTC(3, S), LIGHT_SNACK);             // 265 = 2350
  await exercise(user.id, 'HIIT Workout', 35, 250, dayUTC(3, S));

  // ── Day 4: 1942 consumed, 0 burned, net 1942 ✓ ───────────────────────────
  await meal(user.id, 'Breakfast', dayUTC(4, B), LIGHT_BREAKFAST);         // 416
  await meal(user.id, 'Lunch',     dayUTC(4, L), WESTERN_LUNCH);           // 579
  await meal(user.id, 'Dinner',    dayUTC(4, D), BUTTER_CHICKEN_DINNER);   // 682
  await meal(user.id, 'Snack',     dayUTC(4, S), LIGHT_SNACK);             // 265 = 1942

  // ── Day 5: 2270 consumed, 270 burned, net 2000 ✓ ─────────────────────────
  await meal(user.id, 'Breakfast', dayUTC(5, B), HEARTY_BREAKFAST);        // 553
  await meal(user.id, 'Lunch',     dayUTC(5, L), INDIAN_LUNCH);            // 872
  await meal(user.id, 'Dinner',    dayUTC(5, D), PASTA_DINNER);            // 580
  await meal(user.id, 'Snack',     dayUTC(5, S), LIGHT_SNACK);             // 265 = 2270
  await exercise(user.id, 'Swimming', 40, 270, dayUTC(5, S));

  // ── Day 6: 2350 consumed, 350 burned, net 2000 ✓ ─────────────────────────
  await meal(user.id, 'Breakfast', dayUTC(6, B), INDIAN_BREAKFAST);        // 491
  await meal(user.id, 'Lunch',     dayUTC(6, L), INDIAN_LUNCH);            // 872
  await meal(user.id, 'Dinner',    dayUTC(6, D), PANEER_DINNER);           // 722
  await meal(user.id, 'Snack',     dayUTC(6, S), LIGHT_SNACK);             // 265 = 2350
  await exercise(user.id, 'Running', 40, 350, dayUTC(6, S));

  // ── Day 7: 2037 consumed, 0 burned, net 2037 ✓ ───────────────────────────
  await meal(user.id, 'Breakfast', dayUTC(7, B), LIGHT_BREAKFAST);         // 416
  await meal(user.id, 'Lunch',     dayUTC(7, L), WESTERN_LUNCH);           // 579
  await meal(user.id, 'Dinner',    dayUTC(7, D), BUTTER_CHICKEN_DINNER);   // 682
  await meal(user.id, 'Snack',     dayUTC(7, S), INDIAN_SWEET_SNACK);      // 360 = 2037

  // ── Day 8: 2372 consumed, 250 burned, net 2122 ✓ ─────────────────────────
  await meal(user.id, 'Breakfast', dayUTC(8, B), HEARTY_BREAKFAST);        // 553
  await meal(user.id, 'Lunch',     dayUTC(8, L), INDIAN_LUNCH);            // 872
  await meal(user.id, 'Dinner',    dayUTC(8, D), BUTTER_CHICKEN_DINNER);   // 682
  await meal(user.id, 'Snack',     dayUTC(8, S), LIGHT_SNACK);             // 265 = 2372
  await exercise(user.id, 'Yoga & Weightlifting', 50, 250, dayUTC(8, S));

  // ── Day 9: 2891 consumed, 0 burned — STREAK BREAKER ✗ ────────────────────
  await meal(user.id, 'Breakfast', dayUTC(9, B), HEAVY_INDIAN_BREAKFAST);  // 759
  await meal(user.id, 'Lunch',     dayUTC(9, L), MUTTON_LUNCH);            // 932
  await meal(user.id, 'Dinner',    dayUTC(9, D), FEAST_DINNER);            // 840
  await meal(user.id, 'Snack',     dayUTC(9, S), INDIAN_SWEET_SNACK);      // 360 = 2891

  // ── Days 10–29: Mixed history ─────────────────────────────────────────────

  // Day 10: on goal 2133
  await meal(user.id, 'Breakfast', dayUTC(10, B), LIGHT_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(10, L), INDIAN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(10, D), PASTA_DINNER);
  await meal(user.id, 'Snack',     dayUTC(10, S), LIGHT_SNACK);

  // Day 11: over 2712
  await meal(user.id, 'Breakfast', dayUTC(11, B), INDIAN_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(11, L), MUTTON_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(11, D), HEAVY_DINNER);
  await meal(user.id, 'Snack',     dayUTC(11, S), INDIAN_SWEET_SNACK);

  // Day 12: on goal 2235, burned 180, net 2055 ✓
  await meal(user.id, 'Breakfast', dayUTC(12, B), LIGHT_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(12, L), INDIAN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(12, D), BUTTER_CHICKEN_DINNER);
  await meal(user.id, 'Snack',     dayUTC(12, S), LIGHT_SNACK);
  await exercise(user.id, 'Running', 25, 180, dayUTC(12, S));

  // Day 13: sick / skipped — only breakfast logged (416)
  await meal(user.id, 'Breakfast', dayUTC(13, B), LIGHT_BREAKFAST);

  // Day 14: on goal ~2075
  await meal(user.id, 'Breakfast', dayUTC(14, B), LIGHT_BREAKFAST);        // 416
  await meal(user.id, 'Lunch',     dayUTC(14, L), INDIAN_LUNCH);            // 872
  await meal(user.id, 'Dinner',    dayUTC(14, D), BUTTER_CHICKEN_DINNER);   // 682
  await meal(user.id, 'Snack',     dayUTC(14, S), [
    { name: 'Banana', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4, servingSizeG: 118 },
  ]);                                                                        // 105 = 2075

  // Day 15: over ~2774
  await meal(user.id, 'Breakfast', dayUTC(15, B), HEARTY_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(15, L), MUTTON_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(15, D), HEAVY_DINNER);
  await meal(user.id, 'Snack',     dayUTC(15, S), INDIAN_SWEET_SNACK);

  // Day 16: on goal ~2140
  await meal(user.id, 'Breakfast', dayUTC(16, B), LIGHT_BREAKFAST);        // 416
  await meal(user.id, 'Lunch',     dayUTC(16, L), INDIAN_LUNCH);            // 872
  await meal(user.id, 'Dinner',    dayUTC(16, D), BUTTER_CHICKEN_DINNER);   // 682
  await meal(user.id, 'Snack',     dayUTC(16, S), [
    { name: 'Mixed Nuts', calories: 170, protein: 5.0, carbs: 7.0, fat: 15.0, servingSizeG: 28 },
  ]);                                                                        // 170 = 2140

  // Day 17: on goal 2270, burned 250, net 2020 ✓
  await meal(user.id, 'Breakfast', dayUTC(17, B), HEARTY_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(17, L), INDIAN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(17, D), PASTA_DINNER);
  await meal(user.id, 'Snack',     dayUTC(17, S), LIGHT_SNACK);
  await exercise(user.id, 'Cycling', 45, 250, dayUTC(17, S));

  // Day 18: over ~2611
  await meal(user.id, 'Breakfast', dayUTC(18, B), INDIAN_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(18, L), MUTTON_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(18, D), PANEER_DINNER);
  await meal(user.id, 'Snack',     dayUTC(18, S), HEAVY_SWEET_SNACK);

  // Day 19: on goal ~2235
  await meal(user.id, 'Breakfast', dayUTC(19, B), LIGHT_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(19, L), INDIAN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(19, D), BUTTER_CHICKEN_DINNER);
  await meal(user.id, 'Snack',     dayUTC(19, S), LIGHT_SNACK);

  // Day 20: on goal ~1942
  await meal(user.id, 'Breakfast', dayUTC(20, B), LIGHT_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(20, L), WESTERN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(20, D), BUTTER_CHICKEN_DINNER);
  await meal(user.id, 'Snack',     dayUTC(20, S), LIGHT_SNACK);

  // Day 21: on goal 2412, burned 250, net 2162 ✓ (analytics: 2412 ≤ 2500 ✓)
  await meal(user.id, 'Breakfast', dayUTC(21, B), HEARTY_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(21, L), INDIAN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(21, D), PANEER_DINNER);
  await meal(user.id, 'Snack',     dayUTC(21, S), LIGHT_SNACK);
  await exercise(user.id, 'Weightlifting', 60, 250, dayUTC(21, S));

  // Day 22: over ~2685
  await meal(user.id, 'Breakfast', dayUTC(22, B), INDIAN_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(22, L), MUTTON_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(22, D), PANEER_DINNER);
  await meal(user.id, 'Snack',     dayUTC(22, S), LASSI_SNACK);

  // Day 23: on goal ~2133
  await meal(user.id, 'Breakfast', dayUTC(23, B), LIGHT_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(23, L), INDIAN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(23, D), PASTA_DINNER);
  await meal(user.id, 'Snack',     dayUTC(23, S), LIGHT_SNACK);

  // Day 24: on goal ~2350
  await meal(user.id, 'Breakfast', dayUTC(24, B), INDIAN_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(24, L), INDIAN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(24, D), PANEER_DINNER);
  await meal(user.id, 'Snack',     dayUTC(24, S), LIGHT_SNACK);

  // Day 25: over ~2774
  await meal(user.id, 'Breakfast', dayUTC(25, B), HEARTY_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(25, L), MUTTON_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(25, D), HEAVY_DINNER);
  await meal(user.id, 'Snack',     dayUTC(25, S), INDIAN_SWEET_SNACK);

  // Day 26: on goal ~2235
  await meal(user.id, 'Breakfast', dayUTC(26, B), LIGHT_BREAKFAST);
  await meal(user.id, 'Lunch',     dayUTC(26, L), INDIAN_LUNCH);
  await meal(user.id, 'Dinner',    dayUTC(26, D), BUTTER_CHICKEN_DINNER);
  await meal(user.id, 'Snack',     dayUTC(26, S), LIGHT_SNACK);

  // Day 27: slightly under ~1840 (below 1900 → off goal ✗)
  await meal(user.id, 'Breakfast', dayUTC(27, B), LIGHT_BREAKFAST);        // 416
  await meal(user.id, 'Lunch',     dayUTC(27, L), WESTERN_LUNCH);          // 579
  await meal(user.id, 'Dinner',    dayUTC(27, D), PASTA_DINNER);           // 580
  await meal(user.id, 'Snack',     dayUTC(27, S), LIGHT_SNACK);            // 265 = 1840

  // Day 28: FULLY MISSED — no entries at all (shows as gap in analytics chart)

  // Day 29: on goal ~2310
  await meal(user.id, 'Breakfast', dayUTC(29, B), INDIAN_BREAKFAST);       // 491
  await meal(user.id, 'Lunch',     dayUTC(29, L), INDIAN_LUNCH);           // 872
  await meal(user.id, 'Dinner',    dayUTC(29, D), BUTTER_CHICKEN_DINNER);  // 682
  await meal(user.id, 'Snack',     dayUTC(29, S), LIGHT_SNACK);            // 265 = 2310

  console.log('✅  Meal & exercise logs seeded (30 days)');

  // ── 4. Weight logs: gradual loss 76.5 → 74.0 kg over 30 days ─────────────
  for (let i = 29; i >= 0; i--) {
    const kg = 76.5 - (29 - i) * (2.5 / 29);
    await prisma.weightLog.create({
      data: {
        userId: user.id,
        weightKg: Math.round(kg * 10) / 10,
        date: dayUTC(i, W),
      },
    });
  }
  console.log('✅  Weight logs seeded (76.5 → 74.0 kg trend)');

  // ── 5. Custom foods ────────────────────────────────────────────────────────
  const customFoods = [
    { name: 'SJSU Dining Protein Bowl', calories: 420, protein: 35, carbs: 45, fat: 8, servingSizeG: 350 },
    { name: "Mom's Dal Tadka", calories: 185, protein: 10, carbs: 24, fat: 5, servingSizeG: 200 },
    { name: 'Pre-Workout Protein Shake', calories: 220, protein: 25, carbs: 22, fat: 3, servingSizeG: 350 },
  ];
  for (const food of customFoods) {
    await prisma.customFood.create({ data: { userId: user.id, ...food } });
  }
  console.log('✅  Custom foods seeded (3 entries)');

  // ── 6. Fresh onboarding account ───────────────────────────────────────────
  // This account exists in the DB with a known password but has NOT completed
  // onboarding, so logging in goes directly to the TDEE questionnaire.
  // Use it to demo the onboarding flow during the presentation.
  const freshHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const freshUser = await prisma.user.findUnique({ where: { email: FRESH_EMAIL } });
  if (freshUser) {
    // Reset to a clean pre-onboarding state
    await prisma.mealLog.deleteMany({ where: { userId: freshUser.id } });
    await prisma.exerciseLog.deleteMany({ where: { userId: freshUser.id } });
    await prisma.weightLog.deleteMany({ where: { userId: freshUser.id } });
    await prisma.customFood.deleteMany({ where: { userId: freshUser.id } });
    await prisma.user.update({
      where: { id: freshUser.id },
      data: {
        password: freshHash,
        name: null,
        age: null, heightCm: null, weightKg: null, gender: null, activityLevel: null,
        calorieBound: 2000, dietaryPreference: 'Omnivore',
        proteinGoalG: null, carbsGoalG: null, fatGoalG: null,
        currentStreak: 0, lastStreakDate: null,
        timezone: 'UTC',
        onboardingComplete: false,
      },
    });
    console.log(`✅  Fresh account reset: ${FRESH_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        email: FRESH_EMAIL,
        password: freshHash,
        onboardingComplete: false,
      },
    });
    console.log(`✅  Fresh account created: ${FRESH_EMAIL}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          CalorieSmart.ai — Demo Data Loaded              ║
╠══════════════════════════════════════════════════════════╣
║  ACCOUNT 1 — Full demo (rich 30-day history)             ║
║    Email    : kranthikusal.latchupathula@sjsu.edu         ║
║    Password : Demo@123                                   ║
║    Profile  : Kranthi | 22 yr | 74 kg | 175 cm          ║
║    Goal     : 2 200 kcal/day | Omnivore                  ║
║    Streak   : 🔥 8 days                                  ║
║    History  : 30 days · ~20/30 on goal · avg ~2200 kcal  ║
║    Weight   : 76.5 → 74.0 kg trend                       ║
║    Today    : Breakfast (416) + Run (-285) logged        ║
║    Remaining: 2 069 kcal ← log lunch/dinner live        ║
╠══════════════════════════════════════════════════════════╣
║  ACCOUNT 2 — Onboarding demo (fresh new user)            ║
║    Email    : demo.fresh@caloriesmart.ai                 ║
║    Password : Demo@123                                   ║
║    State    : onboardingComplete = false                 ║
║    → Login goes straight to TDEE questionnaire           ║
╚══════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌  Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
