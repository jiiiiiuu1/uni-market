"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import LocationSelector from "@/components/items/LocationSelector";
import ImageUploader from "@/components/items/ImageUploader";
import TimeScheduler from "@/components/items/TimeScheduler";
import { CATEGORIES } from "@/lib/constants";
import {
  Plus,
  ArrowLeft,
  X,
  MapPin,
  Clock,
  Tag,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function NewItemPage() {
  const { currentUser, createItem, isInitialized } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push("/auth/login");
    }
  }, [isInitialized, currentUser, router]);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("책/교재");
  const [condition, setCondition] = useState<"새 제품" | "거의 새 것" | "사용감 있음" | "파손 있음">("거의 새 것");

  // Selected Locations (Checkboxes)
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["학생회관 1층 카페 앞"]);

  // Selected Time Slots list
  const [timeSlots, setTimeSlots] = useState<string[]>([
    "월요일 오후(2-6시)",
    "수요일 오후(2-6시)"
  ]);

  // Images (Up to 5) - simple string array of Base64 or URL strings
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60"
  ]);

  // Toast / Status state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "info">("success");

  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }

    if (images.length === 0) {
      alert("물품 사진을 1장 이상 등록해 주세요.");
      return;
    }

    if (selectedLocations.length === 0) {
      alert("거래 가능 장소를 최소 1개 이상 선택해 주세요.");
      return;
    }

    if (timeSlots.length === 0) {
      alert("거래 가능 시간대를 최소 1개 이상 선택해 주세요.");
      return;
    }

    const finalPrice = parseInt(price) || 0;

    const newItem = createItem({
      title: title.trim(),
      description: description.trim(),
      price: finalPrice,
      category,
      condition,
      images: images,
      location: selectedLocations.join(", "),
      timeSlots: timeSlots,
    });

    if (newItem) {
      router.push("/");
    }
  };

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

  return (
    <>
      <Navbar />

      {/* Floating toast notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-bold transition-all border border-slate-750/30">
          {toastType === "success" ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertCircle className="h-4 w-4 text-blue-400 shrink-0" />}
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-8 max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            이전 화면으로
          </button>
          
          <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Plus className="h-5 w-5 text-blue-600" />
            내 물품 등록하기
          </h1>
        </div>

        {/* Centered Form Layout */}
        <div className="max-w-3xl mx-auto w-full">
          
          {/* ======================================================== */}
          {/* FORM COLUMN */}
          {/* ======================================================== */}
          <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* Section 1: Image Uploader Component */}
            <ImageUploader
              images={images}
              onChange={setImages}
              onShowNotification={showNotification}
            />

            {/* Section 2: Category dropdown & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  카테고리 *
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 py-3 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {CATEGORIES.filter(c => c !== "전체").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  물품 상태 *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["새 제품", "거의 새 것", "사용감 있음", "파손 있음"] as const).map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setCondition(cond)}
                      className={`py-2 border text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                        condition === cond
                          ? "bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-850 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Title */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="title" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  물품 제목 *
                </label>
                <span className="text-[10px] font-bold text-slate-400">{title.length}/50자</span>
              </div>
              <input
                id="title"
                type="text"
                required
                maxLength={50}
                placeholder="예: 아이폰 기종 전용 투명 하드케이스 팝니다"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 py-3 px-4 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>

            {/* Section 4: Price */}
            <div>
              <label htmlFor="price" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                판매 가격 (원 단위, 숫자만 입력) *
              </label>
              <div className="relative">
                <input
                  id="price"
                  type="text"
                  required
                  placeholder="예: 15000 (0원 입력 시 무료나눔 🎁)"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setPrice(val);
                  }}
                  className="block w-full border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 py-3 px-4 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-400">원</span>
                </div>
              </div>
            </div>

            {/* Section 5: Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="description" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  상세 설명 (줄바꿈 지원) *
                </label>
                <span className="text-[10px] font-bold text-slate-400">{description.length}/500자</span>
              </div>
              <textarea
                id="description"
                required
                rows={5}
                maxLength={500}
                placeholder="물품의 스펙, 구매 시기, 하자가 있는 부분(기스, 찍힘 등)을 투명하게 적어주시면 빠른 거래 성사에 도움이 됩니다. 인천대 학생들끼리의 신뢰를 위해 솔직하게 작성해주세요."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full border border-slate-250 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-850 py-3 px-4 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>

            {/* Section 6: Location Selector Component */}
            <LocationSelector
              selectedLocations={selectedLocations}
              onChange={setSelectedLocations}
            />

            {/* Section 7: Time Scheduler Component */}
            <TimeScheduler
              value={timeSlots}
              onChange={setTimeSlots}
            />

            {/* Actions panel */}
            <div className="pt-6 border-t border-slate-150 dark:border-slate-800 flex items-center justify-end gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="py-3 px-5 border border-slate-200 dark:border-slate-750 text-slate-755 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-extrabold shadow-md transition-colors cursor-pointer"
                >
                  물품 등록하기
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
