'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Footer() {
  const pathname = usePathname();
  const isHomePage = pathname.startsWith('/home'); 

  return (
    <footer
      className={`${inter.className} w-full bg-[#120A2A] text-white pt-[39px] pb-[20px] px-6 sm:px-10 md:px-[67px] rounded-t-[30px] sm:rounded-t-[50px] shadow-[0px_-10px_4px_0px_rgba(0,0,0,0.25)]`}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between gap-10 md:gap-0 text-center md:text-left">

        {/* Left Section: Logo + Links */}
        <div>
          <div className="mb-6 flex justify-center md:justify-start items-center">
            <img src="/expair.png" alt="Expair Logo" className="w-[120px] sm:w-[150px] h-auto" />
          </div>

          {/* Conditional links (Landing vs Home) */}
          <ul className="space-y-2 text-[16px] leading-[120%] font-normal">
            <li>
              <Link
                href={isHomePage ? "/home/privacy-policy" : "/privacy-policy"}
                className={`hover:underline ${
                  pathname.endsWith('privacy-policy') ? 'text-white' : 'text-white/50'
                }`}
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href={isHomePage ? "/home/terms" : "/terms"}
                className={`hover:underline ${
                  pathname.endsWith('terms') ? 'text-white' : 'text-white/50'
                }`}
              >
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link
                href={isHomePage ? "/home/about" : "/about"}
                className={`hover:underline ${
                  pathname.endsWith('about') ? 'text-white' : 'text-white/50'
                }`}
              >
                About Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Section: Navigation links */}
        {isHomePage ? (
          <div className="flex flex-col items-center md:items-end text-sm gap-3">
            <Link
              href="/home"
              className="text-white text-[18px] sm:text-[20px] leading-[120%] font-[500] hover:underline"
            >
              Home
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white text-[18px] sm:text-[20px] leading-[120%] font-[500] hover:underline flex items-center gap-1">
                  Trades <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#15042C] text-white border border-[#2B124C]">
                <Link href="/home/trades/pending">
                  <DropdownMenuItem className="text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold">
                    Pending
                  </DropdownMenuItem>
                </Link>
                <Link href="/home/trades/active">
                  <DropdownMenuItem className="text-white data-[highlighted]:bg-transparent data-[highlighted]:text-white data-[highlighted]:font-semibold">
                    Active
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/home/help"
              className="text-white text-[18px] sm:text-[20px] leading-[120%] font-[500] hover:underline"
            >
              Help
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center md:items-end text-sm gap-2">
            <Link
              href="/help"
              className="text-white text-[18px] sm:text-[20px] leading-[120%] font-[500] hover:underline"
            >
              Help
            </Link>
            <Link
              href="/signin"
              className="text-white text-[18px] sm:text-[20px] leading-[120%] font-[700] hover:underline"
              style={{
                textShadow: '0px 0px 15px #284CCC',
              }}
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="mt-10 text-center">
        <p className="text-white text-[14px] sm:text-[16px] leading-[120%] font-normal mb-3">
          Contact us!
        </p>
        <div className="flex justify-center gap-6">
          <a href="mailto:expaircs@gmail.com" className="hover:text-purple-300 transition" aria-label="Email">
            <Icon icon="mdi:email-outline" width="26" className="sm:w-[30px]" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition" aria-label="LinkedIn">
            <Icon icon="mdi:linkedin" width="26" className="sm:w-[30px]" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition" aria-label="Facebook">
            <Icon icon="mdi:facebook" width="26" className="sm:w-[30px]" />
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-8 text-[9px] sm:text-[10px] leading-[12px] font-normal text-white text-center opacity-50 px-2 sm:px-4 max-w-[845px] mx-auto">
        <p>© 2025 Expair. All rights reserved.</p>
        <p className="mt-1">
          The content, design, and functionality of this website are the intellectual property of Expair and may not be copied, reproduced, or distributed without prior written permission. All trademarks, logos, and brand names are the property of their respective owners. Unauthorized use is strictly prohibited.
        </p>
      </div>
    </footer>
  );
}
