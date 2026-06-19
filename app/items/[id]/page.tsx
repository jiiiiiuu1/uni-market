"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import {
  MapPin,
  Calendar,
  MessageSquare,
  ArrowLeft,
  Thermometer,
  User,
  ShieldCheck,
  ShoppingBag,
  Heart,
  ChevronLeft,
  ChevronRight,
  Eye,
  Tag,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const DAYS_FULL = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
const SLOTS = [
  { label: "오전", time: "09:00-12:00", value: "오전(9-12시)" },
  { label: "점심", time: "12:00-14:00", value: "점심(12-2시)" },
  { label: "오후", time: "14:00-18:00", value: "오후(2-6시)" },
  { label: "저녁", time: "18:00-21:00", value: "저녁(6-9시)" },
];

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    items,
    currentUser,
    getOrCreateChatRoom,
    updateItemStatus,
    toggleLikeItem,
    incrementItemViews,
    createTradeRequest,
    openLoginPopup,
    tradeRequests,
    acceptTradeRequest,
    rejectTradeRequest,
    chatRooms,
    completeTrade,
    deleteItem
  } = useApp();

  const itemId = params.id as string;

  const item = useMemo(() => {
    return items.find((i) => i.id === itemId);
  }, [items, itemId]);

  // Image Showcase state
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Trade Request Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Find corresponding TradeRequest for RESERVED state
  const activeRequest = useMemo(() => {
    if (!item || item.status !== "RESERVED") return null;
    return tradeRequests.find(
      (r) => r.itemId === item.id && (r.status === "PENDING" || r.status === "ACCEPTED")
    );
  }, [item, tradeRequests]);

  // Set default modal parameters on load or items change
  useEffect(() => {
    if (item) {
      const locs = item.location.split(",");
      if (locs.length > 0) setSelectedLocation(locs[0].trim());
      if (item.timeSlots && item.timeSlots.length > 0) {
        setSelectedTimeSlot(item.timeSlots[0]);
      }
    }
  }, [item]);

  // Increment view count exactly once on mount
  const viewsIncremented = useRef(false);
  useEffect(() => {
    if (item && !viewsIncremented.current) {
      incrementItemViews(item.id);
      viewsIncremented.current = true;
    }
  }, [itemId, item, incrementItemViews]);

  // Reset active image when item changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [itemId]);

  // Recommendations: Items from the same category or overall latest (excluding current)
  const recommendations = useMemo(() => {
    if (!item) return [];
    const matched = items.filter((i) => i.category === item.category && i.id !== item.id);
    if (matched.length >= 4) return matched.slice(0, 4);
    // Fill up with latest items
    const rest = items.filter((i) => i.category !== item.category && i.id !== item.id);
    return [...matched, ...rest].slice(0, 4);
  }, [items, item?.category, item?.id]);

  if (!item) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
          <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-slate-650 mb-4 animate-bounce" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">찾으시는 물건 정보를 불러올 수 없습니다</h2>
          <p className="text-sm text-slate-550 mt-2">삭제되었거나 없는 아이디입니다.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 py-2.5 px-5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            홈으로 이동
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const isSeller = currentUser?.id === item.sellerId;
  const isBuyer = currentUser?.id === item.reservedBuyerId;
  const isReserved = item.status === "RESERVED";
  const isCompleted = item.status === "COMPLETED";
  const isAccessBlocked = (isReserved || isCompleted) && !isSeller && !isBuyer;

  if (isAccessBlocked) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-16rem)]">
          {isCompleted ? (
            <CheckCircle className="h-16 w-16 text-slate-400 mb-4 animate-bounce" />
          ) : (
            <AlertCircle className="h-16 w-16 text-amber-500 mb-4 animate-pulse" />
          )}
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            {isCompleted ? "거래가 완료된 상품입니다" : "예약 진행 중인 상품입니다"}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {isCompleted
              ? "이미 다른 학우와 거래가 마감되었습니다."
              : "현재 다른 학우가 예약을 선점하여 진행 중입니다."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 py-2.5 px-5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            홈으로 이동
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const isLiked = currentUser?.wishlist?.includes(item.id) || false;
  const formattedPrice = item.price === 0 ? "무료나눔 🎁" : `${(item.price || 0).toLocaleString()}원`;

  // Start chat action
  const handleStartChat = () => {
    if (!currentUser) {
      openLoginPopup();
      return;
    }

    const chatRoomId = getOrCreateChatRoom(item.id);
    if (chatRoomId) {
      router.push(`/chat/${chatRoomId}`);
    }
  };

  // Toggling Wishlist
  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      openLoginPopup();
      return;
    }
    toggleLikeItem(item.id);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const success = createTradeRequest(item.id, selectedLocation, selectedTimeSlot, requestMessage);
    if (success) {
      setShowRequestModal(false);
      setShowSuccessModal(true);
    }
  };

  // Image Navigation
  const prevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + item.images.length) % item.images.length);
  };

  const nextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % item.images.length);
  };

  // Mobile Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      nextImage();
    } else if (diff < -50) {
      prevImage();
    }
    setTouchStart(null);
  };

  // Fuzzy schedule availability matcher
  const isSlotActive = (day: string, slotLabel: string, slotValue: string) => {
    if (!item.timeSlots || item.timeSlots.length === 0) return false;

    // Check if slot conforms to standard selection
    const fullDay = day + "요일";
    return item.timeSlots.some((s) => {
      // Check day matching
      const dayMatch = s.includes(fullDay) || s.startsWith(day);
      if (!dayMatch) return false;

      // Check slot match
      const labelMatch = s.includes(slotLabel) || s.includes(slotValue);
      if (labelMatch) return true;

      // Regex matches time intervals, e.g. "14:00 - 16:00"
      const timeRegex = /(\d{2}):\d{2}/g;
      const times = [...s.matchAll(timeRegex)].map((m) => parseInt(m[1]));
      if (times.length > 0) {
        const hour = times[0];
        if (slotLabel === "오전" && hour >= 9 && hour < 12) return true;
        if (slotLabel === "점심" && hour >= 12 && hour < 14) return true;
        if (slotLabel === "오후" && hour >= 14 && hour < 18) return true;
        if (slotLabel === "저녁" && hour >= 18 && hour < 21) return true;
      }

      // Handle general presets
      if (s.includes("평일") && ["월", "화", "수", "목", "금"].includes(day)) {
        return true;
      }
      if (s.includes("주말") && ["토", "일"].includes(day)) {
        return true;
      }

      return false;
    });
  };

  // Status mapping
  const statusBadge = {
    ON_SALE: { text: "판매중", style: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/50" },
    RESERVED: { text: "예약중", style: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-250 dark:border-amber-900/50" },
    COMPLETED: { text: "거래완료", style: "bg-slate-100 text-slate-655 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-800" },
  }[item.status];

  // Condition mapping
  const conditionBadge = {
    "새 제품": { text: "새 제품", style: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-900/55" },
    "거의 새 것": { text: "거의 새 것", style: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-450 border-blue-200 dark:border-blue-900/55" },
    "사용감 있음": { text: "사용감 있음", style: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-455 border-orange-200 dark:border-orange-900/55" },
    "파손 있음": { text: "파손 있음", style: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/55" },
  }[item.condition as "새 제품" | "거의 새 것" | "사용감 있음" | "파손 있음"] || { text: item.condition || "사용감 있음", style: "bg-slate-50 text-slate-755 border-slate-200" };

  // Temperature color logic
  const getTempColor = (temp: number) => {
    if (temp >= 40) return "text-red-500 bg-red-55 dark:bg-red-955/20 border-red-200 dark:border-red-900/50";
    if (temp >= 37.5) return "text-orange-500 bg-orange-55 dark:bg-orange-955/20 border-orange-200 dark:border-orange-900/55";
    return "text-blue-500 bg-blue-55 dark:bg-blue-955/20 border-blue-200 dark:border-blue-900/50";
  };

  // Format date helper
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full pb-24">
        
        {/* Back Link */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl">
          
          {/* Column 1: Image Gallery Component (Left) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Main Showcase Box */}
            <div
              className="relative aspect-square w-full rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden border border-slate-100 dark:border-slate-855 group select-none cursor-pointer"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.images[activeImageIdx] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60"}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01]"
              />
              
              {/* Overlay Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.style} shadow-sm backdrop-blur-sm`}>
                  {statusBadge.text}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${conditionBadge.style} shadow-sm backdrop-blur-sm`}>
                  {conditionBadge.text}
                </span>
              </div>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 bg-black/45 px-2.5 py-1 rounded-full backdrop-blur-xs">
                {item.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-150 ${
                      activeImageIdx === idx ? "bg-white w-3" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {item.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2.5">
                {item.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-50 dark:bg-slate-900 ${
                      activeImageIdx === idx
                        ? "border-blue-650 scale-[0.98] ring-2 ring-blue-500/20"
                        : "border-slate-100 dark:border-slate-800 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Information & Details (Right) */}
          <div className="lg:col-span-6 flex flex-col h-full justify-between space-y-6">
            
            <div className="space-y-4">
              
              {/* Category / Created Date & Stats line */}
              <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-550">
                <span className="inline-flex items-center gap-1 font-bold text-blue-655 bg-blue-50/50 dark:bg-blue-955/25 px-2 py-0.5 rounded">
                  <Tag className="h-3.5 w-3.5" />
                  {item.category}
                </span>

                <div className="flex items-center gap-2 font-semibold">
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3.5 w-3.5" />
                    조회 {item.views || 0}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3.5 w-3.5" />
                    관심 {item.likes || 0}
                  </span>
                  <span>•</span>
                  <span>{formatTime(item.createdAt)}</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {item.title}
              </h1>

              {/* Price Details */}
              <div className="pb-4 border-b border-slate-150 dark:border-slate-800">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formattedPrice}
                </span>
              </div>

              {/* Description */}
              <div className="py-2">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">상세 물품설명</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                  {item.description}
                </p>
              </div>

              {/* Seller Information Card */}
              <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-slate-150 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-blue-150 dark:bg-blue-900/40 flex items-center justify-center text-blue-650 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40">
                    <User className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{item.sellerName}</span>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                        <ShieldCheck className="h-3 w-3" />
                        학생인증완료
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-505 dark:text-slate-400 font-bold mt-0.5">
                      인천대학교 학생
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Trade Settings Section */}
            <div className="space-y-4 pt-6 border-t border-slate-150 dark:border-slate-800">
              
              {/* Campus Locations list */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <MapPin className="h-4.5 w-4.5 text-slate-400" />
                  <span>거래 희망 장소 (학교 내부 전용)</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {item.location.split(",").map((loc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-750 dark:text-slate-350"
                    >
                      <MapPin className="h-3.5 w-3.5 text-blue-655 dark:text-blue-455" />
                      {loc.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic Timetable Schedule availability view */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <Calendar className="h-4.5 w-4.5 text-slate-400" />
                  <span>거래 조율 가능 시간대</span>
                </div>

                {/* Timetable Table */}
                <div className="overflow-x-auto border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/20">
                  <table className="min-w-full divide-y divide-slate-150 dark:divide-slate-800 text-center text-[10px] font-bold">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500">
                      <tr>
                        <th className="py-2 px-1.5 border-r border-slate-150 dark:border-slate-800 w-12 font-extrabold">구분</th>
                        {DAYS.map((d) => (
                          <th key={d} className="py-2 px-1 border-r border-slate-150 dark:border-slate-800 last:border-r-0">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-[9px]">
                      {SLOTS.map((slot) => (
                        <tr key={slot.label}>
                          <td className="py-2.5 px-1 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-150 dark:border-slate-800 font-extrabold text-slate-600 dark:text-slate-400">
                            {slot.label}
                          </td>
                          {DAYS.map((day) => {
                            const active = isSlotActive(day, slot.label, slot.value);
                            return (
                              <td
                                key={day}
                                className={`py-2.5 px-1 border-r border-slate-150 dark:border-slate-800 last:border-r-0 transition-colors ${
                                  active
                                    ? "bg-blue-600 text-white font-black"
                                    : "bg-slate-50/20 dark:bg-slate-955/10 text-transparent select-none"
                                }`}
                              >
                                {active ? "●" : ""}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Plain Text Description Fallback / Helper */}
                <div className="flex gap-2 p-3 bg-blue-50/20 dark:bg-blue-955/10 border border-blue-100/50 dark:border-blue-900/30 rounded-xl text-[11px] font-semibold text-slate-555 dark:text-slate-400">
                  <Clock className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">상세 시간 목록:</span>
                    <div className="mt-1 flex flex-wrap gap-1 mb-2">
                      {item.timeSlots.map((s, idx) => (
                        <span key={idx} className="bg-blue-50/50 dark:bg-blue-955/30 border border-blue-100 dark:border-blue-900 px-2 py-0.5 rounded text-[10px] text-blue-755 dark:text-blue-400 font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Status and Action Panel */}
              <div className="pt-2">
                {isReserved && activeRequest ? (
                  <div className="bg-blue-50/40 dark:bg-blue-955/20 border border-blue-200 dark:border-blue-900/50 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-400">
                      <Clock className="h-4.5 w-4.5" />
                      <span>
                        {activeRequest.status === "PENDING"
                          ? "⌛ 거래 예약 요청 선점 대기 중"
                          : "🎉 거래 예약 확정"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <p>📍 장소: <strong className="text-slate-900 dark:text-white">{activeRequest.selectedLocation}</strong></p>
                      <p>📆 시간: <strong className="text-slate-900 dark:text-white">{activeRequest.selectedTimeSlot}</strong></p>
                      {activeRequest.message && (
                        <p className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2 mt-2">
                          ✉️ 메모: <span className="italic font-normal">"{activeRequest.message}"</span>
                        </p>
                      )}
                    </div>



                    {isSeller ? (
                      <div className="space-y-2 border-t border-blue-100/50 dark:border-blue-900/30 pt-3">
                        {activeRequest.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => rejectTradeRequest(activeRequest.id)}
                              className="flex-1 py-2.5 border border-red-200 bg-white hover:bg-red-55 text-red-650 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                            >
                              거절하기
                            </button>
                            <button
                              type="button"
                              onClick={() => acceptTradeRequest(activeRequest.id)}
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer text-center"
                            >
                              예약 수락하기
                            </button>
                          </div>
                        ) : (
                          // Accepted case for seller
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-500 font-bold mb-2">약속 장소와 시간대로 직거래를 완료하셨다면 아래 완료 버튼을 눌러주세요.</p>
                            <div className="flex gap-2">
                              {chatRooms.find(c => c.itemId === item.id && c.buyerId === item.reservedBuyerId) && (
                                <Link
                                  href={`/chat/${chatRooms.find(c => c.itemId === item.id && c.buyerId === item.reservedBuyerId)?.id}`}
                                  className="flex-1 py-2.5 border border-blue-200 bg-white hover:bg-blue-50 text-blue-650 rounded-xl text-xs font-bold transition-colors text-center flex items-center justify-center gap-1"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  비상 채팅방 가기
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => completeTrade(item.id)}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                              >
                                🤝 직거래 완료 완료
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : isBuyer ? (
                      <div className="border-t border-blue-100/50 dark:border-blue-900/30 pt-3">
                        {activeRequest.status === "PENDING" ? (
                          <p className="text-center text-xs font-bold text-slate-500">
                            판매자의 예약을 수락 또는 거절 응답을 대기 중입니다...
                          </p>
                        ) : (
                          // Accepted case for buyer
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-500 font-bold mb-2">거래가 확정되었습니다! 약속 당일 연락이 필요한 경우 아래 비상 채팅을 이용하세요.</p>
                            {chatRooms.find(c => c.itemId === item.id && c.buyerId === item.reservedBuyerId) && (
                              <Link
                                href={`/chat/${chatRooms.find(c => c.itemId === item.id && c.buyerId === item.reservedBuyerId)?.id}`}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-xs font-bold shadow-md transition-colors text-center flex items-center justify-center gap-1"
                              >
                                <MessageSquare className="h-4 w-4" />
                                💬 비상 연락용 채팅방 바로가기
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  // Normal item states: ON_SALE or COMPLETED
                  <div>
                    {item.status === "COMPLETED" ? (
                      <div className="w-full text-center py-3.5 bg-slate-100 text-slate-550 rounded-xl text-xs font-bold border border-slate-200 dark:bg-slate-800/50 dark:border-slate-855 dark:text-slate-450">
                        🤝 이미 판매가 완료된 상품입니다
                      </div>
                    ) : (
                      // ON_SALE state
                      <div className="flex gap-2">
                        {isSeller ? (
                          <div className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-xl p-3.5">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 text-center mb-2.5">내 판매 물품 상태 변경하기</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                key="ON_SALE"
                                onClick={() => updateItemStatus(item.id, "ON_SALE")}
                                className={`py-2 border text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                                  item.status === "ON_SALE"
                                    ? "border-blue-500 text-emerald-700 bg-emerald-50/50 ring-2 ring-blue-500/30"
                                    : "border-slate-200 text-slate-500 bg-transparent dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50/50"
                                }`}
                              >
                                판매중
                              </button>
                              <button
                                key="COMPLETED"
                                onClick={() => completeTrade(item.id)}
                                className="py-2 border text-[11px] font-bold rounded-lg border-slate-200 text-slate-500 bg-transparent dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50/50"
                              >
                                거래완료
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                              <button
                                onClick={() => router.push(`/items/edit/${item.id}`)}
                                className="py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                              >
                                수정하기
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("정말 이 상품을 삭제하시겠습니까?")) {
                                    deleteItem(item.id);
                                    alert("삭제되었습니다.");
                                    router.push("/");
                                  }
                                }}
                                className="py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/15 dark:hover:bg-rose-900/30 text-rose-655 dark:text-rose-455 border border-rose-200 dark:border-rose-900/50 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                              >
                                삭제하기
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* 찜하기 button */}
                            <button
                              onClick={handleToggleLike}
                              className={`flex items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isLiked
                                  ? "bg-red-55 border-red-200 text-red-500 dark:bg-red-950/20 dark:border-red-900/60"
                                  : "bg-white border-slate-200 text-slate-455 hover:text-slate-750 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500 dark:hover:text-slate-300"
                              }`}
                              title="찜하기"
                            >
                              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                            </button>

                            {/* 예약 신청하기 button */}
                            <button
                              onClick={() => {
                                if (!currentUser) {
                                  openLoginPopup();
                                  return;
                                }
                                setShowRequestModal(true);
                              }}
                              className="flex-1 flex justify-center items-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-sm font-bold shadow-md transition-colors cursor-pointer"
                            >
                              <MessageSquare className="h-4.5 w-4.5" />
                              예약 신청하기
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* 관련 추천 물품 섹션 */}
        <section className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5">
              <ShoppingBag className="h-4.5 w-4.5 text-blue-600" />
              추천 관련 상품
            </h2>
            <Link
              href="/"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              전체 상품보기
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.filter(Boolean).map((rec) => {
              const recPrice = rec.price === 0 ? "무료나눔 🎁" : `${(rec.price || 0).toLocaleString()}원`;
              return (
                <Link
                  key={rec.id}
                  href={`/items/${rec.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full group"
                >
                  <div className="aspect-square bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rec.images[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60"}
                      alt={rec.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold bg-white/95 text-slate-800 shadow-sm border border-slate-200`}>
                        {rec.condition}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400">{rec.category}</span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {rec.title}
                      </h4>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100/70 dark:border-slate-855 flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-950 dark:text-white">
                        {recPrice}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {rec.location.split(",")[0].trim()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* TRADE REQUEST MODAL */}
        {/* ======================================================== */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-extrabold text-slate-850 dark:text-slate-100 flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-5 w-5 text-blue-655" />
                  거래 신청서 작성
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">판매자가 제시한 가능 일정과 장소 중 하나를 선택하세요.</p>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4 pt-2">
                {/* Location select */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-loc" className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    거래 희망 장소 *
                  </label>
                  <select
                    id="modal-loc"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="block w-full border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-855 py-2.5 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {item.location.split(",").map((loc) => (
                      <option key={loc} value={loc.trim()}>
                        {loc.trim()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time select */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-time" className="block text-[11px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    거래 희망 시간대 *
                  </label>
                  <select
                    id="modal-time"
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="block w-full border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-855 py-2.5 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {item.timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="modal-msg" className="block text-[11px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                      판매자에게 전달할 메모 (선택)
                    </label>
                    <span className="text-[9px] font-bold text-slate-450">{(requestMessage || "").length}/200자</span>
                  </div>
                  <textarea
                    id="modal-msg"
                    rows={3}
                    maxLength={200}
                    placeholder="예: 시간 맞추겠습니다! 장소 앞에서 뵐게요."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="block w-full border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-855 py-2.5 px-3 rounded-xl text-xs placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                {/* Actions panel */}
                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-750 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-xs font-extrabold shadow-md transition-colors cursor-pointer"
                  >
                    이 조건으로 거래 요청
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUCCESS CONFIRMATION MODAL */}
        {/* ======================================================== */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border border-emerald-250 dark:border-emerald-900/50">
                <CheckCircle className="h-6 w-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">거래 신청이 완료되었습니다!</h3>
                <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-semibold">
                  판매자 <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{item.sellerName}</strong> 학우님께 거래 신청 알림이 전달되었습니다.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-150 dark:border-slate-800">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
