import { create } from "zustand";

export const useMessageStore = create((set) => ({
  hasUnreadMessages: false,
  setHasUnreadMessages: (status) => set({ hasUnreadMessages: status }),
  
  // This function will check conversations and update the status
  checkUnreadMessages: (conversations) => {
    const hasUnread = conversations.some(conv => conv.unread);
    set({ hasUnreadMessages: hasUnread });
  },
}));
