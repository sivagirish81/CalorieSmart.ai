"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const hiddenPaths = ['/login', '/signup', '/onboarding'];
  const isHidden = hiddenPaths.includes(pathname);

  const handleLogout = () => {
    localStorage.removeItem("lastConfettiFired");
    import("next-auth/react").then(({ signOut }) => signOut());
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50 shadow-lg md:top-0 md:bottom-auto md:border-t-0 md:border-b md:shadow-sm${isHidden ? ' hidden' : ''}`}>
      <Link href="/" className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${pathname === "/" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900"}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        <span className="text-[10px] font-semibold">Home</span>
      </Link>

      <Link href="/search" className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${pathname === "/search" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900"}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span className="text-[10px] font-semibold">Search</span>
      </Link>

      <Link href="/suggestions" className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${pathname === "/suggestions" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900"}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
        <span className="text-[10px] font-semibold">Coach</span>
      </Link>

      <Link href="/analytics" className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${pathname === "/analytics" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-900"}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <span className="text-[10px] font-semibold">Analytics</span>
      </Link>

      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors text-gray-500 hover:text-red-600 hover:bg-red-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        <span className="text-[10px] font-semibold">Logout</span>
      </button>

    </nav>
  );
}
