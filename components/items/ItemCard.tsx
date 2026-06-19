import React from "react";
import Link from "next/link";
import { Item } from "@/lib/types";
import { MapPin, Clock, Tag } from "lucide-react";
import { useApp } from "@/lib/AppContext";

export default function ItemCard({ item, variant = "vertical" }: { item: Item; variant?: "vertical" | "horizontal" }) {
  const { currentUser, isInitialized } = useApp();

  // Price formatting
  const formattedPrice = item?.price === 0 ? "무료나눔 🎁" : `${(item?.price || 0).toLocaleString()}원`;

  // Status Badge configurations
  const statusBadge = {
    ON_SALE: {
      text: "판매중",
      style: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    },
    RESERVED: {
      text: "예약중",
      style: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    },
    COMPLETED: {
      text: "거래완료",
      style: "bg-slate-100 text-slate-650 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    },
  }[item.status];

  // Date formatting (relative)
  const getRelativeTime = (isoString: string) => {
    const now = new Date();
    const date = new Date(isoString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  const isSeller = currentUser && item.sellerId === currentUser.id;
  const isClickRestricted = isInitialized && (item.status === "RESERVED" || item.status === "COMPLETED") && !isSeller;

  const handleClick = (e: React.MouseEvent) => {
    if (isClickRestricted) {
      if (item.status === "RESERVED") {
        e.preventDefault();
        e.stopPropagation();
        alert("이미 다른 학우가 예약 진행 중인 물품입니다.");
      } else if (item.status === "COMPLETED") {
        e.preventDefault();
        e.stopPropagation();
        alert("거래가 완료된 물품입니다.");
      }
    }
  };

  if (variant === "horizontal") {
    return (
      <Link href={`/items/${item.id}`} className="group w-full block" onClick={handleClick}>
        <div className={`flex flex-row h-[180px] w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm transition-all duration-300 overflow-hidden ${
          isClickRestricted
            ? "opacity-60 cursor-not-allowed"
            : "hover:-translate-y-0.5 hover:shadow-md"
        }`}>
          {/* Item Image Container */}
          <div className="relative w-[180px] h-full bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.images[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60"}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {item.status !== "ON_SALE" && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${statusBadge.style} shadow-sm`}>
                  {statusBadge.text}
                </span>
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="flex flex-col flex-1 p-5 justify-between min-w-0">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                <Tag className="h-3 w-3 text-slate-400" />
                <span>{item.category}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                {item.title}
              </h3>

              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-slate-950 dark:text-white">
                  {formattedPrice}
                </span>
              </div>
            </div>

            {/* Location and Info */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0 max-w-[60%]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{item.location}</span>
              </div>
              
              <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                <span>{item.sellerName}</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{getRelativeTime(item.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/items/${item.id}`} className="group" onClick={handleClick}>
      <div className={`flex flex-col h-[380px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm transition-all duration-300 overflow-hidden ${
        isClickRestricted
          ? "opacity-60 cursor-not-allowed"
          : "hover:-translate-y-1 hover:shadow-md"
      }`}>
        {/* Item Image Container */}
        <div className="relative h-[200px] w-full bg-slate-100 dark:bg-slate-955 overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.images[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60"}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {item.status !== "ON_SALE" && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusBadge.style} shadow-sm`}>
                {statusBadge.text}
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="flex flex-col flex-1 p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            <Tag className="h-3 w-3 text-slate-400" />
            <span>{item.category}</span>
          </div>

          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-955 dark:text-white">
              {formattedPrice}
            </span>
          </div>

          {/* Location and Info */}
          <div className="mt-auto pt-4 space-y-2 border-t border-slate-100 dark:border-slate-850">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{item.location}</span>
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>{item.sellerName}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{getRelativeTime(item.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
