"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, Check } from "lucide-react";
import Image from "next/image";
import ConfirmDialog from "./confirm-dialog";
import RejectDialog from "./reject-dialog";

const StarLogo = () => (
  <svg width="200" height="200" viewBox="0 0 162 181" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0px_4px_40px_#D78DE5]">
    <g filter="url(#filter0_d_2180_7319)">
      <path d="M81 136.5L90.0723 86.5L81 36.5L71.9277 86.5L81 136.5Z" fill="white"/>
      <path d="M40.5917 55.6433L79.8637 94.3593L91.2485 78.4686L40.5917 55.6433Z" fill="#0038FF"/>
      <path d="M121.388 117.215L82.1163 78.4991L70.7315 94.3898L121.388 117.215Z" fill="#0038FF"/>
      <path d="M121.408 55.6433L82.1366 94.3593L70.7517 78.4686L121.408 55.6433Z" fill="#906EFF"/>
      <path d="M40.612 117.215L79.8839 78.4991L91.2688 94.3898L40.612 117.215Z" fill="#906EFF"/>
    </g>
    <defs>
      <filter id="filter0_d_2180_7319" x="-9" y="0.5" width="180" height="180" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="20"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.841408 0 0 0 0 0.553254 0 0 0 0 0.899038 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2180_7319"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2180_7319" result="shape"/>
      </filter>
    </defs>
  </svg>
);

