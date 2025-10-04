"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
import { Inter, Archivo } from "next/font/google";
import { Icon } from "@iconify/react";
import MessageList from "../../../components/messages/message-list";
import MessageConversation from "../../../components/messages/message-conversation";

const inter = Inter({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);

  const loadUnreadCounts = () => {
    try {
      return JSON.parse(localStorage.getItem('unread_counts') || '{}');
    } catch {
      return {};
    }
  };
  const saveUnreadCounts = (obj) => {
    try { localStorage.setItem('unread_counts', JSON.stringify(obj)); } catch {}
  };

  const fetchConversationData = async (conversationId) => {
    console.log('=== FETCHING CONVERSATION DATA ===', conversationId);
    if (!session?.access) {
      console.log('No session access token');
      return;
    }
    try {
      console.log('Making API call to fetch conversation data...');
      const resp = await fetch(`${BACKEND_URL}/conversations/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access}`,
        },
        credentials: 'include',
      });
      console.log('API response status:', resp.status);
      if (!resp.ok) {
        console.log('API response not OK:', resp.status);
        return;
      }
      const data = await resp.json();
      console.log('API response data:', data);
      
      // Find the specific conversation
      const conv = data.conversations?.find(c => c.conversation_id === conversationId);
      console.log('Found conversation:', conv);
      if (conv) {
        const userName = conv.other_user_name?.trim() || conv.other_user_username?.trim() || `User #${conv.other_user_id}`;
        console.log('Final userName:', userName);
        
        // Update the conversation in the list
        setConversations(prev => prev.map(c => 
          c.id === conversationId 
            ? {
                ...c,
                name: userName,
                otherUsername: conv.other_user_username || null,
                otherUserId: conv.other_user_id,
                avatar: conv.other_user_profilepic ? `${BACKEND_URL}/media/${conv.other_user_profilepic}` : "/assets/defaultavatar.png",
              }
            : c
        ));
        console.log('Updated conversation in state');
      } else {
        console.log('Conversation not found in API response');
      }
    } catch (error) {
      console.error('Error fetching conversation data:', error);
    }
  };

  // Load conversation list from backend so both users see threads
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/conversations/`, {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access ? { Authorization: `Bearer ${session.access}` } : {}),
          },
          credentials: 'include',
        });
        if (!resp.ok) return;
        const data = await resp.json();
        console.log('Conversations API response:', data); // Debug log
        const currentId = (session?.user?.user_id ?? session?.user?.id) ? String(session?.user?.user_id ?? session?.user?.id) : null;
        const storedCounts = loadUnreadCounts();
        const list = (data.conversations || []).map((c) => {
          // Better fallback logic for user names
          console.log('Processing conversation:', c); // Debug log
          const userName = c.other_user_name?.trim() || c.other_user_username?.trim() || `User #${c.other_user_id || c.conversation_id}`;
          console.log('Final userName:', userName); // Debug log
          
          return {
            id: c.conversation_id,
            name: userName,
            otherUsername: c.other_user_username || null,
            otherUserId: c.other_user_id,
            avatar: c.other_user_profilepic ? `${BACKEND_URL}/media/${c.other_user_profilepic}` : "/assets/defaultavatar.png",
          lastMessage: (() => {
            if (!c.last_message) return "";
            const isUser = currentId && String(c.last_sender_id) === currentId;
            const speaker = isUser ? 'You' : (c.other_user_name || c.other_user_username || 'Partner');
            return `${speaker}: ${c.last_message}`;
          })(),
          time: c.last_timestamp ? new Date(c.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""),
          unread: (storedCounts && storedCounts[String(c.conversation_id)] > 0) || false,
          unreadCount: Number(storedCounts[String(c.conversation_id)] || 0),
          level: 1,
          rating: "0.0",
          ratingLabel: "",
          messages: [],
          requests: c.reqname || c.exchange ? { requested: c.reqname || '', exchange: c.exchange || '' } : undefined,
          };
        });
        setConversations(list);
        // If arriving without a selection but there is a list, keep none selected
      } catch (e) {
        // silently ignore; UI will show empty
      }
    };
    if (session?.access) loadConversations();
  }, [session?.access]);

  // If arriving with ?thread=ID, fetch that conversation/messages; else if ?user, create stub
  useEffect(() => {
    const threadId = searchParams?.get('thread');
    const username = searchParams?.get('user');
    if (!threadId && !username) return;

    if (threadId) {
      // Try to find the conversation in existing data first
      const idNum = Number(threadId);
      setConversations(prev => {
        const exists = prev.find(c => c.id === idNum);
        if (exists) {
          setSelectedConversation(idNum);
          return prev;
        }
        
        // If not found, create a temporary placeholder and fetch the real data
        const storedCounts = loadUnreadCounts();
        const tempConv = {
          id: idNum,
          username: undefined,
          name: "Loading...", // Temporary name while fetching
          avatar: "/assets/defaultavatar.png",
          lastMessage: "",
          time: "",
          unread: (storedCounts && storedCounts[String(idNum)] > 0) || false,
          unreadCount: Number(storedCounts[String(idNum)] || 0),
          level: 1,
          rating: "0.0",
          ratingLabel: "",
          messages: [],
        };
        setSelectedConversation(idNum);
        
        // Fetch the real conversation data
        fetchConversationData(idNum);
        
        return [tempConv, ...prev];
      });
      return;
    }

    // ?user=USERNAME fallback
    setConversations(prev => {
      // If a conversation with this username already exists, select it
      const existing = prev.find(
        (c) => c.username?.toLowerCase() === username.toLowerCase()
      );
      if (existing) {
        setSelectedConversation(existing.id);
        return prev;
      }

      // Otherwise create a new empty conversation stub and append
      const storedCounts = loadUnreadCounts();
      const newConv = {
        id: Date.now(),
        username,
        name: username,
        avatar: "/assets/defaultavatar.png",
        lastMessage: "",
        time: "",
        unread: false,
        unreadCount: Number(storedCounts[String(username)] || 0),
        level: 1,
        rating: "0.0",
        ratingLabel: "",
        messages: [],
        requests: undefined,
      };
      setSelectedConversation(newConv.id);
      return [newConv, ...prev];
    });
  }, [searchParams]);
  
  // Function to update message in a conversation, update the sidebar preview, and move to top
  const updateConversation = (conversationId, newMessage) => {
    setConversations(prevConversations => {
      const counts = loadUnreadCounts();
      // First, find the conversation and update it
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === conversationId) {
          // Add message to conversation messages array
          const updatedMessages = [...(conv.messages || []), newMessage];
          
          // Create appropriate lastMessage text
          let lastMessage = newMessage.content;
          if (!lastMessage && newMessage.attachment) {
            lastMessage = newMessage.attachment.type.startsWith('image/') 
              ? '📎 Image'
              : '📎 File';
          }
          
          // Update the lastMessage and time for the conversation preview
          const nextUnread = !newMessage.isUser ? (Number(conv.unreadCount || 0) + 1) : (conv.unreadCount || 0);
          if (!newMessage.isUser) {
            counts[String(conversationId)] = nextUnread;
          }
          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: lastMessage,
            time: newMessage.time,
            unread: !newMessage.isUser, // Mark as unread if not from user
            unreadCount: nextUnread
          };
        }
        return conv;
      });
      saveUnreadCounts(counts);
      
      // Now reorder to move the updated conversation to the top
      const conversationToMove = updatedConversations.find(c => c.id === conversationId);
      const otherConversations = updatedConversations.filter(c => c.id !== conversationId);
      
      return [conversationToMove, ...otherConversations];
    });
  };
  
  // Function to mark a conversation as read when viewed
  const markConversationAsRead = (conversationId) => {
    setConversations(prevConversations => {
      const counts = loadUnreadCounts();
      if (counts[String(conversationId)] !== undefined) {
        counts[String(conversationId)] = 0;
        saveUnreadCounts(counts);
      }
      return prevConversations.map(conv => {
        if (conv.id === conversationId && (conv.unread || conv.unreadCount > 0)) {
          return {
            ...conv,
            unread: false,
            unreadCount: 0
          };
        }
        return conv;
      });
    });
  };

  return (
    <div className={`w-full px-[67px] mx-auto text-white ${inter.className} overflow-hidden`} style={{ height: 'calc(100vh - 140px)', paddingBottom: '20px' }}>
      <div className="flex gap-6 h-full overflow-hidden">
        {/* Left side - Message list */}
        <MessageList 
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={(id) => setSelectedConversation(id)}
        />

        {/* Right side - Current conversation */}
        <MessageConversation 
          conversation={conversations.find(c => c.id === selectedConversation)} 
          onSendMessage={(message) => updateConversation(selectedConversation, message)}
          onConversationViewed={() => markConversationAsRead(selectedConversation)}
        />
      </div>
    </div>
  );
}