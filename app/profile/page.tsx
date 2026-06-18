"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import {
  User,
  ShieldCheck,
  Thermometer,
  Grid,
  CheckCircle,
  MessageSquare,
  Award,
  Star,
  ArrowRight,
  Clock,
  ThumbsUp,
  MapPin
} from "lucide-react";
import Link from "next/link";
import ItemCard from "@/components/items/ItemCard";

export default function ProfilePage() {
  const {
    items,
    currentUser,
    users,
    tradeRequests,
    acceptTradeRequest,
    rejectTradeRequest,
    chatRooms,
    completeTrade,
    isInitialized
  } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"listings" | "completed" | "reviews" | "wishlist" | "reservations">("listings");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push("/auth/login");
    }
  }, [isInitialized, currentUser, router]);

  // Retrieve user details from global state users array (to get live updated mannerTemp/reviews)
  const userProfile = useMemo(() => {
    if (!currentUser) return null;
    return users.find((u) => u.id === currentUser.id) || currentUser;
  }, [users, currentUser]);

  // Filter listings
  const activeListings = useMemo(() => {
    if (!userProfile) return [];
    return items.filter((item) => item.sellerId === userProfile.id && item.status !== "COMPLETED");
  }, [items, userProfile]);

  const completedListings = useMemo(() => {
    if (!userProfile) return [];
    return items.filter(
      (item) =>
        (item.sellerId === userProfile.id || item.reservedBuyerId === userProfile.id) &&
        item.status === "COMPLETED"
    );
  }, [items, userProfile]);

  const wishlistedItems = useMemo(() => {
    if (!userProfile) return [];
    return items.filter((item) => userProfile.wishlist?.includes(item.id));
  }, [items, userProfile]);

  const receivedRequests = useMemo(() => {
    if (!userProfile) return [];
    return tradeRequests.filter((r) => r.sellerId === userProfile.id);
  }, [tradeRequests, userProfile]);

  const sentRequests = useMemo(() => {
    if (!userProfile) return [];
    return tradeRequests.filter((r) => r.buyerId === userProfile.id);
  }, [tradeRequests, userProfile]);



  if (!isInitialized || !userProfile) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex items-center justify-center min-h-[300px]">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  // Helper to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 shrink-0 ${
            i <= floor
              ? "text-amber-400 fill-amber-400"
              : i - rating < 1 && i - rating > 0
              ? "text-amber-450 fill-amber-450 opacity-60"
              : "text-slate-200"
          }`}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        
        {/* Profile Stats Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* User credentials */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center border border-blue-150">
                <User className="h-8 w-8 stroke-[1.8]" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {userProfile.nickname}
                  </h1>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400">
                    <ShieldCheck className="h-3 w-3" />
                    인증된 이메일 계정
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">{userProfile.email}</p>
                <p className="text-[10px] text-slate-400 font-bold">인천대학교 Songdo Campus 회원</p>
              </div>
            </div>
          </div>

          {/* Quick counts */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-150 dark:border-slate-800 text-center">
            <div className="p-3 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-slate-100/50">
              <span className="block text-xl font-extrabold text-slate-800 dark:text-slate-200">{activeListings.length}</span>
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-0.5">내 판매중</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-slate-100/50">
              <span className="block text-xl font-extrabold text-slate-800 dark:text-slate-200">{completedListings.length}</span>
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-0.5">완료된 거래</span>
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-850/30 rounded-xl border border-slate-100/50">
              <span className="block text-xl font-extrabold text-blue-650 dark:text-blue-400">{userProfile.completedTradesCount}</span>
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-0.5">거래횟수</span>
            </div>
          </div>
        </div>



        {/* ======================================================== */}
        {/* TAB CONTROLS */}
        {/* ======================================================== */}
        <div className="mt-8 flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {(
            [
              { id: "listings", label: "판매중인 물품", count: activeListings.length },
              { id: "completed", label: "완료된 거래내역", count: completedListings.length },
              { id: "reservations", label: "거래 예약 티켓 🎫", count: items.filter(i => i.status === "RESERVED" && (i.sellerId === userProfile.id || i.reservedBuyerId === userProfile.id)).length },
              { id: "wishlist", label: "찜한 상품", count: wishlistedItems.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="mt-6">
          {activeTab === "listings" && (
            <div>
              {activeListings.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {activeListings.map((item) => (
                    <ItemCard key={item.id} item={item} variant="horizontal" />
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex flex-col justify-center items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl text-center p-8 shadow-sm">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">현재 판매 중인 물건이 없습니다.</p>
                  <Link
                    href="/items/new"
                    className="inline-flex items-center gap-1.5 mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
                  >
                    물품 등록하기
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div>
              {completedListings.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {completedListings.map((item) => (
                    <ItemCard key={item.id} item={item} variant="horizontal" />
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex flex-col justify-center items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl text-center p-8 shadow-sm text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  완료된 거래 내역이 없습니다.
                </div>
              )}
            </div>
          )}

          {activeTab === "reservations" && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-855 pb-2">
                <span>🎫 내 거래 예약 모바일 티켓</span>
              </h3>
              
              {items.filter(i => i.status === "RESERVED" && (i.sellerId === userProfile.id || i.reservedBuyerId === userProfile.id)).length === 0 ? (
                <div className="h-[180px] flex flex-col justify-center items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl text-center p-8 shadow-sm text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  확정된 거래 예약이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.filter(i => i.status === "RESERVED" && (i.sellerId === userProfile.id || i.reservedBuyerId === userProfile.id)).map((reservedItem) => {
                    const isSeller = reservedItem.sellerId === userProfile.id;
                    const partnerName = isSeller ? reservedItem.reservedBuyerName : reservedItem.sellerName;
                    const priceText = reservedItem.price === 0 ? "무료나눔 🎁" : `${reservedItem.price.toLocaleString()}원`;
                    const chatRoom = chatRooms.find(c => c.itemId === reservedItem.id && c.buyerId === reservedItem.reservedBuyerId);
                    const associatedPendingRequest = tradeRequests.find(
                      (r) => r.itemId === reservedItem.id && r.buyerId === reservedItem.reservedBuyerId && r.status === "PENDING"
                    );

                    return (
                      <div
                        key={reservedItem.id}
                        className="relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-955 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between"
                      >
                        {/* Ticket punch hole left */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/50 z-10" />
                        {/* Ticket punch hole right */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800/50 z-10" />

                        {/* Top stub */}
                        <div className="p-5 pb-4 space-y-4">
                          <div className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">UNI MARKET PASS</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border uppercase ${
                                reservedItem.status === "COMPLETED"
                                  ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                  : associatedPendingRequest
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                              }`}>
                                {reservedItem.status === "COMPLETED" ? "거래완료" : associatedPendingRequest ? "예약대기" : "예약확정"}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">BOARDING: {new Date(reservedItem.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex gap-4 items-start">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={reservedItem.images[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60"}
                              alt=""
                              className="h-16 w-16 rounded-xl object-cover border dark:border-slate-800 shadow-sm shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-slate-850 dark:text-slate-105 line-clamp-1 leading-snug">
                                {reservedItem.title}
                              </h4>
                              <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                                {priceText}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{isSeller ? `구매자: ${partnerName} 학우` : `판매자: ${partnerName} 학우`}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Dashed line dividing ticket stubs */}
                        <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-855 px-6" />

                        {/* Bottom stub */}
                        <div className="p-5 pt-4 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 p-3 rounded-2xl text-[10px] font-bold text-slate-700 dark:text-slate-350 space-y-1.5 shadow-inner">
                            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-655" /> <span>장소: {reservedItem.location}</span></p>
                            <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-655" /> <span>시간: {reservedItem.selectedTimeSlot}</span></p>
                          </div>

                          {/* Barcode Graphic */}
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
                            <span className="text-[8px] font-mono text-slate-405 tracking-widest">TKT-{reservedItem.id.toUpperCase()}</span>
                          </div>

                          <div className="flex gap-2">
                            {chatRoom && (
                              <Link
                                href={`/chat/${chatRoom.id}`}
                                className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-655 rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 border border-blue-200"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                💬 비상 채팅
                              </Link>
                            )}
                            {isSeller && (
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
                                      거래거절
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => completeTrade(reservedItem.id)}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                                  >
                                    🤝 직거래 완료
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}



          {activeTab === "wishlist" && (
            <div>
              {wishlistedItems.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {wishlistedItems.map((item) => (
                    <ItemCard key={item.id} item={item} variant="horizontal" />
                  ))}
                </div>
              ) : (
                <div className="h-[180px] flex flex-col justify-center items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl text-center p-8 shadow-sm text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  찜한 상품이 없습니다. 마음에 드는 상품의 하트 버튼을 눌러보세요!
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
