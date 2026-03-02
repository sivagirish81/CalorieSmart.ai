"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 md:top-0 md:bottom-auto">
      <Link 
        href="/" 
        className={`flex flex-col items-center gap-1 ${pathname === "/" ? "text-blue-600" : "text-gray-500"}`}
      >
        <span className="text-xs font-medium">Dashboard</span>
      </Link>
      <Link 
        href="/search" 
        className={`flex flex-col items-center gap-1 ${pathname === "/search" ? "text-blue-600" : "text-gray-500"}`}
      >
        <span className="text-xs font-medium">Search</span>
      </Link>
    </nav>
  );
}
