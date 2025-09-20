"use client";

import { useState } from "react";

export function Tooltip({ children, content, position = "left", delay = 300 }) {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => {
    setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div 
          className="absolute z-[99999] px-4 py-3 text-sm font-medium text-white bg-[#1A0F3E] border border-[#2B124C] rounded-lg shadow-lg whitespace-nowrap"
          style={{
            right: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            marginRight: "12px",
            width: "280px",
            whiteSpace: "normal",
            lineHeight: "1.5",
            boxShadow: "0px 4px 15px rgba(40, 76, 204, 0.3)"
          }}
        >
          {content}
          {/* Arrow pointing right to the button */}
          <div 
            className="absolute"
            style={{
              left: "100%",
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: "8px solid #1A0F3E"
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Tooltip;
