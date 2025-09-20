"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import AnimatedLevelBar from "../ui/animated-level-bar";

export default function ExploreCard({
  name,
  rating,
  ratingCount,
  level,
  need,
  offer,
  deadline,
}: {
  name: string;
  rating: number;
  ratingCount: number;
  level: number;
  need: string;
  offer: string;
  deadline: string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="w-full max-w-[440px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] gap-[15px] flex flex-col relative"
      style={{
        background:
          "radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)",
      }}
    >
      {/* Top Row */}
      <div className="flex justify-between items-start w-full">
        <div className="flex gap-[10px]">
          <Link href="/profile">
            <Image
              src="/assets/defaultavatar.png"
              alt="Avatar"
              width={25}
              height={25}
              className="rounded-full cursor-pointer"
            />
          </Link>

          <div className="flex flex-col gap-[5px]">
            <span className="text-base font-medium">{name}</span>
            <div className="flex gap-[15px] items-center text-sm text-white/90">
              {/* Rating */}
              <div className="flex gap-1 items-center">
                <Icon
                  icon="mdi:star"
                  className="text-[#B18AFF]"
                  width={14}
                  height={14}
                />
                <span className="font-bold">{rating.toFixed(1)}</span>
                <span className="text-white/70">({ratingCount})</span>
              </div>

              {/* Level with Progress Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex gap-1 items-center">
                  <Image
                    src="/assets/lvlrank_icon.png"
                    alt="Level"
                    width={12}
                    height={12}
                  />
                  <span className="text-white/80">LVL {level}</span>
                </div>
                <AnimatedLevelBar
                  level={level}
                  currentXp={Math.floor(Math.random() * 80) + 20} // Random progress between 20-100%
                  maxXp={100}
                  width={80}
                  height={8}
                  showLevel={false}
                  showXpNumbers={false}
                  animationDelay={200}
                  animationDuration={800}
                  gradient="purple"
                  className="ml-[13px]" // Align with the level text
                />
              </div>
            </div>
          </div>
        </div>

        {/* More Options */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}>
            <Icon icon="mdi:dots-horizontal" className="text-white text-xl" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-[160px] bg-[#1A0F3E] rounded-[10px] border border-[#2B124C] z-10 shadow-lg">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                <Icon
                  icon="mdi:alert-circle-outline"
                  className="text-white text-base"
                />
                Report
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#2C1C52] w-full">
                <Icon
                  icon="mdi:eye-off-outline"
                  className="text-white text-base"
                />
                Not Interested
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Needs + Can Offer Row */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        {/* Needs (Left-aligned) */}
        <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-start">
          <span className="text-sm text-white/80 font-medium">Needs</span>
          <div className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#5A5AFF] bg-[#5A5AFF33] text-sm text-white/90 w-fit">
            {need}
          </div>
        </div>

        {/* Can Offer (Right-aligned) */}
        <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-end">
          <span className="text-sm text-white/80 font-medium">Can offer</span>
          <div className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#906EFF] bg-[#906EFF33] text-sm text-white/90 w-fit text-right">
            {offer}
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="mt-[0px] flex justify-end">
        <span className="text-sm text-white/50">{deadline}</span>
      </div>

      {/* CTA Button */}
      <div className="mt-[0px] flex justify-center">
        <Link href="/signin">
          <Button
            variant="default"
            size="default"
            className="px-[30px] py-[10px] text-white bg-[#0038FF] hover:bg-[#1a4dff] rounded-[15px] shadow-[0_0_15px_0_#284CCC] text-sm font-medium"
          >
            I'm interested
          </Button>
        </Link>
      </div>
    </div>
  );
}
