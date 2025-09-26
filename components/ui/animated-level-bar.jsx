"use client";

import { useState, useEffect } from "react";

export default function AnimatedLevelBar({ 
  level = 1, 
  currentXp = 0, 
  maxXp = 100, 
  width = 220, 
  height = 20, 
  showXpNumbers = true,
  showLevel = true,
  animationDelay = 100,
  animationDuration = 1000,
  gradient = "default",
  className = ""
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate progress percentage
  const progressPercentage = Math.min((currentXp / maxXp) * 100, 100);

  // Gradient options
  const gradients = {
    default: "linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)",
    purple: "linear-gradient(90deg, #9333EA 0%, #C084FC 50%, #DDD6FE 100%)",
    blue: "linear-gradient(90deg, #1E40AF 0%, #3B82F6 50%, #93C5FD 100%)",
    green: "linear-gradient(90deg, #15803D 0%, #22C55E 50%, #86EFAC 100%)",
    gold: "linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #FDE047 100%)"
  };

  const selectedGradient = gradients[gradient] || gradients.default;

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
      setAnimatedWidth(progressPercentage);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [progressPercentage, animationDelay]);

  // Reset animation when currentXp changes
  useEffect(() => {
    if (isVisible) {
      setAnimatedWidth(0);
      setTimeout(() => {
        setAnimatedWidth(progressPercentage);
      }, 50);
    }
  }, [currentXp, maxXp, progressPercentage, isVisible]);

  return (
    <div className={`flex items-center gap-[10px] ${className}`}>
      {/* Level Display */}
      {showLevel && (
        <span className="text-[16px] text-white font-medium whitespace-nowrap">
          LVL {level}
        </span>
      )}

      {/* Progress Bar Container */}
      <div className="relative flex items-center">
        <div 
          className="relative bg-white rounded-[32px] shadow-[0px_5px_19px_rgba(0,0,0,0.15)] overflow-hidden"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          {/* Background glow effect */}
          <div 
            className="absolute inset-0 bg-white/20 rounded-[32px]"
            style={{
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)"
            }}
          />

          {/* Progress Fill */}
          <div 
            className="absolute top-[2px] left-[2px] rounded-[30px] transition-all ease-out"
            style={{
              width: `calc(${animatedWidth}% - 4px)`,
              height: `${height - 4}px`,
              background: selectedGradient,
              transitionDuration: `${animationDuration}ms`,
              boxShadow: animatedWidth > 0 ? "0px 0px 20px rgba(126, 89, 248, 0.4)" : "none"
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
            {animatedWidth > 10 && (
              <div 
                className="absolute inset-0 rounded-[30px] overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-[-100%] w-full h-full opacity-40"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
                    animation: "shimmer 2s infinite ease-in-out"
                  }}
                />
              </div>
            )}
          </div>

          {/* Pulse effect at the end of progress */}
          {animatedWidth > 5 && (
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-[6px] h-[6px] rounded-full opacity-80"
              style={{
                left: `calc(${animatedWidth}% - 6px)`,
                background: "#FFFFFF",
                boxShadow: "0px 0px 8px rgba(255,255,255,0.8)",
                animation: "pulse 1.5s infinite ease-in-out"
              }}
            />
          )}
        </div>
      </div>

      {/* XP Numbers */}
      {showXpNumbers && (
        <span className="text-[14px] text-white/70 font-medium whitespace-nowrap">
          {currentXp}/{maxXp}
        </span>
      )}

      {/* Add keyframes for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.6; 
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}