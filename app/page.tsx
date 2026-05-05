import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StreakBanner from "@/components/StreakBanner";
import WeeklyChart from "@/components/WeeklyChart";
import MacroChart from "@/components/MacroChart";
import { getDayBounds } from "@/lib/time";
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
  const { startOfDay, endOfDay } = getDayBounds(user.timezone);

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
      items: true 
    },
    orderBy: {
      date: 'desc'
    }
  });

  const todaysExercise = await prisma.exerciseLog.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      }
    }
  });
  const exerciseBurned = todaysExercise.reduce((sum, log) => sum + log.caloriesBurned, 0);

  // Fetch past 7 days for Chart
  const d7 = new Date();
  d7.setDate(d7.getDate() - 6);
  const { startOfDay: sevenDaysAgo } = getDayBounds(user.timezone, d7);

  const streakMeals = await prisma.mealLog.findMany({
    where: { userId: user.id, date: { gte: sevenDaysAgo } },
    include: { items: true }
  });

  const dailyTotals: Record<string, number> = {};
  streakMeals.forEach((log: { date: Date; items: Array<{ calories: number }> }) => {
      const dateStr = log.date.toLocaleDateString("en-US", { timeZone: user.timezone });
      if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
      log.items.forEach((item: { calories: number }) => { dailyTotals[dateStr] += item.calories; });
  });

  // Prepare chart data for the past 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { timeZone: user.timezone });
      const dayName = d.toLocaleDateString("en-US", { weekday: 'short', timeZone: user.timezone });
      chartData.push({
          date: dayName,
          calories: Math.round(dailyTotals[dateStr] || 0)
      });
  }

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
  const netCalories = consumed - exerciseBurned; // can be negative if burned > eaten
  const remaining = Math.max(0, limit - netCalories);
  const percentage = Math.min(100, Math.max(0, (netCalories / limit) * 100));

  const todayStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: user.timezone });

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

  // Get current hour in user's local timezone for fun warnings
  const currentHour = parseInt(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: user.timezone }));
  let funWarning = null;
  if (netCalories > limit) {
      if (currentHour >= 21 || currentHour < 4) {
          funWarning = "Whoa there night owl! 🦉 You're eating late AND you've overshot your calories for the day... step away from the fridge! 🛑";
      } else {
          funWarning = "Hey, you better stop now! 🛑 You are officially overshooting your calorie count for the day!";
      }
  } else if (netCalories > limit * 0.9 && (currentHour >= 21 || currentHour < 4)) {
      funWarning = "Late night snacking? 🌙 You are dangerously close to your calorie limit. Watch out!";
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <StreakBanner streak={user.currentStreak} />
      
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
          <Link href="/profile" className="p-3 bg-white/50 backdrop-blur-md rounded-full hover:bg-white/80 transition-all border border-white shadow-sm hover:shadow-md hover:-translate-y-0.5">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </Link>
        </div>
      </header>

      {/* Progress Card */}
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-blue-900/5 border border-white/60 hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-gray-600">Daily Progress</span>
          <span className="text-sm font-bold text-gray-900">{Math.round(percentage)}%</span>
        </div>
        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${percentage < 70 ? 'from-green-400 to-emerald-500' : percentage < 95 ? 'from-yellow-400 to-amber-500' : 'from-red-400 to-rose-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-6">
          <div className="bg-white/50 p-3 rounded-2xl border border-white shadow-inner flex flex-col items-center">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Consumed</p>
            <p className="text-lg font-black text-gray-900 tracking-tight">{consumed}</p>
          </div>
          <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100 shadow-inner flex flex-col items-center">
            <p className="text-[10px] uppercase font-bold text-orange-600 mb-1">Burned</p>
            <p className="text-lg font-black text-orange-600 tracking-tight">{exerciseBurned}</p>
          </div>
          <div className="bg-white/50 p-3 rounded-2xl border border-white shadow-inner flex flex-col items-center">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Limit</p>
            <p className="text-lg font-black text-gray-900 tracking-tight">{limit}</p>
          </div>
        </div>

        {user.proteinGoalG && user.carbsGoalG && user.fatGoalG && (
          <div className="mt-6 space-y-3 bg-white/30 p-4 rounded-2xl border border-white shadow-inner">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span>Protein</span>
                <span>{Math.round(totalProtein)}g / {user.proteinGoalG}g</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (totalProtein / user.proteinGoalG) * 100)}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span>Carbs</span>
                <span>{Math.round(totalCarbs)}g / {user.carbsGoalG}g</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${Math.min(100, (totalCarbs / user.carbsGoalG) * 100)}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span>Fat</span>
                <span>{Math.round(totalFat)}g / {user.fatGoalG}g</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: `${Math.min(100, (totalFat / user.fatGoalG) * 100)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Macro Split Chart */}
      <MacroChart protein={totalProtein} carbs={totalCarbs} fat={totalFat} />

      {/* Quick Actions & Water */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          <Link
            href="/search"
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 active:scale-95 shadow-md border border-blue-400/50"
          >
            <span className="text-xl mb-1">🔍</span>
            <span className="text-[10px] font-bold text-center leading-tight">NLP</span>
          </Link>
          <Link
            href="/photo-log"
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-3xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95 shadow-md border border-emerald-400/50"
          >
            <span className="text-xl mb-1">📸</span>
            <span className="text-[10px] font-bold text-center leading-tight">Photo</span>
          </Link>
          <Link
            href="/barcode"
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-3xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 active:scale-95 shadow-md border border-orange-400/50"
          >
            <span className="text-xl mb-1">🏷️</span>
            <span className="text-[10px] font-bold text-center leading-tight">Scan</span>
          </Link>
          <Link
            href="/custom-food"
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-3xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 active:scale-95 shadow-md border border-purple-400/50"
          >
            <span className="text-xl mb-1">📝</span>
            <span className="text-[10px] font-bold text-center leading-tight">Lib</span>
          </Link>
          <Link
            href="/suggestions"
            className="flex flex-col items-center justify-center p-3 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-3xl transition-all hover:scale-[1.02] hover:shadow-lg hover:bg-white/80 active:scale-95"
          >
            <span className="text-xl mb-1 text-gray-900">🤖</span>
            <span className="text-[10px] font-bold text-center leading-tight text-gray-700">Coach</span>
          </Link>
          <Link
            href="/analytics"
            className="flex flex-col items-center justify-center p-3 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-3xl transition-all hover:scale-[1.02] hover:shadow-lg hover:bg-white/80 active:scale-95"
          >
            <span className="text-xl mb-1 text-gray-900">📊</span>
            <span className="text-[10px] font-bold text-center leading-tight text-gray-700">Trends</span>
          </Link>
          <Link
            href="/exercise"
            className="flex flex-col items-center justify-center p-3 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-3xl transition-all hover:scale-[1.02] hover:shadow-lg hover:bg-white/80 active:scale-95"
          >
            <span className="text-xl mb-1 text-gray-900">🏃</span>
            <span className="text-[10px] font-bold text-center leading-tight text-gray-700">Gym</span>
          </Link>
          <Link
            href="/weight"
            className="flex flex-col items-center justify-center p-3 bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-3xl transition-all hover:scale-[1.02] hover:shadow-lg hover:bg-white/80 active:scale-95"
          >
            <span className="text-xl mb-1 text-gray-900">⚖️</span>
            <span className="text-[10px] font-bold text-center leading-tight text-gray-700">Body</span>
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
           <div className="p-10 text-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-inner">
             <div className="text-4xl mb-3 opacity-50">🍽️</div>
             <p className="text-gray-500 text-sm font-semibold">No meals logged yet today.</p>
             <p className="text-gray-400 text-xs mt-1">Tap the search icon to log your first meal!</p>
           </div>
        ) : (
          <div className="space-y-3">
            {formattedMeals.map((meal, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:bg-white cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/50 backdrop-blur-md rounded-xl flex items-center justify-center text-xl shadow-inner border border-white">
                    {meal.type === "Breakfast" ? "🍳" : 
                     meal.type === "Lunch" ? "🥗" : 
                     meal.type === "Dinner" ? "🍽️" : 
                     meal.type === "Snack" ? "🍎" : "🍱"}
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
