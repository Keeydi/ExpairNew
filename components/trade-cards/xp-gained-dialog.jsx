import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

// Level calculation logic from your system
const LVL_CAPS = [
  50,75,100,125,150,175,200,230,260,300,350,400,460,520,600,700,800,900,1000,1100,1250,1400,1600,1800,2000,
  2300,2600,2900,3200,3500,3800,4200,4600,5000,5500,6000,6500,7000,7500,8000,8500,9000,9600,10200,10800,11500,
  12200,12900,13600,14300,15000,15800,16600,17500,18400,19300,20300,21300,22300,23300,24300,25400,26500,27700,
  28900,30100,31300,32600,33900,35200,36500,37900,39300,40700,42100,43600,45100,46600,48100,49600,51100,52700,
  54300,55900,57500,59200,60900,62600,64300,66000,67700,69500,71300,73100,74900,76700,78500,80300,82100,85000
];

function deriveFromTotalXp(totalXp) {
  const t = Math.max(0, Number(totalXp) || 0);
  let cumulative = 0;
  for (let i = 0; i < LVL_CAPS.length; i++) {
    const cap = LVL_CAPS[i];
    if (t < cumulative + cap) {
      return {
        level: i + 1,
        xpInLevel: t - cumulative,
        levelWidth: cap,
        prevCap: cumulative,
        currCap: cumulative + cap,
      };
    }
    cumulative += cap;
  }
  // if you exceed the last cap
  const last = LVL_CAPS.length;
  return {
    level: last,
    xpInLevel: LVL_CAPS[last - 1],
    levelWidth: LVL_CAPS[last - 1],
    prevCap: cumulative - LVL_CAPS[last - 1],
    currCap: cumulative,
  };
}

