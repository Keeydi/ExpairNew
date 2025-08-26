"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
import { MessageBubble } from "./message-bubble";
import { Toaster } from "../ui/toaster";
import Link from "next/link";
import EvaluationDialog from "../trade-cards/evaluation-dialog";
import { Star } from "lucide-react";

export default function MessageConversation({ conversation, onSendMessage, onConversationViewed }) {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messages, setMessages] = useState([]);
  const [attachedFile, setAttachedFile] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Initialize messages when conversation changes and mark as read
  useEffect(() => {
    if (conversation?.messages) {
      setMessages([...conversation.messages]);
      
      // Mark conversation as read when viewed
      if (onConversationViewed && conversation.unread) {
        onConversationViewed();
      }
    }
  }, [conversation?.id, onConversationViewed]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" && !attachedFile) return;
    
    // Create new message object
    const newMessageObj = {
      sender: "You",
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
      attachment: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        url: attachedFile.url,
        size: attachedFile.size
      } : null,
      replyTo: replyingTo
    };
    
    // Add to local state
    setMessages(prevMessages => [...prevMessages, newMessageObj]);
    
    // Update parent component state (for sidebar preview)
    if (onSendMessage) {
      onSendMessage(newMessageObj);
    }
    
    // Clear form
    setNewMessage("");
    setAttachedFile(null);
    setReplyingTo(null);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      });
    }
  };
  
  const removeAttachedFile = () => {
    if (attachedFile?.url) {
      URL.revokeObjectURL(attachedFile.url);
    }
    setAttachedFile(null);
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  if (!conversation) {
    return (
      <div className="flex-1 bg-[#0C071B] rounded-[25px] h-[800px] flex items-center justify-center">
        <div className="text-center p-6">
          <Icon icon="lucide:message-square" className="w-16 h-16 text-[#413663] mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No conversation selected</h3>
          <p className="text-[#8E7EB3]">Choose a conversation from the list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0C071B] rounded-[25px] h-full flex flex-col relative overflow-hidden">
      <Toaster />
      {/* Conversation header */}
      <div className="p-5 border-b border-[#1A0F3E] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={conversation.avatar}
            alt={conversation.name}
            width={45}
            height={45}
            className="rounded-full"
          />
          <div>
            <h3 className="text-[16px] text-white flex items-center gap-2">
              {conversation.name}
            </h3>
            <div className="flex items-center gap-5 mt-1">
              {/* Group 1: LVL */}
              <div className="flex items-center">
                <span className="text-[13px] font-normal text-[rgba(255,255,255,0.60)]">
                  LVL {conversation.level}
                </span>
              </div>

              {/* Group 2: Star + Rating */}
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                <span className="text-[13px] font-normal text-[rgba(255,255,255,0.60)]">
                  {conversation.rating}
                </span>
              </div>

              {/* Group 3: SVG + Rating Label */}
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                  <path d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z" fill="url(#paint0_radial_1202_2090)" stroke="url(#paint1_linear_1202_2090)" strokeWidth="1.5"/>
                  <defs>
                    <radialGradient id="paint0_radial_1202_2090" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)">
                      <stop offset="0.4" stopColor="#933BFF"/>
                      <stop offset="1" stopColor="#34188D"/>
                    </radialGradient>
                    <linearGradient id="paint1_linear_1202_2090" x1="6.00002" y1="0.0778344" x2="6.00002" y2="13.2525" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white"/>
                      <stop offset="0.5" stopColor="#999999"/>
                      <stop offset="1" stopColor="white"/>
                    </linearGradient>
                  </defs>
                </svg>

                <span className="text-[13px] font-normal text-[rgba(255,255,255,0.60)]">
                  {conversation.ratingLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <button className="w-[40px] h-[40px] flex items-center justify-center text-white transition">
            <Icon icon="lucide:more-horizontal" className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Request/Exchange info */}
      {conversation.requests && (
        <div className="px-5 py-3 bg-[#0A0519]">
          <div className="flex justify-between">
            <div className="flex items-start gap-4">
              <div className="flex flex-col">
                <span className="text-[16px] text-white">Requested</span>
                <div className="px-[10px] py-[5px] mt-1 bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px]">
                  <span className="text-[13px] text-white">{conversation.requests.requested}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] text-white">In exchange for</span>
                <div className="px-[10px] py-[5px] mt-1 bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px]">
                  <span className="text-[13px] text-white">{conversation.requests.exchange}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-end gap-3 pb-1">
              <Link href={`/home/trades/add-details?requested=${encodeURIComponent(conversation.requests.requested)}&exchange=${encodeURIComponent(conversation.requests.exchange)}`}>
                <button className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors">
                  <span className="text-[13px] text-white">Add details</span>
                </button>
              </Link>
              
              <button
                onClick={() => {
                  setSelectedTrade({
                    requestTitle: conversation.requests.requested,
                    offerTitle: conversation.requests.exchange,
                    taskComplexity: 60,
                    timeCommitment: 50,
                    skillLevel: 80,
                    feedback: `${conversation.name}'s trade for ${conversation.requests.requested} in exchange for ${conversation.requests.exchange} is well-balanced, with a high skill level required and moderate time commitment. The task complexity is fairly challenging, which makes this a valuable and rewarding exchange for both parties. Overall, it's a great match that promises meaningful growth and results.`
                  });
                  setShowEvaluationDialog(true);
                }}
                className="relative w-[120px] h-[30px] rounded-[15px] p-[2px] cursor-pointer group"
                style={{
                  background: "linear-gradient(90deg, #7E59F8 0%, #FFF 50%, #7E59F8 100%)"
                }}
              >
                {/* Inner dark-blue background */}
                <div className="w-full h-full rounded-[13px] flex justify-center items-center bg-[#120A2A] group-hover:bg-[#1A0F3E] transition-colors">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 17 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                  >
                    <path d="M8.49991 16.5L9.95148 8.5L8.49991 0.5L7.04834 8.5L8.49991 16.5Z" fill="#FFFFFF"/>
                    <path d="M2.03425 3.56167L8.31776 9.75624L10.1393 7.21373L2.03425 3.56167Z" fill="#FFFFFF"/>
                    <path d="M14.9618 13.4129L8.67834 7.21837L6.85676 9.76088L14.9618 13.4129Z" fill="#FFFFFF"/>
                    <path d="M14.9657 3.56167L8.68224 9.75624L6.86067 7.21373L14.9657 3.56167Z" fill="#FFFFFF"/>
                    <path d="M2.03816 13.4129L8.32166 7.21837L10.1432 9.76088L2.03816 13.4129Z" fill="#FFFFFF"/>
                  </svg>
                  <span className="text-[13px] text-white ml-1">Evaluate</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-5 custom-scrollbar"
      >
        <div className="space-y-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              showAvatar={index === 0 || messages[index - 1].isUser !== message.isUser}
              showTime={index === messages.length - 1 || 
                messages[index + 1]?.isUser !== message.isUser}
              onReply={(msg) => setReplyingTo(msg)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-5 border-t border-[#1A0F3E]">
        {/* Reply preview */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-[#120A2A] rounded-[15px] flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-1 h-10 bg-[#906EFF] rounded-full"></div>
              <div className="overflow-hidden">
                <p className="text-xs text-[#906EFF] mb-1">Replying to {replyingTo.sender}</p>
                <p className="text-sm text-white truncate">{replyingTo.content}</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1A0F3E]"
            >
              <Icon icon="lucide:x" className="w-4 h-4 text-[#8E7EB3]" />
            </button>
          </div>
        )}
        
        {/* File attachment preview */}
        {attachedFile && (
          <div className="mb-3 p-3 bg-[#120A2A] rounded-[15px] flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-md bg-[#15042C] flex items-center justify-center flex-shrink-0">
                <Icon 
                  icon={
                    attachedFile.type.startsWith('image/') 
                      ? "lucide:image" 
                      : attachedFile.type.includes('pdf')
                      ? "lucide:file-text"
                      : "lucide:file"
                  } 
                  className="w-5 h-5 text-[#906EFF]" 
                />
              </div>
              
              <div className="overflow-hidden">
                <p className="text-sm text-white truncate">{attachedFile.name}</p>
                <p className="text-xs text-[#8E7EB3]">
                  {attachedFile.type.split('/')[1].toUpperCase()} • {(attachedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={removeAttachedFile}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1A0F3E]"
            >
              <Icon icon="lucide:x" className="w-4 h-4 text-[#8E7EB3]" />
            </button>
          </div>
        )}
      
        <div className="relative flex items-center gap-2">
          <button 
            type="button"
            onClick={handleFileUpload}
            className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#120A2A] transition"
          >
            <Icon icon="lucide:paperclip" className="w-5 h-5 text-[#8E7EB3]" />
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="w-full h-[50px] bg-[#120A2A] rounded-[15px] pl-4 pr-10 text-white placeholder:text-[#413663] focus:outline-none focus:ring-1 focus:ring-[#906EFF]/50"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#8E7EB3] hover:text-white"
            >
              <Icon icon="lucide:smile" className="w-5 h-5" />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-[#15042C] rounded-[10px] border border-[#2B124C] shadow-md">
                <div className="grid grid-cols-8 gap-1">
                  {["😊", "😂", "❤️", "👍", "🙌", "🔥", "✨", "⭐", 
                    "🎉", "🤔", "😍", "👋", "🙏", "💯", "🌟", "👏"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-[#1A0F3E] rounded-md"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={newMessage.trim() === "" && !attachedFile}
            className="w-[50px] h-[50px] bg-[#0038FF] rounded-[15px] flex items-center justify-center text-white shadow-[0px_0px_15px_rgba(40,76,204,0.3)] hover:bg-[#1a4dff] transition disabled:opacity-50 disabled:hover:bg-[#0038FF]"
          >
            <Icon icon="lucide:send" className="w-5 h-5" />
          </button>
          
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </div>
      </form>

      {/* Evaluation Dialog */}
      <EvaluationDialog
        isOpen={showEvaluationDialog}
        onClose={() => setShowEvaluationDialog(false)}
        tradeData={selectedTrade}
      />
    </div>
  );
}