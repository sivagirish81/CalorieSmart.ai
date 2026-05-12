import { prisma } from "./db";
import { getDayBounds } from "./time";

export async function updateStreak(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

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
      return;
    }

    let newStreak = user.currentStreak;

    if (isWithinBounds && consumed > 0) {
      newStreak += 1;
    } else {
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

/**
 * Rebuilds the streak from scratch by walking backward through meal history.
 * Used when a meal is logged for a past date — the simple "check yesterday"
 * logic would incorrectly reset the streak in that case.
 */
export async function recalculateStreakFromHistory(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    let streak = 0;
    const today = new Date();

    for (let daysAgo = 1; daysAgo <= 90; daysAgo++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - daysAgo);
      const { startOfDay, endOfDay } = getDayBounds(user.timezone, checkDate);

      const meals = await prisma.mealLog.findMany({
        where: { userId, date: { gte: startOfDay, lte: endOfDay } },
        include: { items: true }
      });
      const exercise = await prisma.exerciseLog.findMany({
        where: { userId, date: { gte: startOfDay, lte: endOfDay } }
      });

      let consumed = 0;
      meals.forEach(log => log.items.forEach(item => { consumed += item.calories; }));
      const burned = exercise.reduce((s, l) => s + l.caloriesBurned, 0);
      const net = consumed - burned;

      const inBounds =
        consumed > 0 &&
        net >= user.calorieBound - 300 &&
        net <= user.calorieBound + 300;

      if (inBounds) {
        streak++;
      } else {
        break;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: streak, lastStreakDate: new Date() }
    });
  } catch (error) {
    console.error("Error recalculating streak from history:", error);
  }
}
