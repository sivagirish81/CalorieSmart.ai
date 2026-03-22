"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";

export default function Login() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-md mb-6">
            🥗
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">CalorieSmart<span className="text-blue-600">.ai</span></h1>
          <p className="text-gray-500 font-medium text-sm">Sign in to your nutrition portfolio</p>
        </div>

        <form action={formAction} className="space-y-5 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="student@university.edu"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-inner transition-colors focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 shadow-inner transition-colors focus:bg-white"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100 text-center animate-in fade-in">
              {state.error}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 text-white bg-blue-600 rounded-2xl font-bold transition-all shadow-md hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
            >
              {isPending ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Log In"
              )}
            </button>
          </div>
        </form>
        
        <p className="text-center text-sm text-gray-500 font-medium pt-4 border-t border-gray-100">
          Don&apos;t have an account? <Link href="/signup" className="text-blue-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
