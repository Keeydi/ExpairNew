"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { AlertCircle, Check } from "lucide-react";

export function NotificationDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed w-[480px] max-h-[480px] overflow-hidden rounded-[20px] shadow-lg z-[9999]"
      style={{
        background: "#050015",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(25px)",
        top: "80px",
        right: "250px"
      }}
    >
      <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.1)]">
        <h2 className="text-white text-2xl font-semibold">Notifications</h2>
        <button 
          onClick={onClose}
          className="text-[#7B78A4] hover:text-white transition"
        >
          Mark all as read
        </button>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "400px" }}>
        {/* No notifications to display */}
      </div>
    </div>
  );
}

function NotificationItem({ avatar, icon, message, time, isRead, isHighlighted }) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-6 border-b border-[rgba(255,255,255,0.1)] relative",
      isRead ? "opacity-50" : "opacity-100"
    )}>
      {avatar && (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
          <img src={avatar} alt="User avatar" className="w-full h-full object-cover" />
        </div>
      )}
      
      {icon === "match" && (
        <div className="w-8 h-8 rounded-full bg-[#2B124C] flex items-center justify-center shrink-0">
          <div className="text-[#9D71EA] text-lg">✦</div>
        </div>
      )}
      
      {icon === "star" && (
        <div className="w-8 h-8 rounded-full bg-[#2B124C] flex items-center justify-center shrink-0">
          <div className="text-white text-lg">★</div>
        </div>
      )}
      
      {icon === "alert" && (
        <div className="w-8 h-8 rounded-full bg-[#2B124C] flex items-center justify-center shrink-0">
          <AlertCircle className="text-[#FF5E93] w-5 h-5" />
        </div>
      )}
      
      <div className="flex-1">
        <p className="text-white mb-1">{message}</p>
        <p className="text-[#7B78A4] text-sm">{time}</p>
      </div>
      
      {isHighlighted && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          <div className="w-2 h-2 rounded-full bg-[#0038FF]"></div>
        </div>
      )}
    </div>
  );
}