"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";
import { cn } from "../../lib/utils";

export function NotificationPortal({ isOpen, onClose, onMarkAllAsRead, anchorRect, items = [] }) {
  const [mounted, setMounted] = useState(false);
  const [readNotifications, setReadNotifications] = useState({});

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  const markAsRead = (id) => {
    setReadNotifications(prev => ({
      ...prev,
      [id]: true
    }));
  };
  
  const markAllAsRead = () => {
    setReadNotifications({});
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  if (!mounted || !isOpen || !anchorRect) return null;

  // Calculate position based on the bell icon's position
  const top = anchorRect.bottom + 10;
  const right = window.innerWidth - anchorRect.right;

  return createPortal(
    <div 
      data-notification-portal
      className="fixed w-[388px] max-h-[571px] overflow-hidden rounded-[15px] z-[9999]"
      style={{
        background: "rgba(10, 1, 24, 0.95)",
        boxShadow: "0px 4px 15px #D78DE5",
        backdropFilter: "blur(30px)",
        top: `${top}px`,
        right: `${right}px`,
        isolation: "isolate",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "25px"
      }}
    >
      <div className="flex items-center justify-between w-full">
        <h2 className="text-white text-[25px] font-semibold leading-[120%]">Notifications</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={markAllAsRead}
            className="text-[#906EFF] text-[16px] font-normal underline leading-[120%]"
          >
            Mark all as read
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="w-full flex flex-col gap-[15px] overflow-y-auto custom-scrollbar pr-2 pl-1" style={{ maxHeight: "452px" }}>
        {items.length === 0 ? (
          <div className="text-white/60 text-sm">No new notifications</div>
        ) : (
          items.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              icon={n.icon}
              message={n.message}
              time={n.time}
              isRead={false}
              dotColor={n.dotColor}
              onClick={() => {}}
            />
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

function NotificationItem({ id, avatar, icon, name, message, time, isRead, dotColor, prefix = "", onClick }) {
  return (
    <div 
      className="w-full cursor-pointer transition-colors duration-200 hover:bg-white/5 rounded-md px-2 py-1 -mx-2 -my-1" 
      onClick={onClick}>
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-[15px] items-start max-w-[302px]">
          {avatar && (
            <div className="w-[37px] h-[37px] rounded-full overflow-hidden shrink-0 shadow-[0px_20px_60px_rgba(0,0,0,0.35)]">
              <img src={avatar} alt="User avatar" className="w-full h-full object-cover" />
            </div>
          )}
          
          {icon === "match" && (
            <div className="w-[37px] h-[37px] flex items-center justify-center shrink-0">
              <div style={{ 
                background: 'linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '24px'
              }}>✦</div>
            </div>
          )}
          
          {icon === "star" && (
            <div className="w-[37px] h-[37px] flex items-center justify-center shrink-0">
              <div className="text-white text-2xl">★</div>
            </div>
          )}
          
          {icon === "alert" && (
            <div className="w-[37px] h-[37px] flex items-center justify-center shrink-0">
              <AlertCircle className="text-[#D78DE5] w-[24px] h-[24px]" />
            </div>
          )}
          
          <div className="flex flex-col gap-[5px] max-w-[250px]">
            <p className="text-white text-[13px] leading-[120%] font-normal">
              {prefix}{name && <span>{name} </span>}{message}
            </p>
            {time && <p className="text-white/40 text-[13px] leading-[120%] font-normal">{time}</p>}
          </div>
        </div>
        
        {!isRead && dotColor && (
          <div className="w-[10px] h-[10px] rounded-full ml-2 self-center" style={{ background: dotColor }}></div>
        )}
      </div>
      <div className="w-full h-[1px] bg-white/20 mt-[15px]"></div>
    </div>
  );
}