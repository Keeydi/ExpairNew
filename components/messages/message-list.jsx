"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { cn } from "../../lib/utils";

export default function MessageList({ conversations = [], selectedId, onSelect }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredConversations = conversations.filter(
    (conv) => conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[400px] bg-[#0C071B] rounded-[25px] h-full flex flex-col overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-5">Your messages</h2>
        
        {/* Search and filters */}
        <div className="flex items-center gap-2 mb-5">
          {/* Search input */}
          <div className="flex-1 relative">
            <div className="relative">
              <Icon 
                icon="lucide:search" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#413663] w-5 h-5"
              />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[40px] bg-[#120A2A] rounded-[15px] pl-10 pr-4 text-white placeholder:text-[#413663] focus:outline-none focus:ring-1 focus:ring-[#906EFF]/50"
              />
            </div>
          </div>
          
          {/* Sort button */}
          <div className="relative">
            <button 
              onClick={() => setSortOpen(!sortOpen)}
              className="w-[40px] h-[40px] bg-[#120A2A] rounded-[15px] flex items-center justify-center text-white hover:bg-[#1A0F3E] transition"
            >
              <Icon icon="lucide:arrow-up-down" className="w-5 h-5" />
            </button>
            
            {sortOpen && (
              <div className="absolute z-10 mt-2 w-[150px] right-0 bg-[#15042C] rounded-[10px] border border-[#2B124C] shadow-md">
                <div className="py-1">
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A0F3E]"
                    onClick={() => setSortOpen(false)}
                  >
                    Recent
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A0F3E]"
                    onClick={() => setSortOpen(false)}
                  >
                    Unread first
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A0F3E]"
                    onClick={() => setSortOpen(false)}
                  >
                    Alphabetical
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Filter button */}
          <div className="relative">
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className="w-[40px] h-[40px] bg-[#120A2A] rounded-[15px] flex items-center justify-center text-white hover:bg-[#1A0F3E] transition"
            >
              <Icon icon="lucide:filter" className="w-5 h-5" />
            </button>
            
            {filterOpen && (
              <div className="absolute z-10 mt-2 w-[150px] right-0 bg-[#15042C] rounded-[10px] border border-[#2B124C] shadow-md">
                <div className="py-1">
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A0F3E]"
                    onClick={() => setFilterOpen(false)}
                  >
                    All messages
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A0F3E]"
                    onClick={() => setFilterOpen(false)}
                  >
                    Unread
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A0F3E]"
                    onClick={() => setFilterOpen(false)}
                  >
                    Starred
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "w-full p-5 flex items-start gap-3 border-b border-[#1A0F3E] hover:bg-[#120A2A] transition text-left",
                selectedId === conversation.id && "bg-[#120A2A]"
              )}
            >
              <div className="relative">
                <Image
                  src={conversation.avatar}
                  alt={conversation.name}
                  width={45}
                  height={45}
                  className="rounded-full"
                />
                {conversation.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[4px] bg-[#0038FF] text-white text-[10px] leading-[18px] rounded-full text-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[16px] text-white truncate">{conversation.name}</h4>
                  <span className="text-[13px] text-[#8E7EB3]">{conversation.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm truncate flex-1",
                    conversation.unread ? "text-white" : "text-[#8E7EB3]"
                  )}>
                    {conversation.messages && conversation.messages.length > 0 ? (
                      <>
                        {conversation.messages[conversation.messages.length - 1].isUser ? "You: " : `${conversation.name.split(' ')[0]}: `}
                        {conversation.messages[conversation.messages.length - 1].attachment && !conversation.messages[conversation.messages.length - 1].content
                          ? `📎 ${conversation.messages[conversation.messages.length - 1].attachment.type.startsWith('image/') ? 'Image' : 'File'}`
                          : (conversation.messages[conversation.messages.length - 1].content || conversation.lastMessage)}
                      </>
                    ) : (
                      conversation.lastMessage
                    )}
                  </p>
                  {conversation.unread && (
                    <div className="w-2 h-2 bg-[#0038FF] rounded-full flex-shrink-0"></div>
                  )}
                </div>
                
                {/* Trade tags */}
                {conversation.requests && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 w-full">
                    <div className="max-w-[45%] text-[#0038FF] text-[13px] font-normal truncate">
                      {conversation.requests.requested}
                    </div>
                    <span className="text-xs text-[#8E7EB3] flex-shrink-0">×</span>
                    <div className="max-w-[45%] text-[#906EFF] text-[13px] font-normal truncate">
                      {conversation.requests.exchange}
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Icon icon="lucide:search-x" className="w-10 h-10 text-[#413663] mb-2" />
            <p className="text-[#8E7EB3]">No conversations match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}