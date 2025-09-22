"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function ConfirmDialog({ isOpen, onClose, trade }) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      onClose();
      // Here you would typically redirect or update the UI
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#15042C] w-[500px] rounded-[20px] border-2 border-[#284CCC]/80 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300"
        >
          <Icon icon="lucide:x" className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#0038FF]/20 flex items-center justify-center">
            <Icon icon="lucide:check-circle" className="w-8 h-8 text-[#0038FF]" />
          </div>

          <h2 className="text-2xl font-bold text-white text-center">
            Confirm Trade Completion
          </h2>

          <p className="text-white/80 text-center">
            Are you sure you want to mark this trade with {trade?.name} as complete? 
            This action will finalize the trade and award {trade?.xp} to your account.
          </p>

          <div className="flex flex-col w-full gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-[45px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-[15px] text-white">
                {submitting ? "Submitting..." : "Confirm Completion"}
              </span>
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              className="w-full h-[45px] flex justify-center items-center bg-transparent border border-white/30 rounded-[10px] cursor-pointer hover:bg-[#1A0F3E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-[15px] text-white">Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}