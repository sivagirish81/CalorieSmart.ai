import Link from "next/link";

export default function Dashboard() {
  const consumed = 1450;
  const limit = 2000;
  const remaining = limit - consumed;
  const percentage = (consumed / limit) * 100;

  const getProgressBarColor = () => {
    if (percentage < 70) return "bg-green-500";
    if (percentage < 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Today</h1>
          <p className="text-gray-500">March 1, 2026</p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black text-blue-600">{remaining}</span>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">kcal left</p>
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

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/search"
            className="flex flex-col items-center justify-center p-6 bg-blue-600 text-white rounded-3xl transition-transform hover:scale-[0.98] active:scale-95"
          >
            <span className="text-2xl mb-1">🔍</span>
            <span className="text-sm font-semibold">Log Meal</span>
          </Link>
          <button
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-3xl transition-transform hover:scale-[0.98] active:scale-95"
          >
            <span className="text-2xl mb-1 text-gray-900">🤖</span>
            <span className="text-sm font-semibold text-gray-700">Get Suggestion</span>
          </button>
        </div>
      </div>

      {/* Recent Meals (Mock) */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Today&apos;s Meals</h2>
          <button className="text-blue-600 text-sm font-semibold">See All</button>
        </div>
        <div className="space-y-3">
          {[
            { name: "Avocado Toast", time: "8:30 AM", kcal: 450, type: "Breakfast" },
            { name: "Chicken Quinoa Bowl", time: "1:00 PM", kcal: 650, type: "Lunch" },
            { name: "Greek Yogurt", time: "4:15 PM", kcal: 350, type: "Snack" },
          ].map((meal, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                  {meal.type === "Breakfast" ? "🍳" : meal.type === "Lunch" ? "🥗" : "🍎"}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">{meal.name}</p>
                  <p className="text-xs text-gray-400">{meal.time}</p>
                </div>
              </div>
              <p className="font-bold text-sm text-gray-700">+{meal.kcal} kcal</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
