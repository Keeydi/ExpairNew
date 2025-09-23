"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { Icon } from "@iconify/react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  setSelectedPartner, // for resetting selected partner
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen && !showSuccess) return null;


  const handleConfirm = async () => {
  setSubmitting(true);
  
  try {
    // Call the parent's onConfirm which should handle the API call
    if (onConfirm) {
      await onConfirm();
    }
    
    setSubmitting(false);
    setShowSuccess(true);
  } catch (error) {
    console.error('Error in confirm dialog:', error);
    setSubmitting(false);
  }
};

  const handleGoToActiveTrades = () => {
    setShowSuccess(false);
    if (setSelectedPartner) setSelectedPartner(null);
    if (onConfirm) onConfirm(); // Call the parent callback to close all dialogs
    router.push("/home/trades/active");
  };

  // Handle close with proper cleanup
  const handleClose = () => {
    setShowSuccess(false);
    setSubmitting(false);
    onClose();
  };

  return (
    <>
      {/* Main Confirm Dialog */}
      {isOpen && !showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={handleClose}
          ></div>

          {/* Dialog */}
          <div className="relative w-[940px] h-[274px] flex flex-col justify-center items-center p-[98.5px_74px] bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 isolate">
            {/* Close button */}
            <button
              className="absolute top-[35px] right-[35px] text-white cursor-pointer flex items-center justify-center w-[30px] h-[30px] bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              onClick={handleClose}
              aria-label="Close dialog"
              type="button"
            >
              <X className="w-[15px] h-[15px]" />
            </button>

            {/* Title */}
            <h2 className="w-[590px] h-[60px] font-bold text-[25px] leading-[120%] text-center text-white mb-[25px]">
              Are you sure you want to confirm this trade?
            </h2>

            {/* Action section */}
            <div className="flex flex-col items-center gap-[25px] w-[792px]">
              <div className="flex flex-row justify-center items-center gap-[50px] w-[792px] h-[70px]">
                <div className="flex items-center gap-[15px]">
                  {/* Confirm button */}
                  <button
                    className="flex flex-row justify-center items-center p-[16px] gap-[10px] w-[70px] h-[70px] filter drop-shadow-[0px_0px_15px_#284CCC] cursor-pointer relative disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirm}
                    disabled={submitting}
                    type="button"
                  >
                    <div className="absolute inset-0 bg-[#0038FF] rounded-[100px]"></div>
                    <Check className="w-[35px] h-[25px] text-white z-10" />
                  </button>

                  <span className="font-medium text-[20px] leading-[120%] text-white">
                    {submitting ? "Activating..." : "Yes. Activate this trade."}
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="w-[702px] text-[13px] leading-[120%] text-center text-white/60">
                Please exercise caution when proceeding with trades with other
                users. Expair is not liable for any losses arising from this
                trade. All trades are handled solely by its users and it is the
                user's discretion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70]">
          <div
            className="w-[618px] h-[274px] flex flex-col items-center justify-center p-[50px] relative"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "2px solid #0038FF",
              boxShadow: "0px 4px 15px #D78DE5",
              backdropFilter: "blur(40px)",
              borderRadius: "15px",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowSuccess(false);
                if (onConfirm) onConfirm(); // Close all dialogs including parent
              }}
              className="absolute top-[26px] right-[26px] text-white hover:text-gray-300"
              type="button"
            >
              <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
            </button>

            <div className="flex flex-col items-center gap-[30px] w-[470px]">
              <h2 className="text-[25px] font-semibold text-white text-center">
                Success! Added to your active trades.
              </h2>

              <button
                onClick={handleGoToActiveTrades}
                className="w-[258px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
                type="button"
              >
                Go to Active Trades
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
