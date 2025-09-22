"use client";

import { X, Check } from "lucide-react";

export default function RejectDialog({ isOpen, onClose, onReject }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Dialog */}
      <div className="relative w-[940px] h-[274px] flex flex-col justify-center items-center p-[98.5px_74px] bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 isolate">
        {/* Close button */}
        <button 
          className="absolute top-[35px] right-[35px] text-white cursor-pointer flex items-center justify-center w-[30px] h-[30px] bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X className="w-[15px] h-[15px]" />
        </button>
        
        {/* Title */}
        <h2 className="w-[590px] h-[60px] font-bold text-[25px] leading-[120%] text-center text-white mb-[25px]">
          Are you sure you want to reject this trade?
        </h2>
        
        {/* Action section */}
        <div className="flex flex-col items-center gap-[25px] w-[792px]">
          <div className="flex flex-row justify-center items-center gap-[50px] w-[792px] h-[70px]">
            <div className="flex items-center gap-[15px]">
              {/* Reject button */}
              <button 
                className="flex flex-row justify-center items-center p-[16px] gap-[10px] w-[70px] h-[70px] filter drop-shadow-[0px_0px_15px_#284CCC] cursor-pointer relative"
                onClick={onReject}
              >
                <div className="absolute inset-0 bg-[#0038FF] rounded-[100px]"></div>
                <Check className="w-[35px] h-[25px] text-white z-10" />
              </button>
              
              <span className="font-medium text-[20px] leading-[120%] text-white">
                Yes. Reject this trade.
              </span>
            </div>
          </div>
          
          {/* Warning message */}
          <p className="w-[702px] text-[13px] leading-[120%] text-center text-white/60">
            This action is irreversible. Once deleted, the proposed trade will disappear from your dashboard and communications with your trade partner will cease. Please think carefully about this decision.
          </p>
        </div>
      </div>
    </div>
  );
}