export default function EvaluationDialog({ isOpen, onClose, tradeData, onTradeUpdate }) {

  const { data: session } = useSession();

  // Default values that can be easily adjusted
  const [evaluation, setEvaluation] = useState({
    tradeScore: 8,
    taskComplexity: 60,
    timeCommitment: 50,
    skillLevel: 80,
  });

  // Animated progress states
  const [progress, setProgress] = useState({
    tradeScore: 0,
    taskComplexity: 0,
    timeCommitment: 0,
    skillLevel: 0,
  });  
  
  // State for confirmation dialogs
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  // Update evaluation if tradeData includes these values
  useEffect(() => {
    if (tradeData) {
      setEvaluation(prev => ({
        ...prev,
        tradeScore: tradeData.tradeScore || prev.tradeScore,
        taskComplexity: tradeData.taskComplexity || prev.taskComplexity,
        timeCommitment: tradeData.timeCommitment || prev.timeCommitment,
        skillLevel: tradeData.skillLevel || prev.skillLevel,
      }));
    }
  }, [tradeData]);


  // Trigger staggered animations after evaluation updates
  useEffect(() => {
    if (isOpen) {
      // Reset progress first
      setProgress({
        tradeScore: 0,
        taskComplexity: 0,
        timeCommitment: 0,
        skillLevel: 0,
      });

      // Staggered animations
      setTimeout(() => {
        setProgress(prev => ({ ...prev, tradeScore: (evaluation.tradeScore / 10) * 100 }));
      }, 200);

      setTimeout(() => {
        setProgress(prev => ({ ...prev, taskComplexity: evaluation.taskComplexity }));
      }, 600);

      setTimeout(() => {
        setProgress(prev => ({ ...prev, timeCommitment: evaluation.timeCommitment }));
      }, 900);

      setTimeout(() => {
        setProgress(prev => ({ ...prev, skillLevel: evaluation.skillLevel }));
      }, 1200);
    }
  }, [evaluation, isOpen]);
  
  // Handle close with proper event handling and state reset
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Reset all dialog states when closing
    setShowConfirmDialog(false);
    setShowRejectDialog(false);
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose(e);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Reset dialog states when main dialog closes
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmDialog(false);
      setShowRejectDialog(false);
    }
  }, [isOpen]);

  // Handle confirm dialog completion
  const handleConfirmComplete = async () => {
  if (!tradeData?.tradereq_id) {
    console.error('No trade request ID found in tradeData:', tradeData);
    return;
  }

  console.log('=== CONFIRM COMPLETE DEBUG ===');
  console.log('Trade ID:', tradeData.tradereq_id);
  console.log('Session access token exists:', !!session?.access);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradeData.tradereq_id}/evaluation/confirm/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('Trade confirmed successfully:', result);
      setShowConfirmDialog(false);
      onClose();
      if (onTradeUpdate) onTradeUpdate();
    } else {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }
      console.error('Error confirming trade:', errorData);
      alert(`Error: ${errorData.error || 'Unknown error occurred'}`);
    }
  } catch (error) {
    console.error('Network error confirming trade:', error);
    alert('Network error. Please check your connection and try again.');
  }
};

  // Handle reject dialog completion  
  const handleRejectComplete = async () => {
  if (!tradeData?.tradereq_id) {
    console.error('No trade request ID found in tradeData:', tradeData);
    return;
  }

  console.log('=== REJECT COMPLETE DEBUG ===');
  console.log('Trade ID:', tradeData.tradereq_id);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradeData.tradereq_id}/evaluation/reject/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Reject response status:', response.status);

    const responseText = await response.text();
    console.log('Reject raw response:', responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('Trade rejected successfully:', result);
      setShowRejectDialog(false);
      onClose();
      if (onTradeUpdate) onTradeUpdate();
    } else {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }
      console.error('Error rejecting trade:', errorData);
      alert(`Error: ${errorData.error || 'Unknown error occurred'}`);
    }
  } catch (error) {
    console.error('Network error rejecting trade:', error);
    alert('Network error. Please check your connection and try again.');
  }
};
  
  if (!isOpen) return null;

  // Default data if not provided
  const data = tradeData || {
    requestTitle: "Nutrition Coaching for Weight Loss",
    offerTitle: "Yoga Instruction",
    feedback: "Olivia's trade for nutrition coaching in exchange for yoga instruction is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties. Overall, it's a great match that promises meaningful growth and results."
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={handleBackdropClick}
      ></div>
      
      {/* Dialog */}
      <div className="relative w-[940px] h-[790px] flex flex-col justify-center items-center p-[98.5px_74px] bg-black/10 shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[50px] rounded-[15px] z-50 isolate">
        {/* Close button - Enhanced with better positioning and hover effects */}
        <button 
          className="absolute top-[35px] right-[35px] text-white cursor-pointer flex items-center justify-center w-[30px] h-[30px] transition-all duration-200 hover:bg-white/10 hover:text-[#D78DE5] rounded-full z-[100]"
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Close dialog"
          type="button"
        >
          <X className="w-[20px] h-[20px]" />
        </button>
        
        {/* Background glow effects */}
        <div className="absolute w-[942px] h-[218px] left-[-1px] top-0 z-[1]">
          {/* Indigo glow left */}
          <div className="absolute w-[421px] h-[218px] left-[calc(50%-421px/2-260.5px)] top-0 bg-[#906EFF] blur-[175px]"></div>
          {/* Blue glow right */}
          <div className="absolute w-[421px] h-[218px] left-[calc(50%-421px/2+260.5px)] top-0 bg-[#0038FF] blur-[175px]"></div>
          {/* Indigo glow bottom right */}
          <div className="absolute w-[225px] h-[105.09px] left-[calc(50%-225px/2+283.5px)] top-[83.85px] bg-[#906EFF] blur-[60px]"></div>
          {/* Blue glow bottom left */}
          <div className="absolute w-[225px] h-[105.09px] left-[calc(50%-225px/2-283.5px)] top-[83.85px] bg-[#0038FF] blur-[60px]"></div>
        </div>
        
        {/* Content container */}
        <div className="flex flex-col justify-center items-center gap-[40px] w-[792px] h-[613px] z-[2]">
          {/* Header section */}
          <div className="flex flex-col items-center gap-[25px] w-[792px] h-[150px]">
            <div className="flex flex-row justify-between items-center w-[792px] h-[150px]">
              {/* Left side */}
              <div className="flex flex-col items-start justify-between w-[300px] h-full">
                <h3 className="w-[300px] font-[700] text-[25px] leading-[120%] text-white">
                  {data.requestTitle}
                </h3>
                <p className="w-[300px] text-[16px] font-[400] leading-[120%] text-white">
                  What you'll provide
                </p>
              </div>

              {/* Center - Logo */}
              <div className="flex items-center justify-center w-[200px] h-[200px]">
                <StarLogo />
              </div>

              {/* Right side */}
              <div className="flex flex-col items-end justify-between w-[300px] h-full">
                <h3 className="w-[300px] font-[700] text-[25px] leading-[120%] text-right text-white">
                  {data.offerTitle}
                </h3>
                <p className="w-[300px] text-[16px] font-[400] leading-[120%] text-right text-white">
                  What you'll get in return
                </p>
              </div>
            </div>
          </div>
          
          {/* Trade assessment */}
          <div className="flex flex-col items-center gap-[15px] w-[300px] h-[83px]">
            <div className="relative flex items-center w-[300px] h-[20px] p-[2px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
              <div
                className="h-full rounded-[30px] z-[2] transition-all duration-700 ease-out relative"
                style={{
                  width: `calc(${progress.tradeScore}% - 4px)`,
                  background: "linear-gradient(to right, #FB9696, #D78DE5, #7E59F8, #284CCC, #6DDFFF)",
                  boxShadow: progress.tradeScore > 0 ? "0px 0px 20px rgba(126, 89, 248, 0.4)" : "none"
                }}
              >
                {/* Inner glow effect */}
                <div 
                  className="absolute inset-0 rounded-[30px] opacity-60"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                  }}
                />

                {/* Shimmer effect */}
                {progress.tradeScore > 10 && (
                  <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                    <div 
                      className="absolute top-0 left-[-100%] w-full h-full opacity-40"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                        animation: "shimmer 3s infinite ease-in-out"
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="absolute top-[2px] left-[2px] right-[2px] bottom-[2px] bg-white opacity-35 z-[1] rounded-[30px]"></div>
            </div>

            <div className="flex flex-col items-center gap-[5px] w-[110px] h-[48px]">
              <h4 className="font-[700] text-[20px] text-center text-white">
                Good trade
              </h4>
              <p className="text-[16px] font-[400] text-center text-white">
                {evaluation.tradeScore} out of 10
              </p>
            </div>
          </div>
          
          {/* Assessment metrics */}
          <div className="flex flex-col items-end gap-[15px] w-[457px]">
            {/* Task complexity */}
            <div className="flex items-center gap-[20px] w-full">
              <span className="w-[140px] text-[16px] text-right text-white">
                Task complexity
              </span>

              <div className="relative flex items-center w-[300px] h-[20px] p-[2px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[30px] transition-all duration-800 ease-out relative"
                  style={{
                    width: `calc(${progress.taskComplexity}% - 4px)`,
                    background: "linear-gradient(to right, #FB9696, #FA6666)",
                    boxShadow: progress.taskComplexity > 0 ? "0px 0px 15px rgba(251, 150, 150, 0.5)" : "none"
                  }}
                >
                  {/* Inner glow effect */}
                  <div 
                    className="absolute inset-0 rounded-[30px] opacity-60"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                    }}
                  />

                  {/* Shimmer effect */}
                  {progress.taskComplexity > 10 && (
                    <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                      <div 
                        className="absolute top-0 left-[-100%] w-full h-full opacity-50"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                          animation: "shimmer 2s infinite ease-in-out"
                        }}
                      />
                    </div>
                  )}

                  {/* Pulse effect at the end */}
                  {progress.taskComplexity > 5 && (
                    <div 
                      className="absolute top-1/2 right-0 w-[6px] h-[6px] rounded-full opacity-90"
                      style={{
                        background: "#FFFFFF",
                        boxShadow: "0px 0px 8px rgba(255,255,255,0.9)",
                        transform: "translateY(-50%)",
                        animation: "pulse 1.5s infinite ease-in-out"
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Time commitment */}
            <div className="flex items-center gap-[20px] w-full">
              <span className="w-[140px] text-[16px] text-right text-white">
                Time commitment
              </span>

              <div className="relative flex items-center w-[300px] h-[20px] p-[2px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[30px] transition-all duration-900 ease-out relative"
                  style={{
                    width: `calc(${progress.timeCommitment}% - 4px)`,
                    background: "linear-gradient(to right, #D78DE5, #C865DC)",
                    boxShadow: progress.timeCommitment > 0 ? "0px 0px 15px rgba(215, 141, 229, 0.5)" : "none"
                  }}
                >
                  {/* Inner glow effect */}
                  <div 
                    className="absolute inset-0 rounded-[30px] opacity-60"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                    }}
                  />

                  {/* Shimmer effect */}
                  {progress.timeCommitment > 10 && (
                    <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                      <div 
                        className="absolute top-0 left-[-100%] w-full h-full opacity-50"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                          animation: "shimmer 2.2s infinite ease-in-out",
                          animationDelay: "0.3s"
                        }}
                      />
                    </div>
                  )}

                  {/* Pulse effect at the end */}
                  {progress.timeCommitment > 5 && (
                    <div 
                      className="absolute top-1/2 right-0 w-[6px] h-[6px] rounded-full opacity-90"
                      style={{
                        background: "#FFFFFF",
                        boxShadow: "0px 0px 8px rgba(255,255,255,0.9)",
                        transform: "translateY(-50%)",
                        animation: "pulse 1.8s infinite ease-in-out"
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Skill level */}
            <div className="flex items-center gap-[20px] w-full">
              <span className="w-[140px] text-[16px] text-right text-white">
                Skill level
              </span>

              <div className="relative flex items-center w-[300px] h-[20px] p-[2px] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
                <div
                  className="h-full rounded-[30px] transition-all duration-1000 ease-out relative"
                  style={{
                    width: `calc(${progress.skillLevel}% - 4px)`,
                    background: "linear-gradient(to right, #6DDFFF, #38D3FF)",
                    boxShadow: progress.skillLevel > 0 ? "0px 0px 15px rgba(109, 223, 255, 0.5)" : "none"
                  }}
                >
                  {/* Inner glow effect */}
                  <div 
                    className="absolute inset-0 rounded-[30px] opacity-60"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                    }}
                  />

                  {/* Shimmer effect */}
                  {progress.skillLevel > 10 && (
                    <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                      <div 
                        className="absolute top-0 left-[-100%] w-full h-full opacity-50"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                          animation: "shimmer 2.5s infinite ease-in-out",
                          animationDelay: "0.6s"
                        }}
                      />
                    </div>
                  )}

                  {/* Pulse effect at the end */}
                  {progress.skillLevel > 5 && (
                    <div 
                      className="absolute top-1/2 right-0 w-[6px] h-[6px] rounded-full opacity-90"
                      style={{
                        background: "#FFFFFF",
                        boxShadow: "0px 0px 8px rgba(255,255,255,0.9)",
                        transform: "translateY(-50%)",
                        animation: "pulse 2s infinite ease-in-out"
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Feedback section */}
          <div className="flex flex-col items-start gap-[15px] w-[792px] h-[110px]">
            <div className="flex flex-row items-center gap-[15px] w-[792px] h-[19px]">
              <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.57483 0.5C8.08409 4.35956 11.1404 7.41579 15 7.92506V8.07483C11.1404 8.58409 8.08409 11.6404 7.57483 15.5H7.42517C6.91591 11.6404 3.85956 8.58409 0 8.07483V7.92506C3.85956 7.41579 6.91591 4.35956 7.42517 0.5H7.57483Z" fill="#D9D9D9"/>
              </svg>
              <span className="w-[122px] h-[19px] italic text-[16px] leading-[120%] text-white">
                What we think...
              </span>
            </div>
            <p className="w-[792px] h-[76px] text-[16px] leading-[120%] text-white">
              {data.feedback}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-row justify-center items-center gap-[40px] w-[792px] h-[70px] relative isolate mb-[35px]">
            <span className="absolute w-[116px] h-[24px] left-[168px] top-[23px] font-medium text-[20px] leading-[120%] text-white z-0">
              Reject trade
            </span>
            
            {/* Reject button */}
            <button 
              className="flex flex-row justify-center items-center p-[16px] gap-[10px] w-[70px] h-[70px] filter drop-shadow-[0px_0px_15px_#284CCC] z-[1] cursor-pointer hover:scale-105 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setShowRejectDialog(true);
              }}
              type="button"
            >
              <div className="absolute left-0 right-0 top-0 bottom-0 bg-[#0038FF] rounded-[100px] z-0"></div>
              <X className="w-[25px] h-[25px] text-white z-[1]" />
            </button>
            
            {/* Confirm button */}
            <button 
              className="flex flex-row justify-center items-center p-[16px] gap-[10px] w-[70px] h-[70px] filter drop-shadow-[0px_0px_15px_#284CCC] z-[2] cursor-pointer hover:scale-105 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmDialog(true);
              }}
              type="button"
            >
              <div className="absolute left-0 right-0 top-0 bottom-0 bg-[#0038FF] rounded-[100px] z-0"></div>
              <Check className="w-[35px] h-[25px] text-white rounded-[2px] z-[1]" />
            </button>
            
            <span className="absolute w-[133px] h-[24px] left-[526px] top-[23px] font-medium text-[20px] leading-[120%] text-white z-[3]">
              Confirm trade
            </span>
          </div>
        </div>
        
        {/* Disclaimer */}
        <p className="absolute w-[847px] h-[19px] left-[calc(50%-847px/2+4.5px)] top-[737px] text-[12px] leading-[120%] text-center text-white/80 opacity-60 z-[3]">
          This response is generated by AI and may be inaccurate sometimes. This should only serve as a guide for users.
        </p>
      </div>
      
      {/* Confirm Dialog */}
      <ConfirmDialog 
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmComplete}
      />
      
      {/* Reject Dialog */}
      <RejectDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onReject={handleRejectComplete}
      />

      {/* Add keyframes for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.6; 
            transform: translateY(-50%) scale(0.8);
          }
          50% { 
            opacity: 1; 
            transform: translateY(-50%) scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}