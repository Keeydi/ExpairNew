"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { cn } from "../../lib/utils";
import { useToast } from "../../components/ui/use-toast";

export function MessageBubble({ message, bubbleIndex, showAvatar = true, showTime = true, onReply, onDelete, onHeart }) {
  const [showActions, setShowActions] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [actionButtonsHovered, setActionButtonsHovered] = useState(false);
  const { toast } = useToast();
  
  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          toast({
            title: "Copied to clipboard",
            description: "Message text copied successfully",
            duration: 2000,
          });
        })
        .catch(err => {
          console.error("Failed to copy text: ", err);
        });
    }
  };
  
  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  return (
      <div 
      className={cn(
        "flex gap-3 group/message relative",
        message.isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !actionButtonsHovered && setShowActions(false)}
    >
      {/* Avatar - only for non-user messages */}
      {!message.isUser && showAvatar && (
        <div className="flex-shrink-0 mt-1">
          <Image
            src="/assets/defaultavatar.png"
            alt={message.sender}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
      )}
      
      {!message.isUser && !showAvatar && <div className="w-8"></div>}
      
      <div 
        className={cn(
          "max-w-[70%] flex flex-col",
          message.isUser ? "items-end" : "items-start"
        )}
      >
        {/* Message bubble */}
        <div className="relative">
          <div
            className={cn(
              "px-4 py-2.5 rounded-[20px]",
              message.isUser 
                ? "bg-[#0038FF] text-white rounded-br-none" 
                : "bg-[#120A2A] text-white rounded-bl-none"
            )}
          >
            {/* Heart reaction bubble at bottom-right like iMessage */}
            {message.reactions?.heart && (
              <span
                className={cn(
                  "absolute -bottom-3 right-2 text-lg",
                  message.isUser ? "" : ""
                )}
              >
                ❤️
              </span>
            )}
            {message.replyTo && (
              <div className={cn(
                "mb-2 p-2 rounded border-l-2",
                message.isUser 
                  ? "bg-[#001A66]/80 border-white/70" 
                  : "bg-black/20 border-[#906EFF]"
              )}>
                <p className={cn(
                  "text-xs mb-1 font-medium",
                  message.isUser ? "text-white" : "text-[#906EFF]"
                )}>
                  Reply to {message.replyTo.sender}
                </p>
                {message.replyTo.attachment && message.replyTo.attachment.type.startsWith('image/') ? (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 rounded overflow-hidden bg-[#0A0519] flex-shrink-0">
                      <img 
                        src={message.replyTo.attachment.url} 
                        alt="Attachment preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className={cn(
                      "text-xs",
                      message.isUser ? "text-white/90" : "opacity-80"
                    )}>
                      {message.replyTo.content || "Image attachment"}
                    </p>
                  </div>
                ) : message.replyTo.attachment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#15042C] flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={message.replyTo.attachment.type.includes('pdf') ? "lucide:file-text" : "lucide:file"} 
                        className="w-3 h-3 text-[#906EFF]" 
                      />
                    </div>
                    <p className={cn(
                      "text-xs",
                      message.isUser ? "text-white/90" : "opacity-80"
                    )}>
                      {message.replyTo.content || message.replyTo.attachment.name}
                    </p>
                  </div>
                ) : (
                  <p className={cn(
                    "text-xs truncate",
                    message.isUser ? "text-white/90" : "opacity-80"
                  )}>
                    {message.replyTo.content}
                  </p>
                )}
              </div>
            )}
            {message.content && <p className="text-sm">{message.content}</p>}
            
            {message.attachment && (
              <div className={cn(
                "rounded-lg overflow-hidden",
                message.content ? "mt-2" : ""
              )}>
                {message.attachment.type.startsWith('image/') ? (
                  <div className="relative">
                    <img 
                      src={message.attachment.url} 
                      alt={message.attachment.name}
                      className="max-w-full rounded-lg max-h-[200px] object-contain bg-[#0A0519]"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white truncate max-w-[150px]">{message.attachment.name}</span>
                        <a 
                          href={message.attachment.url} 
                          download={message.attachment.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon icon="lucide:download" className="w-3 h-3 text-white" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2 bg-[#0A0519] rounded-lg">
                    <div className="w-10 h-10 rounded-md bg-[#15042C] flex items-center justify-center flex-shrink-0">
                      <Icon 
                        icon={
                          message.attachment.type.includes('pdf')
                            ? "lucide:file-text"
                            : "lucide:file"
                        } 
                        className="w-5 h-5 text-[#906EFF]" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{message.attachment.name}</p>
                      <p className="text-xs text-[#8E7EB3]">
                        {message.attachment.type.split('/')[1].toUpperCase()} • {(message.attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a 
                      href={message.attachment.url} 
                      download={message.attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-[#120A2A] rounded-full flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icon icon="lucide:download" className="w-4 h-4 text-[#906EFF]" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Message actions */}
          {showActions && (
            <div 
              className={cn(
                "absolute top-0 flex gap-1 p-1 rounded-full bg-[#15042C] shadow-md z-10",
                message.isUser ? "left-0 -translate-x-[calc(100%+12px)]" : "right-0 translate-x-[calc(100%+12px)]"
              )}
              onMouseEnter={() => setActionButtonsHovered(true)}
              onMouseLeave={() => {
                setActionButtonsHovered(false);
                setShowActions(false);
              }}
            >
              {/* Reply */}
              <button 
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  activeAction === "reply" ? "bg-[#906EFF] text-white" : "hover:bg-[#1A0F3E] text-[#8E7EB3]"
                )}
                onMouseEnter={() => setActiveAction("reply")}
                onMouseLeave={() => setActiveAction(null)}
                onClick={handleReply}
                title="Reply"
              >
                <Icon icon="lucide:reply" className="w-4 h-4" />
              </button>
              {/* Copy text */}
              <button 
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  activeAction === "copy" ? "bg-[#906EFF] text-white" : "hover:bg-[#1A0F3E] text-[#8E7EB3]",
                  !message.content && "opacity-50 cursor-not-allowed"
                )}
                disabled={!message.content}
                onMouseEnter={() => message.content && setActiveAction("copy")}
                onMouseLeave={() => setActiveAction(null)}
                onClick={handleCopy}
                title="Copy"
              >
                <Icon icon="lucide:copy" className="w-4 h-4" />
              </button>
              <button 
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  activeAction === "heart" ? "bg-[#906EFF] text-white" : "hover:bg-[#1A0F3E] text-[#8E7EB3]"
                )}
                onMouseEnter={() => setActiveAction("heart")}
                onMouseLeave={() => setActiveAction(null)}
                onDoubleClick={(e) => e.stopPropagation()}
                onClick={() => onHeart && onHeart(bubbleIndex)}
                title="Heart"
              >
                <Icon icon="lucide:heart" className="w-4 h-4" />
              </button>
              
              {message.isUser && (
                <button 
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                    activeAction === "delete" ? "bg-[#906EFF] text-white" : "hover:bg-[#1A0F3E] text-[#8E7EB3]"
                  )}
                  onMouseEnter={() => setActiveAction("delete")}
                  onMouseLeave={() => setActiveAction(null)}
                  onClick={() => onDelete && onDelete(bubbleIndex)}
                  title="Delete for me"
                >
                  <Icon icon="lucide:trash-2" className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Time */}
        {showTime && (
          <span className="text-xs text-[#8E7EB3] mt-1">
            {message.time}
          </span>
        )}
      </div>
    </div>
  );
}