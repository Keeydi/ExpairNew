"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";

export default function ViewProofDialog({ isOpen, onClose, trade }) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    // In a real application, this would trigger a file download
    console.log("Downloading proof for", trade?.name);
  };

  const handleApprove = () => {
    setShowApproveConfirm(true);
  };

  const handleConfirmApprove = () => {
    // Handle the approval action
    console.log("Approved proof for", trade?.name);
    setShowApproveConfirm(false);
    // Close the dialog - parent component will show success dialog
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div 
          className="w-[618px] h-[643px] flex flex-col items-center justify-center p-[50px] relative"
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
            <h2 className="text-[25px] font-bold text-white text-center">

              {trade?.firstname}&apos;s proof
            </h2>

            {/* Proof Image */}
            <div className="w-[470px] h-[250px] border-2 border-white rounded-[25px] overflow-hidden">
              <Image
                src="/defaultavatar.png" // This would be the actual proof image
                alt="Proof"
                width={470}
                height={250}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Question and Disclaimer */}
            <div className="flex flex-col items-center gap-[20px] w-full">
              <p className="text-[16px] text-white text-center">
                Is {trade?.name}&apos;s output or service satisfactory?
              </p>
              
              <p className="text-[13px] text-white/40 text-center max-w-[445px]">
                Please review the uploaded proof carefully. You are responsible for 
                verifying its validity. Expair is not liable for any harm, misconduct, or 
                disputes arising from user-submitted files. Report any suspicious 
                activity immediately.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center w-full mt-auto">
              <button 
                onClick={handleDownload}
                className="flex items-center gap-[15px] text-white hover:text-white/80 transition-colors"
              >
                <Icon icon="lucide:download" className="w-[30px] h-[30px]" />
                <span className="text-[16px]">Download</span>
              </button>
              
              <button
                onClick={handleApprove}
                className="w-[172px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC]"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div 
            className="w-[618px] h-[274px] flex flex-col items-center justify-center p-[50px] relative"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "2px solid #0038FF",
              boxShadow: "0px 4px 15px #D78DE5",
              backdropFilter: "blur(40px)",
              borderRadius: "15px"
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowApproveConfirm(false)}
              className="absolute top-[26px] right-[26px] text-white hover:text-gray-300"
            >
              <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
            </button>

            <div className="flex flex-col items-center gap-[30px] w-[470px]">
              <h2 className="text-[25px] font-bold text-white text-center">
                Are you sure you want to approve their output?
              </h2>

              <div className="flex gap-[25px]">
                <button
                  onClick={() => setShowApproveConfirm(false)}
                  className="w-[160px] h-[40px] border-2 border-[#0038FF] rounded-[15px] text-[#0038FF] text-[16px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApprove}
                  className="w-[168px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      

    </>
  );
}