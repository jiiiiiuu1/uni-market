"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import ItemCard from "@/components/items/ItemCard";
import { CATEGORIES } from "@/lib/constants";
import {
  Search,
  Plus,
  SlidersHorizontal,
  MapPin,
  HelpCircle,
  CheckCircle2,
  Laptop,
  BookOpen,
  Sparkles,
  Shirt,
  Package,
  Compass,
  Clock,
  ArrowUpDown,
  DollarSign,
  Gift,
  X
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "전체": Compass,
  "전자기기": Laptop,
  "책/교재": BookOpen,
  "생활용품": Sparkles,
  "의류/잡화": Shirt,
  "무료나눔": Gift,
  "기타": Package,
};

const FILTER_LOCATIONS = [
  "학생회관 1층 카페 앞",
  "중앙도서관 정문",
  "7호관(경영관) 1층 로비",
  "복지관 앞",
  "기숙사(송도관) 앞",
  "학생식당 앞",
  "2호관 앞 광장",
  "기타"
];

const FILTER_TIMES = ["오전", "점심", "오후", "저녁"];

const FILTER_CONDITIONS = ["새 제품", "거의 새 것", "사용감 있음", "파손 있음"];

const matchLocationFilter = (itemLocation: string, selectedLocations: string[]) => {
  if (selectedLocations.length === 0) return true;
  
  return selectedLocations.some((loc) => {
    if (loc === "학생회관 1층 카페 앞") {
      return itemLocation.includes("학생회관") || itemLocation.includes("12호관") || itemLocation.includes("복지회관");
    }
    if (loc === "중앙도서관 정문") {
      return itemLocation.includes("도서관") || itemLocation.includes("14호관") || itemLocation.includes("학술정보원");
    }
    if (loc === "7호관(경영관) 1층 로비") {
      return itemLocation.includes("7호관") || itemLocation.includes("경영관") || itemLocation.includes("11호관");
    }
    if (loc === "복지관 앞") {
      return itemLocation.includes("복지관") || itemLocation.includes("12호관") || itemLocation.includes("복지회관");
    }
    if (loc === "기숙사(송도관) 앞") {
      return itemLocation.includes("기숙사") || itemLocation.includes("송도관") || itemLocation.includes("송도기숙사");
    }
    if (loc === "학생식당 앞") {
      return itemLocation.includes("학생식당") || itemLocation.includes("식당");
    }
    if (loc === "2호관 앞 광장") {
      return itemLocation.includes("2호관");
    }
    if (loc === "기타") {
      const knownKeywords = ["학생회관", "12호관", "복지회관", "도서관", "14호관", "학술정보원", "7호관", "경영관", "11호관", "복지관", "기숙사", "송도관", "송도기숙사", "학생식당", "식당", "2호관"];
      return !knownKeywords.some(keyword => itemLocation.includes(keyword));
    }
    return itemLocation.includes(loc);
  });
};

const matchTimeFilter = (itemSlots: string[], selectedTimes: string[]) => {
  if (selectedTimes.length === 0) return true;
  return selectedTimes.some((time) => {
    return itemSlots.some(slot => slot.includes(time));
  });
};

const matchConditionFilter = (itemCondition: string, selectedConditions: string[]) => {
  if (selectedConditions.length === 0) return true;
  const normalize = (str: string) => (str || "").replace(/\s+/g, "").trim();
  const normalizedItemCond = normalize(itemCondition || "사용감 있음");
  return selectedConditions.some((cond) => normalize(cond) === normalizedItemCond);
};

