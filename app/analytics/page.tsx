import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { getDayBounds } from "@/lib/time";
import { getWeeklySummary } from "./actions";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) redirect("/login");

    const d30 = new Date();
    d30.setDate(d30.getDate() - 29);
    const { startOfDay: thirtyDaysAgo } = getDayBounds(user.timezone, d30);

    const meals = await prisma.mealLog.findMany({
        where: { userId: user.id, date: { gte: thirtyDaysAgo } },
        include: { items: true },
        orderBy: { date: 'asc' }
    });

    let weeklySummary = "Keep logging your meals for a personalized weekly summary!";
    try {
        weeklySummary = await getWeeklySummary();
    } catch {
        // Groq unavailable — show fallback instead of crashing the page
    }

    const dailyStats: Record<string, { cal: number, pro: number, car: number, fat: number }> = {};
    
    // Initialize 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-US", { month: 'short', day: 'numeric', timeZone: user.timezone });
        dailyStats[dateStr] = { cal: 0, pro: 0, car: 0, fat: 0 };
    }

    meals.forEach(log => {
        const dateStr = log.date.toLocaleDateString("en-US", { month: 'short', day: 'numeric', timeZone: user.timezone });
        if (!dailyStats[dateStr]) dailyStats[dateStr] = { cal: 0, pro: 0, car: 0, fat: 0 };
        log.items.forEach(item => {
            dailyStats[dateStr].cal += item.calories;
            dailyStats[dateStr].pro += item.protein || 0;
            dailyStats[dateStr].car += item.carbs || 0;
            dailyStats[dateStr].fat += item.fat || 0;
        });
    });

    const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        calories: Math.round(stats.cal),
        limit: user.calorieBound
    }));

    let totalCal = 0, totalPro = 0, totalCar = 0, totalFat = 0;
    let daysOnGoal = 0;
    let daysLogged = 0;
    
    const calorieVals = Object.values(dailyStats).map(s => s.cal).filter(c => c > 0);
    
    for (const stats of Object.values(dailyStats)) {
        if (stats.cal > 0) {
            daysLogged++;
            totalCal += stats.cal;
            totalPro += stats.pro;
            totalCar += stats.car;
            totalFat += stats.fat;
            if (stats.cal <= user.calorieBound + 300 && stats.cal >= user.calorieBound - 300) {
                daysOnGoal++;
            }
        }
    }

    const avgCal = daysLogged ? Math.round(totalCal / daysLogged) : 0;
    const avgPro = daysLogged ? Math.round(totalPro / daysLogged) : 0;
    const avgCar = daysLogged ? Math.round(totalCar / daysLogged) : 0;
    const avgFat = daysLogged ? Math.round(totalFat / daysLogged) : 0;
    
    const maxCal = calorieVals.length ? Math.max(...calorieVals) : 0;
    const minCal = calorieVals.length ? Math.min(...calorieVals) : 0;

    const macroData = [
        { name: "Average", protein: avgPro, carbs: avgCar, fat: avgFat }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-lg mx-auto pb-10">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white/50 backdrop-blur-md rounded-full hover:bg-white/80 transition-all border border-white shadow-sm hover:-translate-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m15 18-6-6 6-6"/></svg>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-lg shadow-blue-900/5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Avg / Day</p>
                    <p className="text-2xl font-black text-gray-900">{avgCal} <span className="text-sm font-bold text-gray-400">kcal</span></p>
                </div>
                <div className="bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-lg shadow-blue-900/5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Days on Goal</p>
                    <p className="text-2xl font-black text-gray-900">{daysOnGoal} <span className="text-sm font-bold text-gray-400">/ 30</span></p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-5 rounded-3xl border border-red-100 shadow-sm">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Highest Day</p>
                    <p className="text-xl font-black text-red-700">{Math.round(maxCal)} kcal</p>
                </div>
                <div className="bg-green-50 p-5 rounded-3xl border border-green-100 shadow-sm">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-wide mb-1">Lowest Day</p>
                    <p className="text-xl font-black text-green-700">{Math.round(minCal)} kcal</p>
                </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 shadow-sm">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span>🤖</span> AI Weekly Coach
                </h3>
                <p className="text-sm font-semibold text-blue-800/80 leading-relaxed">{weeklySummary}</p>
            </div>

            <AnalyticsCharts dailyData={chartData} macroData={macroData} />
        </div>
    );
}
