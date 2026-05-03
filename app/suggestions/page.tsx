"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { processSuggestionChat } from "./actions";

type SuggestionData = Awaited<ReturnType<typeof processSuggestionChat>>;

export default function SuggestionsPage() {
    const [data, setData] = useState<SuggestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [chatting, setChatting] = useState(false);
    
    useEffect(() => {
        const timeStr = `${new Date().getHours()}:${new Date().getMinutes()}`;
        processSuggestionChat(undefined, timeStr).then(res => {
            setData(res);
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
        setMessages(prev => [...prev, { role: 'user', content: uMsg }]);
        setChatting(true);

        try {
            const timeStr = `${new Date().getHours()}:${new Date().getMinutes()}`;
            const res = await processSuggestionChat(uMsg, timeStr);
            setData(res);
            setMessages(prev => [...prev, { role: 'ai', content: res.suggestionText }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had an error processing that." }]);
        } finally {
            setChatting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
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

            <div className="p-4 max-w-lg mx-auto w-full space-y-6">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                ) : (
                    <>
                        {data && (
                            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm mb-6">
                                <p className="text-sm font-bold text-green-800 uppercase tracking-wide mb-2">Remaining Calories</p>
                                <p className="text-4xl font-black text-green-900">{data.remaining} <span className="text-lg text-green-700">kcal</span></p>
                            </div>
                        )}

                        <div className="space-y-4 mb-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-4 max-w-[85%] rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                        <p className="text-sm font-medium">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {chatting && (
                                <div className="flex justify-start">
                                    <div className="p-4 max-w-[85%] rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm">
                                        <p className="text-sm font-medium animate-pulse">Thinking...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {data?.customFoods && data.customFoods.length > 0 && (
                            <div className="space-y-3 mt-4">
                                <h2 className="font-bold text-sm text-gray-500 uppercase ml-1">Fits your macros</h2>
                                {(data.customFoods as Array<{id: string, name: string, calories: number}>).map((food) => (
                                    <div key={food.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <div>
                                            <p className="font-bold text-gray-900">{food.name}</p>
                                            <p className="text-xs text-gray-500">{food.calories} kcal</p>
                                        </div>
                                        <Link href="/custom-food" className="px-4 py-2 bg-blue-100 text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-200 transition-colors">
                                            Log it
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}

                        {data?.promptForInput && (
                            <form onSubmit={sendMessage} className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:relative md:border-none md:bg-transparent md:p-0 z-50">
                                <div className="flex gap-2 max-w-lg mx-auto">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        placeholder="I'm hungry... or I ate a sandwich"
                                        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:border-blue-500 transition-shadow shadow-sm"
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