export default function Home() {
  const { items, currentUser } = useApp();
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ON_SALE" | "RESERVED" | "COMPLETED">("ALL");
  const [maxPrice, setMaxPrice] = useState(500000);
  const [selectedTradeLocations, setSelectedTradeLocations] = useState<string[]>([]);
  const [selectedTradeTimes, setSelectedTradeTimes] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"latest" | "price_low" | "price_high" | "popularity">("latest");

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      // 1. Search term match
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sellerName.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Category match
      const matchCategory =
        selectedCategory === "전체" ||
        item.category === selectedCategory ||
        (selectedCategory === "무료나눔" && item.price === 0);

      // 3. Status match
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ON_SALE" && item.status === "ON_SALE") ||
        (statusFilter === "RESERVED" && item.status === "RESERVED") ||
        (statusFilter === "COMPLETED" && item.status === "COMPLETED");

      // 4. Price slider limit
      const matchPrice = item.price <= maxPrice;

      // 5. Trade location checkboxes
      const matchLocation = matchLocationFilter(item.location, selectedTradeLocations);

      // 6. Trade time checkboxes
      const matchTime = matchTimeFilter(item.timeSlots || [], selectedTradeTimes);

      // 7. Condition checkboxes
      const matchCondition = matchConditionFilter(item.condition, selectedConditions);

      return matchSearch && matchCategory && matchStatus && matchPrice && matchLocation && matchTime && matchCondition;
    });

    // 8. Sorting
    return result.sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "price_low") {
        return a.price - b.price;
      }
      if (sortBy === "price_high") {
        return b.price - a.price;
      }
      if (sortBy === "popularity") {
        const scoreA = (a.views || 0) + (a.likes || 0) * 2;
        const scoreB = (b.views || 0) + (b.likes || 0) * 2;
        return scoreB - scoreA;
      }
      return 0;
    });
  }, [items, searchTerm, selectedCategory, statusFilter, maxPrice, selectedTradeLocations, selectedTradeTimes, selectedConditions, sortBy]);

  // Global reset logic
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("전체");
    setStatusFilter("ALL");
    setMaxPrice(500000);
    setSelectedTradeLocations([]);
    setSelectedTradeTimes([]);
    setSelectedConditions([]);
    setSortBy("latest");
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== "" ||
      selectedCategory !== "전체" ||
      statusFilter !== "ALL" ||
      maxPrice !== 500000 ||
      selectedTradeLocations.length > 0 ||
      selectedTradeTimes.length > 0 ||
      selectedConditions.length > 0
    );
  }, [searchTerm, selectedCategory, statusFilter, maxPrice, selectedTradeLocations, selectedTradeTimes, selectedConditions]);

  // Statistics calculation for dynamic feel
  const stats = useMemo(() => {
    const active = items.filter((i) => i.status === "ON_SALE").length;
    const reserved = items.filter((i) => i.status === "RESERVED").length;
    const completed = items.filter((i) => i.status === "COMPLETED").length;
    return { active, reserved, completed, total: items.length };
  }, [items]);

  return (
    <>
      <Navbar />
      
      {/* Banner / Hero Section with Library Background */}
      <section 
        className="relative bg-cover bg-center text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-900 shadow-inner overflow-hidden bg-slate-950"
        style={{ backgroundImage: "url('/library.png')" }}
      >
        {/* Gradient overlay optimized for text contrast and legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-blue-950/30 z-0" />
        
        <div className="relative mx-auto max-w-7xl z-10">
          <div className="md:flex md:items-center md:justify-between">
            <div className="max-w-xl space-y-4">
              <span className="inline-block bg-blue-500/25 text-blue-200 border border-blue-450/40 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
                인천대학교 전용 안전지대
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
                인천대 학생들의 <br />
                <span className="text-blue-300">안전한 거래 공간</span>, UNI MARKET
              </h1>
              <p className="text-slate-200 text-sm sm:text-base max-w-md leading-relaxed font-medium drop-shadow-sm">
                인천대 학생들만 참여하는 신뢰할 수 있는 <br />캠퍼스 직거래 플랫폼입니다.
              </p>
            </div>
            
            {/* Quick stats panel */}
            <div className="mt-8 md:mt-0 grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 shadow-lg">
              <div className="text-center px-4">
                <span className="block text-2xl font-extrabold text-blue-300 drop-shadow-sm">{stats.active}</span>
                <span className="text-[10px] uppercase font-bold text-slate-300">판매중 물품</span>
              </div>
              <div className="text-center px-4 border-x border-white/15">
                <span className="block text-2xl font-extrabold text-amber-300 drop-shadow-sm">{stats.reserved}</span>
                <span className="text-[10px] uppercase font-bold text-slate-300">예약 중</span>
              </div>
              <div className="text-center px-4">
                <span className="block text-2xl font-extrabold text-emerald-400 drop-shadow-sm">{stats.completed}</span>
                <span className="text-[10px] uppercase font-bold text-slate-300">거래 완료</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Shortcuts Section */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 text-center sm:text-left">빠른 카테고리 메뉴</h2>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 sm:gap-6 justify-center">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Package;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="flex flex-col items-center gap-2 group focus:outline-none cursor-pointer"
                >
                  <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-sm ${
                    isSelected
                      ? "bg-blue-600 border-blue-650 text-white shadow-blue-500/20 scale-95"
                      : "bg-slate-50 border-slate-200/80 text-slate-650 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-450 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}>
                    <Icon className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <span className={`text-[11px] font-bold text-center truncate w-full tracking-tight ${
                    isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-450 group-hover:text-slate-900 dark:group-hover:text-white"
                  }`}>
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          
          {/* Sidebar / Filters Column */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            {/* Listing creation CTA for desktop */}
            {currentUser && (
              <Link
                href="/items/new"
                className="hidden lg:flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-750 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
                새 물품 올리기
              </Link>
            )}

            {/* Filters panel wrapper */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
                <span className="font-extrabold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                  상세 필터링
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* Sort Order select block */}
              <div className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-slate-850">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  정렬 기준
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="block w-full border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-850 dark:text-slate-200"
                >
                  <option value="latest">최신순 📅</option>
                  <option value="price_low">낮은 가격순 💰</option>
                  <option value="price_high">높은 가격순 📈</option>
                  <option value="popularity">인기순 🔥</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-slate-850">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">거래 상태</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { key: "ALL", label: "전체" },
                      { key: "ON_SALE", label: "판매중" },
                      { key: "RESERVED", label: "예약중" },
                      { key: "COMPLETED", label: "완료됨" },
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setStatusFilter(btn.key)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                        statusFilter === btn.key
                          ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                          : "border-slate-200 text-slate-655 hover:bg-slate-50 dark:border-slate-850 dark:text-slate-450 dark:hover:bg-slate-800"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-slate-850">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    최대 가격
                  </label>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {maxPrice === 500000 ? "50만원+" : maxPrice === 0 ? "무료나눔 🎁" : `${maxPrice.toLocaleString()}원`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-extrabold">
                  <span>0원</span>
                  <span>25만원</span>
                  <span>50만원+</span>
                </div>
              </div>

              {/* Trade Locations checklist */}
              <div className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-slate-850">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  거래 가능 장소
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 select-none custom-scrollbar">
                  {FILTER_LOCATIONS.map((loc) => {
                    const isChecked = selectedTradeLocations.includes(loc);
                    return (
                      <label
                        key={loc}
                        className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors text-xs font-semibold text-slate-700 dark:text-slate-350"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedTradeLocations(selectedTradeLocations.filter(l => l !== loc));
                            } else {
                              setSelectedTradeLocations([...selectedTradeLocations, loc]);
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-750 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span className="truncate">{loc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Trade Times checklist */}
              <div className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-slate-850">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  거래 가능 시간대
                </label>
                <div className="grid grid-cols-2 gap-1.5 select-none">
                  {FILTER_TIMES.map((time) => {
                    const isChecked = selectedTradeTimes.includes(time);
                    return (
                      <label
                        key={time}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          isChecked
                            ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                            : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedTradeTimes(selectedTradeTimes.filter(t => t !== time));
                            } else {
                              setSelectedTradeTimes([...selectedTradeTimes, time]);
                            }
                          }}
                          className="sr-only"
                        />
                        <span>{time}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Condition checklist */}
              <div className="space-y-2.5 select-none">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                  물품 상태
                </label>
                <div className="space-y-1.5">
                  {FILTER_CONDITIONS.map((cond) => {
                    const isChecked = selectedConditions.includes(cond);
                    return (
                      <label
                        key={cond}
                        className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors text-xs font-semibold text-slate-700 dark:text-slate-350"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedConditions(selectedConditions.filter(c => c !== cond));
                            } else {
                              setSelectedConditions([...selectedConditions, cond]);
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-750 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span>{cond}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
          </aside>

          {/* Items Explorer Column */}
          <div className="flex-1 space-y-6">
            {/* Search Box */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="물품명, 내용, 판매자 등으로 검색해보세요..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">적용된 필터:</span>
                
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-355 shadow-sm">
                    <span>검색: "{searchTerm}"</span>
                    <button onClick={() => setSearchTerm("")} className="hover:text-red-500 transition-colors cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {selectedCategory !== "전체" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-355 shadow-sm">
                    <span>카테고리: {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory("전체")} className="hover:text-red-500 transition-colors cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {statusFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-355 shadow-sm">
                    <span>상태: {statusFilter === "ON_SALE" ? "판매중" : statusFilter === "RESERVED" ? "예약중" : "완료됨"}</span>
                    <button onClick={() => setStatusFilter("ALL")} className="hover:text-red-500 transition-colors cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {maxPrice !== 500000 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-355 shadow-sm">
                    <span>가격: ~{maxPrice.toLocaleString()}원</span>
                    <button onClick={() => setMaxPrice(500000)} className="hover:text-red-500 transition-colors cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {selectedTradeLocations.map((loc) => (
                  <span key={loc} className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 px-2.5 py-0.5 rounded-lg text-slate-700 dark:text-slate-355 shadow-sm">
                    <span>장소: {loc}</span>
                    <button onClick={() => setSelectedTradeLocations(selectedTradeLocations.filter(l => l !== loc))} className="hover:text-red-500 transition-colors cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                ))}

                {selectedTradeTimes.map((time) => (
                  <span key={time} className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-355 shadow-sm">
                    <span>시간: {time}</span>
                    <button onClick={() => setSelectedTradeTimes(selectedTradeTimes.filter(t => t !== time))} className="hover:text-red-500 transition-colors cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                ))}

                {selectedConditions.map((cond) => (
                  <span key={cond} className="inline-flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-355 shadow-sm">
                    <span>상태: {cond}</span>
                    <button onClick={() => setSelectedConditions(selectedConditions.filter(c => c !== cond))} className="hover:text-red-500 transition-colors cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                ))}

                <button
                  onClick={handleResetFilters}
                  className="ml-auto text-[10px] font-extrabold text-blue-650 hover:text-blue-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  모두 초기화
                </button>
              </div>
            )}

            {/* Query result summary */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-450 dark:text-slate-500">
                총 <span className="text-slate-900 dark:text-white font-extrabold">{filteredItems.length}</span>개의 상품
              </span>
            </div>

            {/* Grid of cards */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-8 text-center">
                <HelpCircle className="h-12 w-12 text-slate-300 dark:text-slate-650 mb-3 animate-pulse" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-250 text-sm">일치하는 중고 물품이 없어요</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
                  검색어를 변경하거나 다른 카테고리/거래 장소를 선택해 보시길 권장합니다.
                  <br />
                  또는 상세 필터링의 "초기화" 버튼을 눌러 초기 조건으로 되돌려 보세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
