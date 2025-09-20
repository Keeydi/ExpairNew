"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function XpGainedDialog({ isOpen, onClose, xpGained = 250, level = 15, currentXp = 650, maxXp = 700 }) {
  if (!isOpen) return null;

  // Calculate progress percentage for the progress bar
  const progressPercentage = (currentXp / maxXp) * 100;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div 
        className="w-[618px] flex flex-col items-center justify-center p-[50px] relative"
        style={{
          background: "rgba(0, 0, 0, 0.05)",
          border: "2px solid #0038FF",
          boxShadow: "0px 4px 15px #D78DE5",
          backdropFilter: "blur(30px)",
          borderRadius: "15px"
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-[30px] right-[30px] text-white hover:text-gray-300"
        >
          <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
        </button>

        <div className="flex flex-col items-center gap-[40px] w-[470px]">
          {/* Title */}
          <h2 className="text-[25px] font-[700] text-white text-center">
            Nice! You gained {xpGained} XP.
          </h2>
          
          {/* Level Progress */}
          <div className="flex flex-col items-center gap-[20px] w-full">
            <div className="flex justify-between items-center w-full">
              <span className="text-[16px] text-white">LVL {level}</span>
              
              {/* Progress Bar */}
              <div className="relative w-[300px] h-[20px] bg-white rounded-[32px] shadow-[0px_5px_19px_rgba(0,0,0,0.15)]">
                <div 
                  className="absolute h-[16px] top-[2px] left-[2px] rounded-[100px]"
                  style={{
                    width: `${progressPercentage}%`,
                    background: "linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)"
                  }}
                ></div>
              </div>
              
              <span className="text-[16px] text-white">{currentXp}/{maxXp}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}