import { prisma } from "./db";
import { getDayBounds } from "./time";

export async function updateStreak(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // We look at yesterday's total calories
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const { startOfDay, endOfDay } = getDayBounds(user.timezone, d);

    const yesterdaysMeals = await prisma.mealLog.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfDay, lte: endOfDay }
      },
      include: { items: true }
    });

    const yesterdaysExercise = await prisma.exerciseLog.findMany({
      where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } }
    });

    let consumed = 0;
    for (const log of yesterdaysMeals) {
      for (const item of log.items) {
        consumed += item.calories;
      }
    }
    const burned = yesterdaysExercise.reduce((s, l) => s + l.caloriesBurned, 0);
    const netCalories = consumed - burned;

    // Streak counts if net calories are within ±300 of goal
    const isWithinBounds = netCalories >= user.calorieBound - 300 && netCalories <= user.calorieBound + 300;

    // See if we already processed for today's boundary
    const todayStart = getDayBounds(user.timezone, new Date()).startOfDay;
    
    if (user.lastStreakDate && user.lastStreakDate >= todayStart) {
      return; // Already processed streak update today
    }

    let newStreak = user.currentStreak;

    if (isWithinBounds && consumed > 0) { // consumed > 0 ensures they actually logged food
      // We increment
      newStreak += 1;
    } else {
      // Yesterday was not in bounds or 0 (missed logging), reset
      newStreak = 0;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        lastStreakDate: new Date()
      }
    });
  } catch (error) {
    console.error("Error updating streak:", error);
  }
}
