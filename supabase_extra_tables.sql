-- ========================================================
-- UNI MARKET EXTRA TABLES FOR SUPABASE DATA PERSISTENCE
-- ========================================================
-- Run this script in your Supabase project SQL Editor.

-- 1. Create items table
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER DEFAULT 0,
  category TEXT,
  condition TEXT,
  images TEXT[] DEFAULT '{}',
  "sellerId" TEXT NOT NULL,
  "sellerName" TEXT,
  "sellerMannerTemp" NUMERIC,
  "sellerDept" TEXT,
  status TEXT DEFAULT 'ON_SALE',
  location TEXT,
  "timeSlots" TEXT[] DEFAULT '{}',
  "reservedBuyerId" TEXT,
  "reservedBuyerName" TEXT,
  "selectedTimeSlot" TEXT,
  "createdAt" TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  "likedBy" TEXT[] DEFAULT '{}'
);

-- 2. Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "itemTitle" TEXT,
  "itemPrice" INTEGER DEFAULT 0,
  "itemImage" TEXT,
  "itemStatus" TEXT,
  "buyerId" TEXT NOT NULL,
  "buyerName" TEXT,
  "sellerId" TEXT NOT NULL,
  "sellerName" TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  "reservationStatus" TEXT DEFAULT 'NONE',
  "proposedTimeSlot" TEXT,
  "lastMessageText" TEXT,
  "lastMessageTime" TEXT
);

-- 3. Create trade_requests table
CREATE TABLE IF NOT EXISTS public.trade_requests (
  id TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "itemTitle" TEXT,
  "itemImage" TEXT,
  "itemPrice" INTEGER DEFAULT 0,
  "buyerId" TEXT NOT NULL,
  "buyerName" TEXT,
  "sellerId" TEXT NOT NULL,
  "sellerName" TEXT,
  "selectedLocation" TEXT,
  "selectedTimeSlot" TEXT,
  message TEXT,
  status TEXT DEFAULT 'PENDING',
  "expiresAt" TEXT,
  "createdAt" TEXT NOT NULL
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  text TEXT,
  time TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  type TEXT,
  "relatedId" TEXT
);

-- 5. Extend public.users table to support reviews JSONB arrays
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb;

-- 6. Disable Row Level Security (RLS) on these tables to allow anonymous sync
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
