"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { processSuggestionChat } from "./actions";
import { logCustomFood } from "../custom-food/actions";

type SuggestionData = Awaited<ReturnType<typeof processSuggestionChat>>;
type PendingItems = SuggestionData['pendingItems'];
type Message = { role: 'user' | 'ai' | 'logged' | 'favorited'; content: string };

export default function SuggestionsPage() {
    const [data, setData] = useState<SuggestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [chatting, setChatting] = useState(false);
    const [pendingItems, setPendingItems] = useState<PendingItems>(undefined);

    useEffect(() => {
        const timeStr = `${new Date().getHours()}:${new Date().getMinutes()}`;
        processSuggestionChat(undefined, timeStr, [], undefined).then(res => {
            setData(res);
            setPendingItems(res.pendingItems);
            setMessages([{ role: 'ai', content: res.suggestionText }]);
            setLoading(false);
        }).catch(() => {
            alert("Error loading suggestions");
            setLoading(false);
        });
    }, []);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || chatting) return;

        const uMsg = inputValue.trim();
        setInputValue("");

        // Snapshot current messages for history (exclude confirmation pills)
        const historyForServer = messages
            .filter(m => m.role === 'user' || m.role === 'ai')
            .map(m => ({ role: m.role as 'user' | 'ai', content: m.content }));

        setMessages(prev => [...prev, { role: 'user', content: uMsg }]);
        setChatting(true);

        try {
            const timeStr = `${new Date().getHours()}:${new Date().getMinutes()}`;
            const res = await processSuggestionChat(uMsg, timeStr, historyForServer, pendingItems);
            setData(res);
            setPendingItems(res.pendingItems);

            const newMsgs: Message[] = [];

            if (res.favoritedItem) {
                newMsgs.push({ role: 'favorited', content: `♥ Added to Favorites — ${res.favoritedItem.name}` });
            }
            if (res.loggedItems && res.loggedItems.length > 0) {
                const totalCal = res.loggedItems.reduce((s, i) => s + i.calories, 0);
                const itemsList = res.loggedItems.map(i => `${i.name} (${i.calories} kcal)`).join(', ');
                newMsgs.push({ role: 'logged', content: `✅ Logged ${totalCal} kcal — ${itemsList}` });
            }
            newMsgs.push({ role: 'ai', content: res.suggestionText });
            setMessages(prev => [...prev, ...newMsgs]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had an error processing that." }]);
        } finally {
            setChatting(false);
        }
    };

    const handleLogFood = async (foodId: string) => {
        try {
            const hour = new Date().getHours();
            let mealType = "Breakfast";
            if (hour >= 11 && hour < 16) mealType = "Lunch";
            else if (hour >= 16 && hour < 22) mealType = "Dinner";
            else if (hour >= 22 || hour < 5) mealType = "Snack";

            await logCustomFood(foodId, mealType);
            alert("Logged!");

            const timeStr = `${new Date().getHours()}:${new Date().getMinutes()}`;
            const res = await processSuggestionChat(undefined, timeStr, [], undefined);
            setData(res);
            setPendingItems(res.pendingItems);
        } catch (e) {
            console.error(e);
            alert("Failed to log food");
        }
    };

    const hasPending = pendingItems && pendingItems.length > 0;

    return (
        <main className="min-h-screen bg-gray-50 pb-28">
            <header className="bg-white px-4 pt-12 pb-6 shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <Link href="/" className="text-gray-400 hover:text-gray-900 transition-colors p-2 -ml-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div className="flex flex-col items-end">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Smart Suggestions</h1>
                </div>
            </header>

            <div className="p-4 max-w-lg mx-auto w-full space-y-4">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : (
                    <>
                        {/* Remaining calories */}
                        {data && (
                            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm">
                                <p className="text-sm font-bold text-green-800 uppercase tracking-wide mb-2">Remaining Calories</p>
                                <p className="text-4xl font-black text-green-900">{data.remaining} <span className="text-lg text-green-700">kcal</span></p>
                            </div>
                        )}

                        {/* Chat messages */}
                        <div className="space-y-4">
                            {messages.map((msg, i) => {
                                if (msg.role === 'logged') {
                                    return (
                                        <div key={i} className="flex justify-center">
                                            <div className="px-4 py-2 bg-green-100 border border-green-200 text-green-800 rounded-2xl text-xs font-bold max-w-[90%] text-center">
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                }
                                if (msg.role === 'favorited') {
                                    return (
                                        <div key={i} className="flex justify-center">
                                            <div className="px-4 py-2 bg-pink-100 border border-pink-200 text-pink-800 rounded-2xl text-xs font-bold max-w-[90%] text-center">
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-4 max-w-[85%] rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                            <p className="text-sm font-medium">{msg.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {chatting && (
                                <div className="flex justify-start">
                                    <div className="p-4 max-w-[85%] rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm">
                                        <p className="text-sm font-medium animate-pulse">Thinking...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Pending confirmation card ─────────────────────────────── */}
                        {hasPending && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-500 text-lg">⏳</span>
                                    <p className="text-xs font-black text-amber-800 uppercase tracking-wide">Pending — awaiting your confirmation</p>
                                </div>
                                <div className="space-y-2">
                                    {pendingItems!.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white rounded-xl px-3 py-2 border border-amber-100">
                                            <span className="text-sm font-bold text-gray-900 capitalize">{item.name}</span>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-gray-900">{Math.round(item.nutrition.calories)} kcal</span>
                                                <span className="text-xs text-gray-400 ml-2">{item.serving_size_g}g</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 text-xs text-amber-700 font-medium">
                                    <span className="bg-amber-100 rounded-lg px-2 py-1">Say <strong>&quot;yes&quot;</strong> to log</span>
                                    <span className="bg-amber-100 rounded-lg px-2 py-1"><strong>&quot;200g&quot;</strong> to adjust</span>
                                    <span className="bg-amber-100 rounded-lg px-2 py-1"><strong>&quot;no&quot;</strong> to cancel</span>
                                </div>
                            </div>
                        )}

                        {/* Custom food suggestions */}
                        {data?.customFoods && data.customFoods.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="font-bold text-sm text-gray-500 uppercase ml-1">Fits your macros</h2>
                                {(data.customFoods as Array<{ id: string; name: string; calories: number; isFavorite: boolean }>).map((food) => (
                                    <div key={food.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <div>
                                            <p className="font-bold text-gray-900 flex items-center gap-1">
                                                {food.isFavorite && <span className="text-red-500 text-sm">♥</span>}
                                                {food.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{food.calories} kcal</p>
                                        </div>
                                        <button
                                            onClick={() => handleLogFood(food.id)}
                                            className="px-4 py-2 bg-blue-100 text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            Log it
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input bar */}
                        {data?.promptForInput && (
                            <form onSubmit={sendMessage} className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:relative md:border-none md:bg-transparent md:p-0 z-50">
                                <div className="flex gap-2 max-w-lg mx-auto">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        placeholder={hasPending ? `"yes", "no", or "300g" to adjust…` : "I ate a banana… or what should I eat?"}
                                        className={`flex-1 px-4 py-3 bg-white border rounded-2xl focus:outline-none focus:ring-2 focus:border-blue-500 transition-shadow shadow-sm ${hasPending ? 'border-amber-300 focus:ring-amber-400' : 'border-gray-300'}`}
                                        disabled={chatting}
                                    />
                                    <button disabled={!inputValue.trim() || chatting} type="submit" className="px-5 py-3 bg-blue-600 text-white font-bold rounded-2xl disabled:opacity-50 transition-opacity">
                                        Send
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
