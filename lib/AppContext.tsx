"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { UserProfile, Item, ChatRoom, Message, ItemStatus, MessageType, ChatReservationStatus, TradeRequest, AppNotification } from "./types";
import { MOCK_ITEMS, MOCK_USERS } from "./constants";
import { supabase } from "./supabase";

interface AppContextType {
  currentUser: UserProfile | null;
  items: Item[];
  chatRooms: ChatRoom[];
  users: UserProfile[];
  tradeRequests: TradeRequest[];
  notifications: AppNotification[];
  login: (email: string) => boolean;
  signup: (email: string, nickname: string, department: string) => { success: boolean; error?: string };
  logout: () => void;
  createItem: (itemData: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    images: string[];
    location: string;
    timeSlots: string[];
  }) => Item | null;
  updateItemStatus: (itemId: string, status: ItemStatus) => void;
  deleteItem: (itemId: string) => void;
  updateItem: (itemId: string, itemData: Partial<Item>) => void;
  getOrCreateChatRoom: (itemId: string) => string | null;
  sendMessage: (chatRoomId: string, content: string, type?: MessageType, proposedTimeSlot?: string) => void;
  proposeReservation: (chatRoomId: string, timeSlot: string) => void;
  acceptReservation: (chatRoomId: string) => void;
  rejectReservation: (chatRoomId: string) => void;
  completeTrade: (itemId: string) => void;
  submitReview: (itemId: string, reviewerId: string, rating: number, badges: string[], comment: string) => void;
  toggleLikeItem: (itemId: string) => void;
  incrementItemViews: (itemId: string) => void;
  createTradeRequest: (itemId: string, location: string, timeSlot: string, message?: string) => boolean;
  acceptTradeRequest: (requestId: string) => void;
  rejectTradeRequest: (requestId: string) => void;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  openLoginPopup: () => void;
  isInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isWritingRef = useRef(false);

  const openLoginPopup = () => {
    if (typeof window === "undefined") return;
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      "/auth",
      "uni_market_login",
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no,location=no`
    );
  };

  // Listen to popup authentication events
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "AUTH_SUCCESS") {
        const storedCurrentUser = localStorage.getItem("uni_current_user");
        const storedUsers = localStorage.getItem("uni_users");
        if (storedCurrentUser) {
          setCurrentUser(JSON.parse(storedCurrentUser));
        }
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "uni_current_user") {
        if (e.newValue) {
          setCurrentUser(JSON.parse(e.newValue));
        } else {
          setCurrentUser(null);
        }
      }
      if (e.key === "uni_users" && e.newValue) {
        setUsers(JSON.parse(e.newValue));
      }
    };

    window.addEventListener("message", handleAuthMessage);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("message", handleAuthMessage);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (session?.user) {
          const user = session.user;
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .eq("id", user.id)
              .single();

            if (profile) {
              const mappedUser: UserProfile = {
                id: profile.id,
                email: profile.email,
                nickname: profile.nickname || user.user_metadata?.full_name || user.email?.split("@")[0] || "학우",
                department: profile.department || "인천대학교 학생",
                mannerTemp: Number(profile.manner_temp) || 36.5,
                completedTradesCount: profile.completed_trades_count || 0,
                reviews: [],
                wishlist: profile.wishlist || [],
                avatarUrl: profile.avatar_url || user.user_metadata?.avatar_url,
              };
              setCurrentUser(mappedUser);
              setUsers((prev) => {
                const exists = prev.some((u) => u.id === mappedUser.id);
                if (exists) {
                  return prev.map((u) => (u.id === mappedUser.id ? mappedUser : u));
                } else {
                  return [...prev, mappedUser];
                }
              });
            } else {
              const nickname = user.user_metadata?.full_name || user.email?.split("@")[0] || "학우";
              const avatarUrl = user.user_metadata?.avatar_url || "";
              const newProfileData = {
                id: user.id,
                email: user.email || "",
                nickname: nickname,
                avatar_url: avatarUrl,
                department: "인천대학교 학생",
                manner_temp: 36.5,
                completed_trades_count: 0,
                wishlist: []
              };

              await supabase.from("users").insert(newProfileData);

              const mappedUser: UserProfile = {
                id: user.id,
                email: user.email || "",
                nickname: nickname,
                department: "인천대학교 학생",
                mannerTemp: 36.5,
                completedTradesCount: 0,
                reviews: [],
                wishlist: [],
                avatarUrl: avatarUrl,
              };
              setCurrentUser(mappedUser);
              setUsers((prev) => {
                const exists = prev.some((u) => u.id === mappedUser.id);
                if (exists) {
                  return prev.map((u) => (u.id === mappedUser.id ? mappedUser : u));
                } else {
                  return [...prev, mappedUser];
                }
              });
            }
          } catch (dbErr) {
            console.error("Supabase Database Sync Error, using fallback metadata:", dbErr);
            const mappedUser: UserProfile = {
              id: user.id,
              email: user.email || "",
              nickname: user.user_metadata?.full_name || user.email?.split("@")[0] || "학우",
              department: "인천대학교 학생",
              mannerTemp: 36.5,
              completedTradesCount: 0,
              reviews: [],
              wishlist: [],
              avatarUrl: user.user_metadata?.avatar_url || "",
            };
            setCurrentUser(mappedUser);
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === mappedUser.id);
              if (exists) {
                return prev.map((u) => (u.id === mappedUser.id ? mappedUser : u));
              } else {
                return [...prev, mappedUser];
              }
            });
          }
        } else {
          if (event === "SIGNED_OUT") {
            setCurrentUser(null);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initialize from server API (with localStorage fallback)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Defer loading current user to avoid synchronous setState inside useEffect warning
      setTimeout(() => {
        const storedCurrentUser = localStorage.getItem("uni_current_user");
        const parsedCurrentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : null;
        if (parsedCurrentUser) {
          setCurrentUser(parsedCurrentUser);
        }
      }, 0);

      const loadData = async () => {
        try {
          const res = await fetch("/api/store");
          if (res.ok) {
            const data = await res.json();
            setUsers(data.users || MOCK_USERS);
            setItems(data.items || []);
            setChatRooms(data.chatRooms || []);
            setTradeRequests(data.tradeRequests || []);
            setNotifications(data.notifications || []);
            console.log("[AppContext load] Loaded from server store");
          } else {
            throw new Error("Server store response not OK");
          }
        } catch (err) {
          console.error("Failed to load server store, falling back to localStorage:", err);
          
          const storedUsers = localStorage.getItem("uni_users");
          const storedItems = localStorage.getItem("uni_items");
          const storedChats = localStorage.getItem("uni_chats");
          const storedTradeRequests = localStorage.getItem("uni_trade_requests");
          const storedNotifications = localStorage.getItem("uni_notifications");

          const parsedUsers = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
          const parsedItemsRaw = storedItems ? JSON.parse(storedItems) : MOCK_ITEMS;
          const parsedItems = parsedItemsRaw.map((item: any) => ({
            ...item,
            category: item.category === "디지털/가전" ? "전자기기" : item.category,
            condition: item.condition || "사용감 있음"
          }));
          const parsedChats = storedChats ? JSON.parse(storedChats) : [];
          const parsedTradeRequests = storedTradeRequests ? JSON.parse(storedTradeRequests) : [];
          
          const defaultNotifications: AppNotification[] = [
            { id: "notif_1", userId: "user_inu_senior", text: "정보기과26님이 대화방에서 예약을 제안했습니다.", time: new Date(Date.now() - 300000).toISOString(), read: false, type: "GENERAL" },
            { id: "notif_2", userId: "user_inu_senior", text: "알기 쉬운 알고리즘 전공책 판매 예약이 확정되었습니다.", time: new Date(Date.now() - 600000).toISOString(), read: false, type: "GENERAL" },
            { id: "notif_3", userId: "user_inu_senior", text: "경영학도님과의 직거래가 완료되었습니다. 후기를 남겨주세요.", time: new Date(Date.now() - 3600000).toISOString(), read: true, type: "GENERAL" },
          ];
          const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : defaultNotifications;

          setUsers(parsedUsers);
          setItems(parsedItems);
          setChatRooms(parsedChats);
          setTradeRequests(parsedTradeRequests);
          setNotifications(parsedNotifications);
        } finally {
          setTimeout(() => {
            setIsInitialized(true);
            console.log("[AppContext load] isInitialized set to true");
          }, 0);
        }
      };

      loadData();
    }
  }, []);

  // Save to localStorage AND server when state changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("uni_users", JSON.stringify(users));
      localStorage.setItem("uni_items", JSON.stringify(items));
      localStorage.setItem("uni_chats", JSON.stringify(chatRooms));
      localStorage.setItem("uni_trade_requests", JSON.stringify(tradeRequests));
      localStorage.setItem("uni_notifications", JSON.stringify(notifications));
      if (currentUser) {
        localStorage.setItem("uni_current_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("uni_current_user");
      }
      const syncToServer = async () => {
        try {
          isWritingRef.current = true;
          await fetch("/api/store", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items,
              users,
              chatRooms,
              tradeRequests,
              notifications,
            }),
          });
        } catch (error) {
          console.error("Failed to sync store to server:", error);
        } finally {
          setTimeout(() => {
            isWritingRef.current = false;
          }, 1500);
        }
      };

      syncToServer();
    }
  }, [users, items, chatRooms, currentUser, tradeRequests, notifications, isInitialized]);

  // Sync state with server in real-time on window focus and a low frequency interval
  useEffect(() => {
    if (!isInitialized) return;

    const handleFocusSync = async () => {
      if (isWritingRef.current) return;
      try {
        const res = await fetch("/api/store");
        if (res.ok) {
          const data = await res.json();

          if (isWritingRef.current) return;

          if (JSON.stringify(items) !== JSON.stringify(data.items)) {
            setItems(data.items || []);
          }
          if (JSON.stringify(users) !== JSON.stringify(data.users)) {
            setUsers(data.users || []);
          }
          if (JSON.stringify(chatRooms) !== JSON.stringify(data.chatRooms)) {
            setChatRooms(data.chatRooms || []);
          }
          if (JSON.stringify(tradeRequests) !== JSON.stringify(data.tradeRequests)) {
            setTradeRequests(data.tradeRequests || []);
          }
          if (JSON.stringify(notifications) !== JSON.stringify(data.notifications)) {
            setNotifications(data.notifications || []);
          }
        }
      } catch (err) {
        console.error("Failed to focus-sync with server store:", err);
      }
    };

    window.addEventListener("focus", handleFocusSync);
    const interval = setInterval(handleFocusSync, 5000);

    return () => {
      window.removeEventListener("focus", handleFocusSync);
      clearInterval(interval);
    };
  }, [isInitialized, items, users, chatRooms, tradeRequests, notifications]);

  const login = (email: string): boolean => {
    const formattedEmail = email.trim().toLowerCase();
    const foundUser = users.find((u) => u.email.toLowerCase() === formattedEmail);
    if (foundUser) {
      setCurrentUser(foundUser);
      return true;
    }

    // Auto-register valid INU university email domains on login attempt
    const inuDomainRegex = /^[a-zA-Z0-9._%+-]+@(inu\.ac\.kr|inchon\.ac\.kr)$/;
    if (inuDomainRegex.test(formattedEmail)) {
      const emailPrefix = formattedEmail.split("@")[0];
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        email: formattedEmail,
        nickname: emailPrefix,
        department: "인천대학교 학생",
        mannerTemp: 36.5,
        completedTradesCount: 0,
        wishlist: [],
        reviews: [],
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      return true;
    }
    return false;
  };

  const signup = (email: string, nickname: string, department: string): { success: boolean; error?: string } => {
    const formattedEmail = email.trim().toLowerCase();
    
    // Validation
    const inuDomainRegex = /^[a-zA-Z0-9._%+-]+@(inu\.ac\.kr|inchon\.ac\.kr)$/;
    if (!inuDomainRegex.test(formattedEmail)) {
      return { success: false, error: "인천대학교 이메일(@inu.ac.kr)만 가입 가능합니다." };
    }

    if (users.some((u) => u.email.toLowerCase() === formattedEmail)) {
      return { success: false, error: "이미 가입된 이메일입니다." };
    }

    if (users.some((u) => u.nickname === nickname.trim())) {
      return { success: false, error: "이미 사용 중인 닉네임입니다." };
    }

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: formattedEmail,
      nickname: nickname.trim(),
      department: department,
      mannerTemp: 36.5,
      completedTradesCount: 0,
      wishlist: [],
      reviews: [],
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const createItem = (itemData: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    images: string[];
    location: string;
    timeSlots: string[];
  }): Item | null => {
    if (!currentUser) return null;
    isWritingRef.current = true;

    const newItem: Item = {
      ...itemData,
      id: `item_${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.nickname,
      sellerMannerTemp: currentUser.mannerTemp,
      sellerDept: currentUser.department || "인천대학교 학생",
      status: "ON_SALE",
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      likedBy: [],
    };

    setItems((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateItemStatus = (itemId: string, status: ItemStatus) => {
    isWritingRef.current = true;
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
    // Also update any associated chats status if completed
    setChatRooms((prev) =>
      prev.map((chat) =>
        chat.itemId === itemId ? { ...chat, itemStatus: status } : chat
      )
    );
  };

  const deleteItem = (itemId: string) => {
    isWritingRef.current = true;
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setChatRooms((prev) => prev.filter((chat) => chat.itemId !== itemId));
    setTradeRequests((prev) => prev.filter((req) => req.itemId !== itemId));
  };

  const updateItem = (itemId: string, itemData: Partial<Item>) => {
    isWritingRef.current = true;
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...itemData } : item))
    );
    setChatRooms((prev) =>
      prev.map((chat) =>
        chat.itemId === itemId
          ? {
              ...chat,
              itemTitle: itemData.title || chat.itemTitle,
              itemPrice: itemData.price !== undefined ? itemData.price : chat.itemPrice,
              itemImage: (itemData.images && itemData.images[0]) || chat.itemImage,
            }
          : chat
      )
    );
  };

  const getOrCreateChatRoom = (itemId: string): string | null => {
    if (!currentUser) return null;

    const item = items.find((i) => i.id === itemId);
    if (!item) return null;

    // A seller shouldn't chat with themselves
    if (item.sellerId === currentUser.id) return null;

    // Check if chat room already exists
    const existing = chatRooms.find(
      (c) => c.itemId === itemId && c.buyerId === currentUser.id
    );
    if (existing) return existing.id;

    // Create a new one
    const newChatId = `chat_${Date.now()}`;
    const newChat: ChatRoom = {
      id: newChatId,
      itemId: item.id,
      itemTitle: item.title,
      itemPrice: item.price,
      itemImage: item.images[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60",
      itemStatus: item.status,
      buyerId: currentUser.id,
      buyerName: currentUser.nickname,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      messages: [
        {
          id: `msg_sys_${Date.now()}`,
          senderId: "system",
          senderName: "시스템",
          content: `${currentUser.nickname}님이 대화를 시작했습니다. 안전한 대학 내 거래를 위해 거래 장소와 시간을 조율해주세요.`,
          timestamp: new Date().toISOString(),
          type: "SYSTEM",
        },
      ],
      reservationStatus: "NONE",
    };

    setChatRooms((prev) => [newChat, ...prev]);
    return newChatId;
  };

  const sendMessage = (
    chatRoomId: string,
    content: string,
    type: MessageType = "TEXT",
    proposedTimeSlot?: string
  ) => {
    if (!currentUser) return;

    setChatRooms((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatRoomId) return chat;

        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.nickname,
          content,
          timestamp: new Date().toISOString(),
          type,
          proposedTimeSlot,
        };

        const updatedMessages = [...chat.messages, newMsg];

        return {
          ...chat,
          messages: updatedMessages,
          lastMessageText: type === "RESERVATION_PROPOSAL" ? "📅 거래 예약 제안" : content,
          lastMessageTime: newMsg.timestamp,
        };
      })
    );
  };

  const proposeReservation = (chatRoomId: string, timeSlot: string) => {
    if (!currentUser) return;

    setChatRooms((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatRoomId) return chat;

        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.nickname,
          content: `📅 [거래 예약 제안] "${timeSlot}" 거래를 제안합니다.`,
          timestamp: new Date().toISOString(),
          type: "RESERVATION_PROPOSAL",
          proposedTimeSlot: timeSlot,
        };

        return {
          ...chat,
          messages: [...chat.messages, newMsg],
          reservationStatus: "PROPOSED",
          proposedTimeSlot: timeSlot,
          lastMessageText: `📅 거래 예약 제안: ${timeSlot}`,
          lastMessageTime: newMsg.timestamp,
        };
      })
    );
  };

  const acceptReservation = (chatRoomId: string) => {
    if (!currentUser) return;

    setChatRooms((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatRoomId) return chat;

        const acceptedTime = chat.proposedTimeSlot || "";
        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          senderId: "system",
          senderName: "시스템",
          content: `✅ 거래 예약이 확정되었습니다!\n시간: ${acceptedTime}\n장소: ${
            items.find((i) => i.id === chat.itemId)?.location || "상세 대화 확인"
          }\n\n약속 시간에 맞춰 지정된 장소에서 만나요!`,
          timestamp: new Date().toISOString(),
          type: "SYSTEM",
        };

        // Update item status in global items array
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === chat.itemId
              ? {
                  ...item,
                  status: "RESERVED",
                  reservedBuyerId: chat.buyerId,
                  reservedBuyerName: chat.buyerName,
                  selectedTimeSlot: acceptedTime,
                }
              : item
          )
        );

        return {
          ...chat,
          messages: [...chat.messages, newMsg],
          reservationStatus: "ACCEPTED",
          itemStatus: "RESERVED" as ItemStatus,
          lastMessageText: "✅ 거래 예약 확정",
          lastMessageTime: newMsg.timestamp,
        };
      })
    );
  };

  const rejectReservation = (chatRoomId: string) => {
    if (!currentUser) return;

    setChatRooms((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatRoomId) return chat;

        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          senderId: "system",
          senderName: "시스템",
          content: `❌ 거래 예약 제안이 거절되었습니다. 다른 시간으로 조율해주세요.`,
          timestamp: new Date().toISOString(),
          type: "SYSTEM",
        };

        return {
          ...chat,
          messages: [...chat.messages, newMsg],
          reservationStatus: "REJECTED",
          lastMessageText: "❌ 예약 제안 거절됨",
          lastMessageTime: newMsg.timestamp,
        };
      })
    );
  };

  const completeTrade = (itemId: string) => {
    updateItemStatus(itemId, "COMPLETED");

    // Also update current buyer/seller stats
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const sellerId = item.sellerId;
    const buyerId = item.reservedBuyerId;

    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === sellerId || (buyerId && u.id === buyerId)) {
          return {
            ...u,
            completedTradesCount: u.completedTradesCount + 1,
          };
        }
        return u;
      })
    );

    // If active user is seller/buyer, update active session stats
    setCurrentUser((prev) => {
      if (!prev) return null;
      if (prev.id === sellerId || (buyerId && prev.id === buyerId)) {
        return {
          ...prev,
          completedTradesCount: prev.completedTradesCount + 1,
        };
      }
      return prev;
    });

    // Send a system message in the chat room to write a review
    setChatRooms((prevChats) =>
      prevChats.map((chat) => {
        if (chat.itemId !== itemId) return chat;
        
        const systemMsg: Message = {
          id: `msg_sys_comp_${Date.now()}`,
          senderId: "system",
          senderName: "시스템",
          content: `🎉 거래가 완료되었습니다! 상대방에 대한 따뜻한 후기를 남겨주세요.`,
          timestamp: new Date().toISOString(),
          type: "SYSTEM",
        };

        return {
          ...chat,
          itemStatus: "COMPLETED",
          messages: [...chat.messages, systemMsg],
        };
      })
    );
  };

  const submitReview = (
    itemId: string,
    reviewerId: string,
    rating: number,
    badges: string[],
    comment: string
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Target is the other party
    const targetUserId = item.sellerId === reviewerId ? item.reservedBuyerId : item.sellerId;
    if (!targetUserId) return;

    const reviewer = users.find((u) => u.id === reviewerId);
    if (!reviewer) return;

    const newReview = {
      id: `rev_${Date.now()}`,
      itemId,
      reviewerId,
      reviewerName: reviewer.nickname,
      rating,
      badges,
      comment,
      createdAt: new Date().toISOString(),
    };

    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === targetUserId) {
          const newReviews = [...u.reviews, newReview];
          // Recalculate manner temperature
          // Each review updates manner temperature depending on rating:
          // Rating 5: +0.5, 4: +0.2, 3: 0.0, 2: -0.3, 1: -0.8
          let tempDelta = 0;
          if (rating === 5) tempDelta = 0.5;
          else if (rating >= 4) tempDelta = 0.2;
          else if (rating >= 3) tempDelta = 0;
          else if (rating >= 2) tempDelta = -0.3;
          else tempDelta = -0.8;

          const newTemp = Math.min(Math.max(u.mannerTemp + tempDelta, 0), 99.9);

          return {
            ...u,
            reviews: newReviews,
            mannerTemp: parseFloat(newTemp.toFixed(1)),
          };
        }
        return u;
      })
    );

    // If target user is current user, update current user too
    if (currentUser && currentUser.id === targetUserId) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const newReviews = [...prev.reviews, newReview];
        let tempDelta = 0;
        if (rating === 5) tempDelta = 0.5;
        else if (rating >= 4) tempDelta = 0.2;
        else if (rating >= 3) tempDelta = 0;
        else if (rating >= 2) tempDelta = -0.3;
        else tempDelta = -0.8;
        const newTemp = Math.min(Math.max(prev.mannerTemp + tempDelta, 0), 99.9);
        return {
          ...prev,
          reviews: newReviews,
          mannerTemp: parseFloat(newTemp.toFixed(1)),
        };
      });
    }
  };

  const toggleLikeItem = (itemId: string) => {
    if (!currentUser) return;

    // Toggle in user's wishlist
    const currentWishlist = currentUser.wishlist || [];
    const isLiked = currentWishlist.includes(itemId);
    const updatedWishlist = isLiked
      ? currentWishlist.filter((id) => id !== itemId)
      : [...currentWishlist, itemId];

    const updatedUser = {
      ...currentUser,
      wishlist: updatedWishlist,
    };

    // Update currentUser state
    setCurrentUser(updatedUser);

    // Update user in users list
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === currentUser.id ? updatedUser : u))
    );

    // Update item likes & likedBy list
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) return item;

        const currentLikedBy = item.likedBy || [];
        const alreadyLiked = currentLikedBy.includes(currentUser.id);
        const newLikedBy = alreadyLiked
          ? currentLikedBy.filter((uid) => uid !== currentUser.id)
          : [...currentLikedBy, currentUser.id];
        
        return {
          ...item,
          likes: newLikedBy.length,
          likedBy: newLikedBy,
        };
      })
    );
  };

  const incrementItemViews = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          views: (item.views || 0) + 1,
        };
      })
    );
  };

  const createTradeRequest = (
    itemId: string,
    location: string,
    timeSlot: string,
    message?: string
  ): boolean => {
    if (!currentUser) return false;
    isWritingRef.current = true;

    const item = items.find((i) => i.id === itemId);
    if (!item) return false;

    // Seller cannot request their own item
    if (item.sellerId === currentUser.id) return false;

    // If item is already reserved or completed, block request
    if (item.status !== "ON_SALE") return false;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newRequest: TradeRequest = {
      id: `req_${Date.now()}`,
      itemId: item.id,
      itemTitle: item.title,
      itemImage: item.images[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60",
      itemPrice: item.price,
      buyerId: currentUser.id,
      buyerName: currentUser.nickname,
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      selectedLocation: location,
      selectedTimeSlot: timeSlot,
      message,
      status: "PENDING",
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    // Immediately change the item status to RESERVED and set buyer details
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.id === itemId
          ? {
              ...i,
              status: "RESERVED" as const,
              reservedBuyerId: currentUser.id,
              reservedBuyerName: currentUser.nickname,
              selectedTimeSlot: timeSlot,
            }
          : i
      )
    );

    setTradeRequests((prev) => [newRequest, ...prev]);

    // Dispatch action notification to seller
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: item.sellerId,
      text: `새로운 거래 요청이 도착했습니다! [${location} / ${timeSlot}] 수락하시겠습니까?`,
      time: new Date().toISOString(),
      read: false,
      type: "TRADE_REQUEST",
      relatedId: newRequest.id,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    return true;
  };

  const acceptTradeRequest = (requestId: string) => {
    isWritingRef.current = true;
    setTradeRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "ACCEPTED" } : r))
    );

    const req = tradeRequests.find((r) => r.id === requestId);
    if (!req) return;

    // Update item status
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === req.itemId
          ? {
              ...item,
              status: "RESERVED" as const,
              reservedBuyerId: req.buyerId,
              reservedBuyerName: req.buyerName,
              selectedTimeSlot: req.selectedTimeSlot,
            }
          : item
      )
    );

    // Find if chat room already exists
    const existing = chatRooms.find(
      (c) => c.itemId === req.itemId && c.buyerId === req.buyerId
    );
    let chatRoomId = existing?.id;

    if (!existing) {
      chatRoomId = `chat_${Date.now()}`;
      const newChat: ChatRoom = {
        id: chatRoomId,
        itemId: req.itemId,
        itemTitle: req.itemTitle,
        itemPrice: req.itemPrice,
        itemImage: req.itemImage,
        itemStatus: "RESERVED",
        buyerId: req.buyerId,
        buyerName: req.buyerName,
        sellerId: req.sellerId,
        sellerName: req.sellerName,
        messages: [
          {
            id: `msg_sys_${Date.now()}`,
            senderId: "system",
            senderName: "시스템",
            content: `${req.buyerName}님의 거래 신청이 수락되었습니다. 거래 예약이 완료되었습니다!\n약속 장소: ${req.selectedLocation}\n약속 시간: ${req.selectedTimeSlot}`,
            timestamp: new Date().toISOString(),
            type: "SYSTEM",
          },
        ],
        reservationStatus: "ACCEPTED",
        proposedTimeSlot: req.selectedTimeSlot,
        lastMessageText: "✅ 거래 신청 수락됨",
        lastMessageTime: new Date().toISOString(),
      };
      setChatRooms((prev) => [newChat, ...prev]);
    } else {
      setChatRooms((prev) =>
        prev.map((c) => {
          if (c.id !== chatRoomId) return c;
          return {
            ...c,
            itemStatus: "RESERVED" as const,
            reservationStatus: "ACCEPTED" as const,
            proposedTimeSlot: req.selectedTimeSlot,
            messages: [
              ...c.messages,
              {
                id: `msg_sys_${Date.now()}`,
                senderId: "system",
                senderName: "시스템",
                content: `✅ 거래 신청이 수락되었습니다!\n약속 장소: ${req.selectedLocation}\n약속 시간: ${req.selectedTimeSlot}\n\n채팅방에서 상세 조율을 완료해 주세요.`,
                timestamp: new Date().toISOString(),
                type: "SYSTEM",
              },
            ],
            lastMessageText: "✅ 거래 신청 수락됨",
            lastMessageTime: new Date().toISOString(),
          };
        })
      );
    }

    // Trigger notification to buyer
    const buyerNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: req.buyerId,
      text: `거래가 확정되었습니다. 약속 장소와 시간을 확인해 주세요.`,
      time: new Date().toISOString(),
      read: false,
      type: "TRADE_ACCEPTED",
      relatedId: chatRoomId,
    };
    setNotifications((prev) => [buyerNotif, ...prev]);

    // Mark trade request notification as read for seller
    setNotifications((prev) =>
      prev.map((n) =>
        n.relatedId === requestId && n.type === "TRADE_REQUEST"
          ? { ...n, read: true }
          : n
      )
    );
  };

  const rejectTradeRequest = (requestId: string) => {
    isWritingRef.current = true;
    setTradeRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "REJECTED" } : r))
    );

    const req = tradeRequests.find((r) => r.id === requestId);
    if (!req) return;

    // Restore item status to ON_SALE and clear reservation
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === req.itemId
          ? {
              ...item,
              status: "ON_SALE" as const,
              reservedBuyerId: undefined,
              reservedBuyerName: undefined,
              selectedTimeSlot: undefined,
            }
          : item
      )
    );

    // Trigger notification to buyer
    const buyerNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: req.buyerId,
      text: `아쉽게도 판매자가 거래를 거절했습니다.`,
      time: new Date().toISOString(),
      read: false,
      type: "TRADE_REJECTED",
    };
    setNotifications((prev) => [buyerNotif, ...prev]);

    // Mark request notification as read
    setNotifications((prev) =>
      prev.map((n) =>
        n.relatedId === requestId && n.type === "TRADE_REQUEST"
          ? { ...n, read: true }
          : n
      )
    );
  };



  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n))
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        items,
        chatRooms,
        users,
        tradeRequests,
        notifications,
        login,
        signup,
        logout,
        createItem,
        updateItemStatus,
        getOrCreateChatRoom,
        sendMessage,
        proposeReservation,
        acceptReservation,
        rejectReservation,
        completeTrade,
        submitReview,
        toggleLikeItem,
        incrementItemViews,
        createTradeRequest,
        acceptTradeRequest,
        rejectTradeRequest,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        openLoginPopup,
        isInitialized,
        deleteItem,
        updateItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