export default function XpGainedDialog({
  isOpen,
  onClose,
  xpGained: xpGainedProp = 0,
  level: levelProp = 1,
  currentXp: currentXpProp = 0,
  tradereqId,
  authToken,
  apiBase = process.env.NEXT_PUBLIC_BACKEND_URL
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showLevelUpFlash, setShowLevelUpFlash] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(levelProp);
  const [xpGained, setXpGained] = useState(xpGainedProp);
  const [currentTotalXp, setCurrentTotalXp] = useState(0);
  const [previousTotalXp, setPreviousTotalXp] = useState(0);
  const [level, setLevel] = useState(levelProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !authToken || !tradereqId || !apiBase) return;
    
    const fetchXpData = async () => {
      setLoading(true);
      setError("");
      
      try {
        // 1) Get current user data to get current total XP
        const userResponse = await fetch(`${apiBase}/me/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const userData = await userResponse.json();
        const currentUserTotalXp = Number(userData?.tot_XpPts ?? 0);
        const userId = Number(userData?.user_id ?? userData?.id);
        
        // 2) Get trade details to find XP gained for this specific trade
        const tradeResponse = await fetch(`${apiBase}/trade-requests/${tradereqId}/details/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (!tradeResponse.ok) {
          throw new Error("Failed to fetch trade details");
        }
        
        const tradeData = await tradeResponse.json();
        
        // Find the current user's trade detail record
        const userTradeDetail = tradeData?.details?.find(
          detail => Number(detail.user_id) === userId
        );
        
        if (!userTradeDetail) {
          throw new Error("Could not find user's trade details");
        }
        
        const tradeXpGained = Number(userTradeDetail.total_xp || 0);
        
        // Calculate previous total XP (before this trade)
        const previousXp = currentUserTotalXp - tradeXpGained; // Fixed: subtract XP gained to get previous
        const afterTotal = currentUserTotalXp; // Current total is what we have now

        // Set state values
        setXpGained(tradeXpGained);
        setPreviousTotalXp(previousXp);
        setCurrentTotalXp(afterTotal);
        
        // Calculate level based on previous XP for initial display
        const initialLevelData = deriveFromTotalXp(previousXp);
        setDisplayLevel(initialLevelData.level);
        setLevel(levelData.level);
        
      } catch (err) {
        console.error("[XP Dialog] Error fetching XP data:", err);
        setError(err.message || "Failed to load XP data");
        
        // Fallback to props if API fails
        setXpGained(xpGainedProp);
        setLevel(levelProp);
        setCurrentTotalXp(currentXpProp);
        setPreviousTotalXp(Math.max(0, currentXpProp - xpGainedProp)); // Set reasonable fallback
      } finally {
        setLoading(false);
      }
    };

    fetchXpData();
  }, [isOpen, authToken, tradereqId, apiBase, xpGainedProp, levelProp, currentXpProp]);

  // Calculate level progress using current total XP
  const levelData = deriveFromTotalXp(currentTotalXp);
  const beforeData = deriveFromTotalXp(previousTotalXp);
  
  // Calculate progress percentages with proper carry-over logic
  let progressFrom = beforeData.levelWidth ? Math.max(0, Math.min(100, (beforeData.xpInLevel / beforeData.levelWidth) * 100)) : 0;
  let progressTo = levelData.levelWidth ? Math.max(0, Math.min(100, (levelData.xpInLevel / levelData.levelWidth) * 100)) : 0;
  
  // If we leveled up, show the animation filling to 100% first, then reset to new level progress
  const didLevelUp = levelData.level > beforeData.level;
  if (didLevelUp && progressFrom !== 100) {
    // We'll animate to 100% first, then to the actual progress in the new level
    progressTo = 100; // First animation goes to 100%
  }

  // Animation effects
  useEffect(() => {
    if (isOpen && xpGained > 0 && !loading) {
      // Reset animation states
      setAnimatedWidth(progressFrom);
      setAnimatedXp(0);
      setShowBurst(false);
      setShowGlow(false);
      setShowLevelUpFlash(false);
      setDisplayLevel(beforeData.level);

      const didLevelUp = levelData.level > beforeData.level;
      const finalProgress = levelData.levelWidth ? Math.max(0, Math.min(100, (levelData.xpInLevel / levelData.levelWidth) * 100)) : 0;

      // Stage 1: Show glow effect
      const glowTimeout = setTimeout(() => setShowGlow(true), 100);
      
      // Stage 2: Animate XP counter
      const xpTimeout = setTimeout(() => {
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
      
      if (didLevelUp) {
        // Multi-stage animation for level up
        let timeOffset = 800;
        
        // Step 1: Fill current level to 100%
        const fillTimeout = setTimeout(() => setAnimatedWidth(100), timeOffset);
        timeOffset += 600; // Wait for fill animation
        
        // Step 2: Flash effect and level up
        const flashTimeout = setTimeout(() => {
          setShowLevelUpFlash(true);
          setShowBurst(true);
        }, timeOffset);
        timeOffset += 300; // Short flash duration
        
        // Step 3: Update level and reset bar to 0
        const resetTimeout = setTimeout(() => {
          setShowLevelUpFlash(false);
          setDisplayLevel(levelData.level);
          setAnimatedWidth(0);
        }, timeOffset);
        timeOffset += 200; // Brief pause at 0
        
        // Step 4: Fill to final progress in new level
        const finalFillTimeout = setTimeout(() => {
          setAnimatedWidth(finalProgress);
        }, timeOffset);

        return () => {
          clearTimeout(glowTimeout);
          clearTimeout(xpTimeout);
          clearTimeout(fillTimeout);
          clearTimeout(flashTimeout);
          clearTimeout(resetTimeout);
          clearTimeout(finalFillTimeout);
        };
      } else {
        // Normal progress animation (no level up)
        const barTimeout = setTimeout(() => setAnimatedWidth(finalProgress), 800);
        const burstTimeout = setTimeout(() => setShowBurst(true), 1200);

        return () => {
          clearTimeout(glowTimeout);
          clearTimeout(xpTimeout);
          clearTimeout(barTimeout);
          clearTimeout(burstTimeout);
        };
      }
    } else if (!isOpen) {
      // Reset when dialog closes
      setAnimatedWidth(0);
      setAnimatedXp(0);
      setShowBurst(false);
      setShowGlow(false);
      setShowLevelUpFlash(false);
      setDisplayLevel(levelProp);
    }
  }, [isOpen, xpGained, progressFrom, loading, levelData.level, beforeData.level, levelData.levelWidth, levelData.xpInLevel, levelProp]);

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
          className="absolute top-[30px] right-[30px] text-white hover:text-gray-300 transition-colors"
          aria-label="Close dialog"
        >
          <Icon icon="lucide:x" className="w-[15px] h-[15px]" />
        </button>

        <div className="flex flex-col items-center gap-[40px] w-[470px]">
          {loading ? (
            // Loading state
            <div className="flex flex-col items-center gap-4">
              <Icon icon="lucide:loader-2" className="w-8 h-8 text-white animate-spin" />
              <p className="text-white text-center">Loading your XP...</p>
            </div>
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center gap-4">
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-400" />
              <p className="text-red-400 text-center">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
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
                        '--rotation': `${i * 30}deg`,
                        transform: 'translate(-50%, -50%)',
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
                  <span className={`text-[16px] text-white transition-all duration-300 ${
                    showLevelUpFlash ? 'text-yellow-400 scale-125 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]' : ''
                  }`}>
                    LVL {displayLevel}
                  </span>
                  
                  {/* Progress Bar */}
                  <div className={`relative w-[300px] h-[20px] bg-white rounded-[32px] shadow-[0px_5px_19px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 ${
                    showLevelUpFlash ? 'shadow-[0_0_30px_rgba(255,255,0,0.8)] scale-105' : ''
                  }`}>
                    <div 
                      className="absolute h-[16px] top-[2px] left-[2px] rounded-[100px] transition-all duration-700 ease-out"
                      style={{
                        width: `calc(${Math.max(0, Math.min(100, animatedWidth))}% - 4px)`,
                        background: showLevelUpFlash 
                          ? "linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)" 
                          : "linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)",
                        boxShadow: animatedWidth > 0 ? (showLevelUpFlash 
                          ? "0px 0px 25px rgba(255, 215, 0, 0.9)" 
                          : "0px 0px 20px rgba(126, 89, 248, 0.6)") : "none"
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
                  
                  <span className="text-[16px] text-white">
                    {/* Show current level's XP during animation, final level's XP when done */}
                    {displayLevel === levelData.level ? 
                      `${levelData.xpInLevel}/${levelData.levelWidth}` : 
                      `${beforeData.xpInLevel}/${beforeData.levelWidth}`
                    }
                  </span>
                </div>
              </div>
            </>
          )}
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