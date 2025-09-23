"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function XpGainedDialog({ isOpen, onClose, xpGained = 250, level = 15, currentXp = 650, maxXp = 700 }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [showGlow, setShowGlow] = useState(false);

  // Calculate progress percentage for the progress bar
  const progressPercentage = (currentXp / maxXp) * 100;

  useEffect(() => {
    if (isOpen) {
      // Stage 1: Show glow effect
      setTimeout(() => setShowGlow(true), 100);
      
      // Stage 2: Animate XP counter
      setTimeout(() => {
        let start = 0;
        const duration = 1000;
        const increment = xpGained / (duration / 16);
        
        const animateXp = () => {
          start += increment;
          if (start < xpGained) {
            setAnimatedXp(Math.floor(start));
            requestAnimationFrame(animateXp);
          } else {
            setAnimatedXp(xpGained);
          }
        };
        animateXp();
      }, 300);
      
      // Stage 3: Animate progress bar
      setTimeout(() => setAnimatedWidth(progressPercentage), 800);
      
      // Stage 4: Show burst effect
      setTimeout(() => setShowBurst(true), 1200);
      
    } else {
      setAnimatedWidth(0);
      setAnimatedXp(0);
      setShowBurst(false);
      setShowGlow(false);
    }
  }, [isOpen, progressPercentage, xpGained]);

  if (!isOpen) return null;

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
          {/* Title with animated XP */}
          <h2 
            className={`text-[25px] font-[700] text-white text-center transition-all duration-300 ${
              showGlow ? 'drop-shadow-[0_0_20px_rgba(215,141,229,0.8)]' : ''
            }`}
          >
            Nice! You gained {animatedXp} XP.
          </h2>

          {/* Burst Effect */}
          {showBurst && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-150px)`,
                    animation: `burst 0.8s ease-out forwards`,
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Level Progress */}
          <div className="flex flex-col items-center gap-[20px] w-full">
            <div className="flex justify-between items-center w-full">
              <span className="text-[16px] text-white">LVL {level}</span>
              
              {/* Progress Bar */}
              <div className="relative w-[300px] h-[20px] bg-white rounded-[32px] shadow-[0px_5px_19px_rgba(0,0,0,0.15)] overflow-hidden">
                <div 
                  className="absolute h-[16px] top-[2px] left-[2px] rounded-[100px] transition-all duration-1200 ease-out"
                  style={{
                    width: `calc(${animatedWidth}% - 4px)`,
                    background: "linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)",
                    boxShadow: animatedWidth > 0 ? "0px 0px 20px rgba(126, 89, 248, 0.6)" : "none"
                  }}
                >
                  {/* Inner glow effect */}
                  <div 
                    className="absolute inset-0 rounded-[100px] opacity-60"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
                    }}
                  />

                  {/* Shimmer effect */}
                  {animatedWidth > 10 && (
                    <div className="absolute inset-0 rounded-[100px] overflow-hidden">
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
                  {animatedWidth > 5 && (
                    <div 
                      className="absolute top-1/2 right-0 w-[8px] h-[8px] rounded-full opacity-90"
                      style={{
                        background: "#FFFFFF",
                        boxShadow: "0px 0px 12px rgba(255,255,255,0.9)",
                        transform: "translateY(-50%)",
                        animation: "pulse 1.5s infinite ease-in-out"
                      }}
                    />
                  )}
                </div>
              </div>
              
              <span className="text-[16px] text-white">{currentXp}/{maxXp}</span>
            </div>
          </div>
        </div>

        {/* Add keyframes for animations */}
        <style jsx>{`
          @keyframes burst {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(0) scale(0.5);
            }
            50% {
              opacity: 0.8;
              transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(-120px) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) rotate(var(--rotation)) translateY(-200px) scale(0.2);
            }
          }
          
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
    </div>
  );
}