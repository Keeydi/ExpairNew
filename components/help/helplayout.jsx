"use client";

import { Search, X, ChevronLeft } from "lucide-react";
import { Input } from "../ui/input";
import { Inter } from "next/font/google";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Add this import

const inter = Inter({ subsets: ["latin"] });

// ...existing imports...

export default function HelpLayout({ children }) {
  const [searchValue, setSearchValue] = useState("");
  const pathname = usePathname();

  // Dynamic back link: /home/help if in /home, else /help
  const backHref = pathname.startsWith("/home/") ? "/home/help" : "/help";
  const isMainHelpPage = pathname === "/help" || pathname === "/home/help";

  return (
    <div className={`min-h-screen bg-[#050015] text-white ${inter.className}`}>
      <section className="mx-auto max-w-[1440px] px-6 md:px-[80px] lg:px-[250px] pt-[55px]">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-[25px]">
          <h1 className="text-[25px] font-[600]">
            What do you need help with?
          </h1>
          {!isMainHelpPage && (
            <Link
              href={backHref}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#0038FF] hover:bg-[#f0f4ff] transition"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full mb-[35px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-5 h-5" />
          <Input
            type="search"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-10 bg-[#1C1B45] text-white placeholder:text-gray-400 border-none focus:ring-0 w-full
                       [appearance:none] [&::-webkit-search-cancel-button]:hidden"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dynamic Content */}
        {children}
      </section>
    </div>
  );
}
