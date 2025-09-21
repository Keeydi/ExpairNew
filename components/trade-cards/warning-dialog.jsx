"use client";

import { X } from "lucide-react";

export default function WarningDialog({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative w-[90%] max-w-[700px] h-auto min-h-[220px] flex flex-col items-center justify-center bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 px-4 md:px-[50px] py-[40px] md:py-[60px]">
        {/* Close button */}
        <button 
          className="absolute top-[20px] right-[20px] text-white hover:text-gray-300 cursor-pointer"
          onClick={onClose}
        >
          <X className="w-[15px] h-[15px]" />
        </button>
        
        <h2 className="font-bold text-[20px] md:text-[22px] text-center text-white w-full max-w-[500px] mb-[20px]">
          Are you sure that the trade details are accurate?
        </h2>
        
        <div className="flex flex-col items-center gap-[15px] w-full max-w-[500px]">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-[25px]">
            <button 
              className="w-full sm:w-[160px] h-[40px] flex justify-center items-center border-2 border-[#0038FF] text-[#0038FF] rounded-[15px] hover:bg-[#0038FF]/10 transition-colors cursor-pointer shadow-[0px_0px_15px_#284CCC]"
              onClick={onClose}
            >
              <span className="text-[16px]">No</span>
            </button>
            <button 
              className="w-full sm:w-[168px] h-[40px] flex justify-center items-center bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors cursor-pointer"
              onClick={onConfirm}
            >
              <span className="text-[16px]">Yes</span>
            </button>
          </div>
          
          <p className="text-[13px] text-white/60 text-center">
            Please review the trade details carefully. Once confirmed, changes will no longer be allowed.
          </p>
        </div>
      </div>
    </div>
  );
}
