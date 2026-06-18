"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Calendar, MapPin, Clock, ArrowRight, User, ShoppingBag, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ReservationsPage() {
  const { 
    items, 
    currentUser, 
    chatRooms, 
    completeTrade, 
    isInitialized, 
    tradeRequests, 
    acceptTradeRequest, 
    rejectTradeRequest 
  } = useApp();
  const router = useRouter();

  // Filter items I am selling that have reservations
  const sellingReservations = useMemo(() => {
    if (!currentUser) return [];
    return items.filter(
      (item) => item.sellerId === currentUser.id && (item.status === "RESERVED" || item.status === "COMPLETED")
    );
  }, [items, currentUser]);

  // Filter items I am buying (reservedBuyerId matches me)
  const buyingReservations = useMemo(() => {
    if (!currentUser) return [];
    return items.filter(
      (item) => item.reservedBuyerId === currentUser.id && (item.status === "RESERVED" || item.status === "COMPLETED")
    );
  }, [items, currentUser]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push("/auth/login");
    }
  }, [isInitialized, currentUser, router]);

  if (!isInitialized || !currentUser) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex items-center justify-center min-h-[300px]">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  const renderReservationCard = (item: any, type: "selling" | "buying") => {
    const isCompleted = item.status === "COMPLETED";
    const otherParty = type === "selling" ? item.reservedBuyerName : item.sellerName;
    const priceText = item.price === 0 ? "무료나눔 🎁" : `${(item.price || 0).toLocaleString()}원`;
    const chatRoom = chatRooms.find(
      (c) => c.itemId === item.id && c.buyerId === (type === "selling" ? item.reservedBuyerId : currentUser.id)
    );
    const associatedPendingRequest = tradeRequests.find(
      (r) => r.itemId === item.id && r.buyerId === item.reservedBuyerId && r.status === "PENDING"
    );

    return (
      <div
        key={item.id}
        className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between"
      >
        {/* Ticket punch hole left */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/50 z-10" />
        {/* Ticket punch hole right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800/50 z-10" />

        {/* Top stub */}
        <div className="p-5 pb-4 space-y-4">
          <div className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">UNI MARKET TICKET</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border uppercase ${
              isCompleted
                ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                : associatedPendingRequest
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
            }`}>
              {isCompleted ? "거래완료" : associatedPendingRequest ? "예약대기" : "예약확정"}
            </span>
          </div>

          <div className="flex gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.images[0]}
              alt=""
              className="h-16 w-16 rounded-xl object-cover border dark:border-slate-800 shadow-sm shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-black text-slate-850 dark:text-slate-100 line-clamp-1 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {priceText}
              </p>
              <p className="text-[9px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{type === "selling" ? `구매자: ${otherParty} 학우` : `판매자: ${otherParty} 학우`}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Dashed line dividing ticket stubs */}
        <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-850 px-6" />

        {/* Bottom stub */}
        <div className="p-5 pt-4 space-y-4 flex-1 flex flex-col justify-between">
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl text-[10px] font-bold text-slate-700 dark:text-slate-355 space-y-1.5 shadow-inner">
            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-655" /> <span>장소: {item.location}</span></p>
            <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-655" /> <span>시간: {item.selectedTimeSlot}</span></p>
          </div>

          {!isCompleted && (
            /* Barcode Graphic */
            <div className="flex flex-col items-center justify-center space-y-1.5 select-none opacity-80 dark:opacity-60 my-2">
              <div className="flex items-center justify-center gap-0.5 h-8">
                <div className="w-0.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-1.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-0.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-1 h-full bg-slate-900 dark:bg-white" />
                <div className="w-0.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-2 h-full bg-slate-900 dark:bg-white" />
                <div className="w-0.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-1 h-full bg-slate-900 dark:bg-white" />
                <div className="w-1.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-0.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-1 h-full bg-slate-900 dark:bg-white" />
                <div className="w-2 h-full bg-slate-900 dark:bg-white" />
                <div className="w-0.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-1.5 h-full bg-slate-900 dark:bg-white" />
                <div className="w-0.5 h-full bg-slate-900 dark:bg-white" />
              </div>
              <span className="text-[8px] font-mono text-slate-400 tracking-widest">TKT-{item.id.toUpperCase()}</span>
            </div>
          )}

          <div className="flex gap-2">
            {!isCompleted && chatRoom && (
              <Link
                href={`/chat/${chatRoom.id}`}
                className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-655 rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 border border-blue-200"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                💬 비상 채팅
              </Link>
            )}
            {!isCompleted && type === "selling" && (
              <>
                {associatedPendingRequest ? (
                  <>
                    <button
                      onClick={() => acceptTradeRequest(associatedPendingRequest.id)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-[10px] font-bold shadow-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      거래수락
                    </button>
                    <button
                      onClick={() => rejectTradeRequest(associatedPendingRequest.id)}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-755 text-white rounded-xl text-[10px] font-bold shadow-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      거절
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => completeTrade(item.id)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    🤝 직거래 완료
                  </button>
                )}
              </>
            )}
            <Link
              href={`/items/${item.id}`}
              className="flex-1 py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 rounded-xl text-[10px] font-bold transition-colors text-center flex items-center justify-center gap-1 border border-slate-200/50"
            >
              상세 정보
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="space-y-4 mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            내 거래 예약 스케줄
          </h1>
          <p className="text-xs text-slate-550">
            캠퍼스 내에서 만나기로 약속된 직거래 예약 현황 및 내역입니다.
          </p>
        </div>

        <div className="space-y-8">
          {/* Buying Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              내가 구매하기로 예약한 물건 ({buyingReservations.length})
            </h2>
            
            {buyingReservations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {buyingReservations.map((item) => renderReservationCard(item, "buying"))}
              </div>
            ) : (
              <div className="py-10 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400 font-semibold">
                구매 예약 중인 내역이 없습니다.
              </div>
            )}
          </div>

          {/* Selling Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              내가 판매하기로 예약한 물품 ({sellingReservations.length})
            </h2>

            {sellingReservations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sellingReservations.map((item) => renderReservationCard(item, "selling"))}
              </div>
            ) : (
              <div className="py-10 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400 font-semibold">
                판매 예약 중인 내역이 없습니다.
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
