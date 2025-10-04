"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";
import { cn } from "../../lib/utils";

export function NotificationPortal({ isOpen, onClose, onMarkAllAsRead, anchorRect }) {
  const [mounted, setMounted] = useState(false);
  const [readNotifications, setReadNotifications] = useState({});

  // Hardcoded notifications
  const hardcodedNotifications = [
    {
      id: 'trade-accepted-1',
      icon: 'match',
      message: 'Your trade request "Web Development" was accepted by Sarah M.',
      time: '2 hours ago',
      dotColor: '#6DDFFF',
    },
    {
      id: 'trade-accepted-2', 
      icon: 'match',
      message: 'Your trade request "Graphic Design" was accepted by John D.',
      time: '1 day ago',
      dotColor: '#6DDFFF',
    },
    {
      id: 'trade-completed-1',
      icon: 'check',
      message: 'Trade "Photography Services" has been completed successfully!',
      time: '3 days ago',
      dotColor: '#4ADE80',
    },
    {
      id: 'new-message-1',
      icon: 'message',
      message: 'You have 3 new messages from your trade partners.',
      time: '5 hours ago',
      dotColor: '#F59E0B',
    },
    {
      id: 'system-update-1',
      icon: 'info',
      message: 'New features added: Enhanced trade evaluation system is now live!',
      time: '1 week ago',
      dotColor: '#8B5CF6',
    }
  ];

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
        {hardcodedNotifications.length === 0 ? (
          <div className="text-white/60 text-sm">No new notifications</div>
        ) : (
          hardcodedNotifications.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              icon={n.icon}
              message={n.message}
              time={n.time}
              isRead={readNotifications[n.id] || false}
              dotColor={n.dotColor}
              onClick={() => markAsRead(n.id)}
            />
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

function NotificationItem({ id, avatar, icon, name, message, time, isRead, dotColor, prefix = "", onClick }) {
  const getIconComponent = (iconType) => {
    switch (iconType) {
      case 'match':
        return <div className="w-4 h-4 bg-[#6DDFFF] rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>;
      case 'check':
        return <div className="w-4 h-4 bg-[#4ADE80] rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>;
      case 'message':
        return <div className="w-4 h-4 bg-[#F59E0B] rounded-full flex items-center justify-center">
          <span className="text-white text-xs">💬</span>
        </div>;
      case 'info':
        return <div className="w-4 h-4 bg-[#8B5CF6] rounded-full flex items-center justify-center">
          <span className="text-white text-xs">i</span>
        </div>;
      default:
        return <AlertCircle className="w-4 h-4 text-white/60" />;
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5",
        isRead ? "opacity-60" : ""
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-1">
        {getIconComponent(icon)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm leading-relaxed mb-1">
          {prefix && <span className="text-white/60">{prefix} </span>}
          {message}
        </p>
        <p className="text-white/40 text-xs">{time}</p>
      </div>
      {!isRead && (
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
          style={{ backgroundColor: dotColor }}
        />
      )}
    </div>
  );
}
