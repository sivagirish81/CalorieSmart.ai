import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StreakBanner from "@/components/StreakBanner";
import WeeklyChart from "@/components/WeeklyChart";
import MacroChart from "@/components/MacroChart";
// Ensure this page always fetches fresh data on load
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  if (!user) redirect("/login");

  // STRICT PHASE 2 REQUIREMENT: Mandatory Onboarding Pipeline
  if (!user.onboardingComplete) redirect("/onboarding");

  // Calculate today's boundaries
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch today's meal logs
  const todaysMeals = await prisma.mealLog.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      }
    },
    include: {
      // Include the actual food items to get their calories
      items: true 
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Fetch past 7 days for Chart and Streak
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const streakMeals = await prisma.mealLog.findMany({
    where: { userId: user.id, date: { gte: sevenDaysAgo } },
    include: { items: true }
  });

  const dailyTotals: Record<string, number> = {};
  streakMeals.forEach((log: { date: Date; items: Array<{ calories: number }> }) => {
      const dateStr = log.date.toLocaleDateString("en-US");
      if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
      log.items.forEach((item: { calories: number }) => { dailyTotals[dateStr] += item.calories; });
  });

  // Prepare chart data for the past 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US");
      const dayName = d.toLocaleDateString("en-US", { weekday: 'short' });
      chartData.push({
          date: dayName,
          calories: Math.round(dailyTotals[dateStr] || 0)
      });
  }

  const checkStreak = (startIndex: number) => {
      for (let i = startIndex; i < startIndex + 3; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-US");
        const total = dailyTotals[dateStr] || 0;
        if (total < user.calorieBound || total > user.calorieBound + 300) return false;
      }
      return true;
  };
  const streakAchieved = checkStreak(0) || checkStreak(1);

  // Calculate consumed calories & prepare recent meals list
  let consumed = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  const formattedMeals: Array<{ name: string; time: string; kcal: number; type: string }> = [];

  for (const log of todaysMeals) {
    let logTotal = 0;
    for (const item of log.items) {
      logTotal += item.calories;
      totalProtein += item.protein || 0;
      totalCarbs += item.carbs || 0;
      totalFat += item.fat || 0;
      
      // Push each item into our recent meals display
      formattedMeals.push({
        name: item.name,
        time: log.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        kcal: item.calories,
        type: log.type
      });
    }
    consumed += logTotal;
  }

  const limit = user.calorieBound;
  const remaining = Math.max(0, limit - consumed);
  const percentage = Math.min(100, (consumed / limit) * 100);

  const getProgressBarColor = () => {
    if (percentage < 70) return "bg-green-500";
    if (percentage < 95) return "bg-yellow-500";
    return "bg-red-500";
  };

  const todayStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  let nickname = "Clean Eater 🥗";
  if (totalProtein === 0 && totalCarbs === 0 && totalFat === 0) {
      nickname = "Fasting Hero 🧘";
  } else if (totalProtein >= totalCarbs && totalProtein >= totalFat) {
      nickname = "Protein Paladin 🥩";
  } else if (totalCarbs > totalProtein && totalCarbs > totalFat) {
      nickname = "Carb-loader 🍞";
  } else {
      nickname = "Keto Ninja 🥑";
  }

  const currentHour = new Date().getHours();
  let funWarning = null;
  if (consumed > limit) {
      if (currentHour >= 21 || currentHour < 4) {
          funWarning = "Whoa there night owl! 🦉 You're eating late AND you've overshot your calories for the day... step away from the fridge! 🛑";
      } else {
          funWarning = "Hey, you better stop now! 🛑 You are officially overshooting your calorie count for the day!";
      }
  } else if (consumed > limit * 0.9 && (currentHour >= 21 || currentHour < 4)) {
      funWarning = "Late night snacking? 🌙 You are dangerously close to your calorie limit. Watch out!";
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <StreakBanner achieved={streakAchieved} />
      
      {funWarning && (
         <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 font-bold text-sm shadow-sm animate-pulse flex items-center gap-3">
            <span className="text-2xl">⚠️</span> {funWarning}
         </div>
      )}

      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hello, {user.name?.split(' ')[0] || 'Today'}</h1>
          <p className="text-gray-500">{todayStr} • <span className="font-semibold text-blue-600">{nickname}</span></p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-4xl font-black text-blue-600">{Math.round(remaining)}</span>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">kcal left</p>
          </div>
          <Link href="/profile" className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors border border-gray-100">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </Link>
        </div>
      </header>

      {/* Progress Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-gray-600">Daily Progress</span>
          <span className="text-sm font-bold text-gray-900">{Math.round(percentage)}%</span>
        </div>
        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out ${getProgressBarColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-xs text-gray-500 mb-1">Consumed</p>
            <p className="text-xl font-bold text-gray-900">{consumed} <span className="text-xs font-normal">kcal</span></p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-xs text-gray-500 mb-1">Limit</p>
            <p className="text-xl font-bold text-gray-900">{limit} <span className="text-xs font-normal">kcal</span></p>
          </div>
        </div>
      </div>

      {/* Macro Split Chart */}
      <MacroChart protein={totalProtein} carbs={totalCarbs} fat={totalFat} />

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/search"
            className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-3xl transition-transform hover:scale-[0.98] active:scale-95 shadow-md text-center"
          >
            <span className="text-2xl mb-1">🔍</span>
            <span className="text-xs font-semibold">Log NLP</span>
          </Link>
          <Link
            href="/custom-food"
            className="flex flex-col items-center justify-center p-4 bg-purple-600 text-white rounded-3xl transition-transform hover:scale-[0.98] active:scale-95 shadow-md text-center"
          >
            <span className="text-2xl mb-1">📝</span>
            <span className="text-xs font-semibold">Custom</span>
          </Link>
          <Link
            href="/suggestions"
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-3xl transition-transform hover:scale-[0.98] active:scale-95 text-center shadow-sm"
          >
            <span className="text-2xl mb-1 text-gray-900">🤖</span>
            <span className="text-xs font-semibold text-gray-700">Suggest</span>
          </Link>
        </div>
      </div>

      {/* Weekly Chart */}
      <WeeklyChart data={chartData} limit={limit} />

      {/* Recent Meals (Dynamic) */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Today&apos;s Meals</h2>
          <Link href="/history" className="text-blue-600 text-sm font-semibold hover:underline">See All</Link>
        </div>
        
        {formattedMeals.length === 0 ? (
           <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
             <p className="text-gray-500 text-sm font-medium">No meals logged yet today.</p>
           </div>
        ) : (
          <div className="space-y-3">
            {formattedMeals.map((meal, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                    {/* Simplified icon logic */}
                    {meal.type === "Meal" ? "🥗" : "🍎"}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800 capitalize">{meal.name}</p>
                    <p className="text-xs text-gray-400">{meal.time}</p>
                  </div>
                </div>
                <p className="font-bold text-sm text-gray-700">+{meal.kcal} kcal</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
