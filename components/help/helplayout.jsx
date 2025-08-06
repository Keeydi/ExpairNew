"use client";

import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Inter } from "next/font/google";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function HelpLayout({ children }) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className={`min-h-screen bg-[#050015] text-white ${inter.className}`}>
      <section className="mx-auto max-w-[1440px] px-6 md:px-[80px] lg:px-[250px] pt-[55px]">
        {/* Title */}
        <h1 className="text-[25px] font-[600] mb-[25px]">
          What do you need help with?
        </h1>

        {/* Search Bar */}
        <div className="relative w-full mb-[35px]">
          {/* Search Icon sa kaliwa */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white w-5 h-5" />
          
          {/* Input Field */}
          <Input
            type="search"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-10 bg-[#1C1B45] text-white placeholder:text-gray-400 border-none focus:ring-0 w-full
                       [appearance:none] [&::-webkit-search-cancel-button]:hidden"
          />

          {/* Clear Button */}
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
