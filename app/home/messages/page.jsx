"use client";

import { useState, useEffect } from "react";
import { Inter, Archivo } from "next/font/google";
import { Icon } from "@iconify/react";
import MessageList from "../../../components/messages/message-list";
import MessageConversation from "../../../components/messages/message-conversation";

const inter = Inter({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(0);

  // Prevent body scrolling on this page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [conversations, setConversations] = useState([
    {
      id: 0,
      name: "Emily Johnson",
      avatar: "/assets/defaultavatar.png",
      lastMessage: "Nothing in particular. Just bring the tools you usually use.",
      time: "11:11 am",
      unread: false,
      level: 15,
      rating: "5.0",
      ratingLabel: "Rising Star",
      messages: [
        {
          sender: "Emily Johnson",
          content: "Yep! We can do so. Just send me the calendar invite as well: johndoe25@gmail.com.",
          time: "10:45 am",
          isUser: false
        },
        {
          sender: "Emily Johnson",
          content: "BTW, I'll let you know when my garden needs tending. We can schedule after the logo is done 😊",
          time: "10:47 am",
          isUser: false
        },
        {
          sender: "Emily Johnson",
          content: "Do you need me to bring anything on the day of the garden maintenance? I might need to prepare it or purchase it in advance.",
          time: "11:05 am",
          isUser: false
        },
        {
          sender: "Emily Johnson",
          content: "Here's the cafe logo draft I've been working on. What do you think?",
          time: "11:07 am",
          isUser: false,
          attachment: {
            name: "cafe_logo_draft.png",
            type: "image/png",
            url: "https://placehold.co/600x400/15042C/906EFF/png?text=Cafe+Logo+Draft",
            size: 256000
          }
        },
        {
          sender: "You",
          content: "Nothing in particular. Just bring the tools you usually use.",
          time: "11:11 am",
          isUser: true
        }
      ],
      requests: {
        requested: "Logo Design for New Cafe",
        exchange: "Gardening Services"
      }
    },
    {
      id: 1,
      name: "David Chen",
      avatar: "/assets/defaultavatar.png",
      lastMessage: "Hi John, I'm really looking forward to our coding session tomorrow!",
      time: "10:58 am",
      unread: true,
      level: 9,
      rating: "4.8",
      ratingLabel: "Stellar",
      messages: [
        {
          sender: "David Chen",
          content: "Hey John! How's it going?",
          time: "10:45 am",
          isUser: false
        },
        {
          sender: "David Chen",
          content: "I wanted to confirm our coding session for tomorrow. Still on for 3pm?",
          time: "10:50 am",
          isUser: false
        },
        {
          sender: "David Chen",
          content: "Hi John, I'm really looking forward to our coding session tomorrow!",
          time: "10:58 am",
          isUser: false
        }
      ],
      requests: {
        requested: "Coding Mentorship",
        exchange: "Home-Cooked Meals"
      }
    },
    {
      id: 2,
      name: "Sarah Kim",
      avatar: "/assets/defaultavatar.png",
      lastMessage: "Appreciate your help during the workshop yesterday. You were amazing!",
      time: "10:29 am",
      unread: true,
      level: 12,
      rating: "4.9",
      ratingLabel: "Stellar",
      messages: [
        {
          sender: "Sarah Kim",
          content: "Hi John! The website looks amazing. Thank you for your hard work.",
          time: "9:15 am",
          isUser: false
        },
        {
          sender: "Sarah Kim",
          content: "The client is very happy with the results.",
          time: "9:18 am",
          isUser: false
        },
        {
          sender: "You",
          content: "That's great to hear! I'm glad they liked it.",
          time: "10:05 am",
          isUser: true
        },
        {
          sender: "Sarah Kim",
          content: "Appreciate your help during the workshop yesterday. You were amazing!",
          time: "10:29 am",
          isUser: false
        }
      ],
      requests: {
        requested: "Website Design",
        exchange: "Marketing Consultation"
      }
    },
    {
      id: 3,
      name: "Michael Lee",
      avatar: "/assets/defaultavatar.png",
      lastMessage: "Thanks again for the awesome photography session. The pictures are perfect!",
      time: "9:43 am",
      unread: false,
      level: 14,
      rating: "5.0",
      ratingLabel: "Rising Star",
      messages: [
        {
          sender: "Michael Lee",
          content: "John, I received the photos yesterday.",
          time: "9:30 am",
          isUser: false
        },
        {
          sender: "Michael Lee",
          content: "They turned out even better than I expected!",
          time: "9:32 am",
          isUser: false
        },
        {
          sender: "You",
          content: "I'm really glad you like them. It was a great shoot.",
          time: "9:40 am",
          isUser: true
        },
        {
          sender: "You",
          content: "Here's the photography invoice as requested",
          time: "9:41 am",
          isUser: true,
          attachment: {
            name: "photography_invoice.pdf",
            type: "application/pdf",
            url: "#",
            size: 128500
          }
        },
        {
          sender: "Michael Lee",
          content: "Thanks again for the awesome photography session. The pictures are perfect!",
          time: "9:43 am",
          isUser: false
        }
      ],
      requests: {
        requested: "Professional Photography",
        exchange: "Guitar Lessons"
      }
    },
    {
      id: 4,
      name: "Mark Thompson",
      avatar: "/assets/defaultavatar.png",
      lastMessage: "Let me know if you still want help with the move this weekend.",
      time: "9:10 am",
      unread: false,
      level: 8,
      rating: "4.6",
      ratingLabel: "Promising",
      messages: [
        {
          sender: "Mark Thompson",
          content: "Hey, about the furniture assembly next week...",
          time: "8:50 am",
          isUser: false
        },
        {
          sender: "Mark Thompson",
          content: "I was thinking we could start around 10am if that works for you?",
          time: "8:52 am",
          isUser: false
        },
        {
          sender: "You",
          content: "10am sounds great. I'll have everything ready by then.",
          time: "9:05 am",
          isUser: true
        },
        {
          sender: "Mark Thompson",
          content: "Let me know if you still want help with the move this weekend.",
          time: "9:10 am",
          isUser: false
        }
      ],
      requests: {
        requested: "Moving Assistance",
        exchange: "Computer Repair"
      }
    },
    {
      id: 5,
      name: "Priya Patel",
      avatar: "/assets/defaultavatar.png",
      lastMessage: "Thanks for the tutoring session yesterday. My son's math grades are already improving!",
      time: "8:00 am",
      unread: false,
      level: 11,
      rating: "4.7",
      ratingLabel: "Stellar",
      messages: [
        {
          sender: "Priya Patel",
          content: "Good morning John!",
          time: "7:45 am",
          isUser: false
        },
        {
          sender: "You",
          content: "Good morning Priya. How's your son doing with the math problems I gave him?",
          time: "7:50 am",
          isUser: true
        },
        {
          sender: "Priya Patel",
          content: "He completed all of them last night and actually enjoyed it!",
          time: "7:55 am",
          isUser: false
        },
        {
          sender: "Priya Patel",
          content: "Thanks for the tutoring session yesterday. My son's math grades are already improving!",
          time: "8:00 am",
          isUser: false
        }
      ],
      requests: {
        requested: "Math Tutoring",
        exchange: "Home-Cooked Meals"
      }
    },
    {
      id: 6,
      name: "Mary Jean",
      avatar: "/assets/defaultavatar.png",
      lastMessage: "Couldn't have done it without your design expertise. The logo is perfect!",
      time: "7:56 am",
      unread: false,
      level: 10,
      rating: "4.9",
      ratingLabel: "Stellar",
      messages: [
        {
          sender: "You",
          content: "Hi Mary, I've sent over the final logo designs. Let me know what you think!",
          time: "Yesterday",
          isUser: true
        },
        {
          sender: "Mary Jean",
          content: "Just opened them. They look amazing!",
          time: "Yesterday",
          isUser: false
        },
        {
          sender: "Mary Jean",
          content: "I think the third option is exactly what I was looking for. The client will love it.",
          time: "7:50 am",
          isUser: false
        },
        {
          sender: "Mary Jean",
          content: "Couldn't have done it without your design expertise. The logo is perfect!",
          time: "7:56 am",
          isUser: false
        }
      ],
      requests: {
        requested: "Logo Design",
        exchange: "Social Media Management"
      }
    }
  ]);
  
  // Function to update message in a conversation, update the sidebar preview, and move to top
  const updateConversation = (conversationId, newMessage) => {
    setConversations(prevConversations => {
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
          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: lastMessage,
            time: newMessage.time,
            unread: !newMessage.isUser // Mark as unread if not from user
          };
        }
        return conv;
      });
      
      // Now reorder to move the updated conversation to the top
      const conversationToMove = updatedConversations.find(c => c.id === conversationId);
      const otherConversations = updatedConversations.filter(c => c.id !== conversationId);
      
      return [conversationToMove, ...otherConversations];
    });
  };
  
  // Function to mark a conversation as read when viewed
  const markConversationAsRead = (conversationId) => {
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv.id === conversationId && conv.unread) {
          return {
            ...conv,
            unread: false
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