"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import {
  ArrowLeft,
  Send,
  Calendar,
  MapPin,
  Clock,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Award,
  User
} from "lucide-react";
import Link from "next/link";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const {
    chatRooms,
    currentUser,
    items,
    sendMessage,
    proposeReservation,
    acceptReservation,
    rejectReservation,
    completeTrade,
    isInitialized
  } = useApp();

  const chatRoomId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form input state
  const [typedMessage, setTypedMessage] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  const chatRoom = useMemo(() => {
    return chatRooms.find((c) => c.id === chatRoomId);
  }, [chatRooms, chatRoomId]);

  const item = useMemo(() => {
    if (!chatRoom) return null;
    return items.find((i) => i.id === chatRoom.itemId);
  }, [items, chatRoom]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push("/auth/login");
    }
  }, [isInitialized, currentUser, router]);

  // Set default selected time slot once item is loaded
  useEffect(() => {
    if (item && item.timeSlots.length > 0) {
      setSelectedTimeSlot(item.timeSlots[0]);
    }
  }, [item]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatRoom?.messages]);

  if (!isInitialized) {
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

  if (!currentUser || !chatRoom || !item) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
          <AlertCircle className="h-16 w-16 text-slate-350 mb-4" />
          <h2 className="text-xl font-bold text-slate-800">채팅방을 찾을 수 없습니다</h2>
          <button
            onClick={() => router.push("/reservations")}
            className="mt-6 py-2.5 px-5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            거래 예약 목록으로 이동
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const isBuyer = chatRoom.buyerId === currentUser.id;
  const isSeller = chatRoom.sellerId === currentUser.id;
  const otherPersonName = isBuyer ? chatRoom.sellerName : chatRoom.buyerName;

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    sendMessage(chatRoomId, typedMessage.trim());
    setTypedMessage("");
  };

  const handlePropose = () => {
    if (!selectedTimeSlot) return;
    proposeReservation(chatRoomId, selectedTimeSlot);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-[calc(100vh-16rem)]">
        
        {/* Header toolbar */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => router.push("/reservations")}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
              {otherPersonName}님과의 대화
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              인증된 인천대 학생 직거래 채널
            </p>
          </div>
        </div>

        {/* Item mini profile bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm mt-4">
          <Link href={`/items/${item.id}`} className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.images[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60"}
              alt=""
              className="h-11 w-11 rounded-lg object-cover bg-slate-50 dark:bg-slate-950 border shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.title}</h3>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                {item.price === 0 ? "무료나눔" : `${(item.price || 0).toLocaleString()}원`}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {item.location}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE APPOINTMENT SCHEDULING WIDGET */}
        {/* ======================================================== */}
        <div className="mt-4 p-4 rounded-2xl border bg-slate-50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-250 uppercase mb-3">
            <Calendar className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            <span>캠퍼스 직거래 예약 상태 판넬</span>
          </div>

          {item.status === "COMPLETED" ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl text-center space-y-3">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                🎉 직거래가 정상 완료되었습니다! 
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-500 leading-normal">
                학우님과의 따뜻한 거래 후기를 남겨주세요.
              </p>
              <Link
                href={`/profile`}
                className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                ✍️ 후기 작성하러 마이페이지 가기
              </Link>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-4 rounded-xl space-y-4">
              <div className="flex gap-2">
                <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400">
                    거래 예약 확정! 약속이 확정되었습니다
                  </h4>
                  <div className="mt-2 space-y-1 text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                    <p>⏰ 시간: <span className="text-blue-700 dark:text-blue-300 font-bold">{chatRoom.proposedTimeSlot}</span></p>
                    <p>📍 장소: <span className="text-blue-700 dark:text-blue-300 font-bold">{item.location}</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 font-bold leading-relaxed flex gap-1.5 items-start">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                <span>🚨 이 채팅방은 약속 당일 현장 만남을 위한 비상 연락망(예: &quot;지금 도착했습니다&quot;, &quot;5분 늦습니다&quot; 등)으로만 최소한으로 사용해 주세요.</span>
              </div>

              {isSeller && (
                <div className="flex justify-end pt-1 border-t border-blue-100/50 dark:border-blue-900/40">
                  <button
                    onClick={() => completeTrade(item.id)}
                    className="flex items-center gap-1.5 py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
                  >
                    🤝 직거래 완료 완료 확인
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MESSAGES LOG CONTAINER */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl mt-4 overflow-hidden h-[400px]">
          
          {/* Scrollable feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatRoom.messages.map((msg) => {
              if (msg.type === "SYSTEM") {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/55 dark:border-slate-800 px-4 py-2.5 rounded-2xl max-w-md text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const isMe = msg.senderId === currentUser.id;

              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-2.5 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* User profile bubble if incoming */}
                    {!isMe && (
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <User className="h-4.5 w-4.5" />
                      </div>
                    )}

                    <div className="space-y-0.5">
                      {!isMe && (
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-550 ml-1">
                          {msg.senderName}
                        </div>
                      )}

                      <div className="flex items-end gap-1.5">
                        <div
                          className={`p-3 rounded-2xl text-xs font-medium whitespace-pre-wrap ${
                            isMe
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-slate-550 mb-1 shrink-0 font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing entry box */}
          {item.status !== "COMPLETED" && (
            <form onSubmit={handleSendText} className="flex gap-2 p-3 border-t border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20">
              <input
                type="text"
                placeholder="메세지를 입력하세요..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="flex-1 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-4 rounded-xl text-xs placeholder-slate-400 focus:outline-none text-slate-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim()}
                className="bg-blue-650 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
