import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  if (!user) redirect("/login");

  // Get the date 14 days ago (start of day)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  // Fetch meal logs from the last 14 days
  const mealLogs = await prisma.mealLog.findMany({
    where: {
      userId: user.id,
      date: {
        gte: fourteenDaysAgo
      }
    },
    include: {
      items: true
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Group by date string (e.g. "April 9, 2026")
  const groupedLogs: Record<string, { totalKcal: number; logs: typeof mealLogs }> = {};
  const sortedDateStrs: string[] = [];

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", weekday: "long" });
    sortedDateStrs.push(dateStr);
    groupedLogs[dateStr] = { totalKcal: 0, logs: [] };
  }

  mealLogs.forEach((log: any) => {
    const dateStr = log.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", weekday: "long" });
    if (groupedLogs[dateStr]) {
      groupedLogs[dateStr].logs.push(log);
      
      // add up the kcal
      let logTotal = 0;
      log.items.forEach((item: any) => { logTotal += item.calories; });
      groupedLogs[dateStr].totalKcal += logTotal;
    }
  });

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 pt-12 pb-6 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
            </svg>
        </Link>
        <div className="flex flex-col items-end">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Meal History</h1>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Last 14 Days</span>
        </div>
      </header>
      <div className="p-4 max-w-lg mx-auto w-full space-y-8 mt-4">
        {sortedDateStrs.map(dateStr => {
          const { totalKcal, logs } = groupedLogs[dateStr];
          return (
            <div key={dateStr} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end border-b border-gray-200 pb-2 px-1">
                <h2 className="text-lg font-bold text-gray-900">{dateStr}</h2>
                <div className="text-right">
                  <span className={`font-bold ${totalKcal > user.calorieBound ? 'text-red-500' : 'text-green-500'}`}>{totalKcal} kcal</span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total</p>
                </div>
              </div>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 border-dashed flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-medium text-gray-500 mb-3">No meals logged on this day.</p>
                    <Link href={`/search?date=${dateStr}`} className="text-xs font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
                      Log a Meal
                    </Link>
                  </div>
                ) : (
                  logs.map((log: any) => (
                    <div key={log.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg">{log.type}</span>
                        <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">{log.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="space-y-3 mt-4">
                        {log.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-colors hover:bg-gray-100/50">
                              <div className="flex flex-col pr-4">
                                  <span className="font-bold text-sm text-gray-900 capitalize leading-tight">{item.name}</span>
                                  {item.servingSizeG && <span className="text-xs text-gray-500 mt-1 font-medium">{item.servingSizeG}g serving</span>}
                              </div>
                              <div className="text-right shrink-0">
                                  <span className="font-bold text-gray-900 text-lg">{item.calories} <span className="text-xs font-normal text-gray-400">kcal</span></span>
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
