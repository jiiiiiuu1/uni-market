export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  department: string; // e.g. "정보기술대학 컴퓨터공학부"
  mannerTemp: number; // e.g. 36.5
  completedTradesCount: number;
  reviews: Review[];
  wishlist: string[]; // item ids that user liked
  avatarUrl?: string;
}

export interface Review {
  id: string;
  itemId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1 to 5
  badges: string[]; // e.g. "시간을 잘 지켜요", "친절해요", "물건 상태가 좋아요"
  comment: string;
  createdAt: string;
}

export type ItemStatus = "ON_SALE" | "RESERVED" | "COMPLETED";

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number; // 0 for free share
  category: string;
  condition: string; // e.g. "새 제품", "거의 새 것", "사용감 있음", "파손 있음"
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerMannerTemp: number;
  sellerDept?: string; // e.g. "정보기술대학 컴퓨터공학부"
  status: ItemStatus;
  location: string; // campus building
  timeSlots: string[]; // seller's suggested time slots
  reservedBuyerId?: string;
  reservedBuyerName?: string;
  selectedTimeSlot?: string;
  createdAt: string;
  views: number;
  likes: number;
  likedBy: string[]; // list of user ids who liked this
}

export type MessageType = "TEXT" | "SYSTEM" | "RESERVATION_PROPOSAL";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: MessageType;
  proposedTimeSlot?: string; // used for reservation proposals
}

export type ChatReservationStatus = "NONE" | "PROPOSED" | "ACCEPTED" | "REJECTED";

export interface ChatRoom {
  id: string;
  itemId: string;
  itemTitle: string;
  itemPrice: number;
  itemImage: string;
  itemStatus: ItemStatus;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  messages: Message[];
  reservationStatus: ChatReservationStatus;
  proposedTimeSlot?: string;
  lastMessageText?: string;
  lastMessageTime?: string;
}

export type TradeRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface TradeRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  itemPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  selectedLocation: string;
  selectedTimeSlot: string;
  message?: string;
  status: TradeRequestStatus;
  expiresAt?: string;
  createdAt: string;
}

export type NotificationType = "TRADE_REQUEST" | "TRADE_ACCEPTED" | "TRADE_REJECTED" | "GENERAL";

export interface AppNotification {
  id: string;
  userId: string; // target user ID
  text: string;
  time: string;
  read: boolean;
  type: NotificationType;
  relatedId?: string; // e.g. requestId or chatRoomId
}
