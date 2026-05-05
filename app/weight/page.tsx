import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import WeightForm from "./WeightForm";
import WeightChart from "@/components/WeightChart";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            weightLogs: {
                orderBy: { date: 'asc' }
            }
        }
    });

    if (!user) redirect("/login");

    const chartData = user.weightLogs.map(log => ({
        date: log.date.toLocaleDateString("en-US", { month: 'short', day: 'numeric', timeZone: user.timezone }),
        weight: log.weightKg
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-lg mx-auto">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white/50 backdrop-blur-md rounded-full hover:bg-white/80 transition-all border border-white shadow-sm hover:-translate-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m15 18-6-6 6-6"/></svg>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Weight Tracking</h1>
            </header>

            <WeightForm initialWeight={user.weightKg || 70} />
            <WeightChart data={chartData} />
        </div>
    );
}
