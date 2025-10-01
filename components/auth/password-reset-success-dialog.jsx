'use client';

import { useRouter } from 'next/navigation';
import { Icon } from "@iconify/react";

export default function PasswordResetSuccessDialog({ isOpen, onClose }) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleReturnToLogin = () => {
    onClose();
    router.push('/signin');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="w-[500px] flex flex-col items-center justify-center p-[50px] relative"
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
          onClick={onClose}
          className="absolute top-[35px] right-[35px] text-white hover:text-gray-300"
        >
          <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
        </button>

        <div className="flex flex-col items-center gap-[25px]">
          {/* Check icon */}
          <div className="w-[50px] h-[50px] rounded-full bg-[#0038FF] flex items-center justify-center shadow-[0px_0px_15px_#284CCC]">
            <Icon icon="lucide:check" className="w-[35px] h-[25px] text-white" />
          </div>
          
          {/* Message */}
          <h2 className="text-white text-[25px] font-bold text-center">
            Your password has successfully been reset!
          </h2>
          
          {/* Return to Login button */}
          <button 
            onClick={handleReturnToLogin}
            className="flex items-center justify-center w-[224px] h-[40px] bg-[#0038FF] text-white rounded-[15px] shadow-[0px_0px_15px_#284CCC] px-[54px] py-[13px] text-[16px] hover:bg-[#1a4dff] transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}