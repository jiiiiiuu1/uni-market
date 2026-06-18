"use client";

import React, { useState } from "react";
import {
  Coffee,
  BookOpen,
  Building2,
  Heart,
  Home,
  Utensils,
  Map,
  Plus,
  X,
  HelpCircle,
  AlertCircle,
  Check
} from "lucide-react";

interface LocationSelectorProps {
  selectedLocations: string[];
  onChange: (locations: string[]) => void;
}

interface LocationOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRESET_LOCATIONS: LocationOption[] = [
  {
    id: "loc_union",
    name: "학생회관 1층 카페 앞",
    description: "유동인구가 가장 많아 대낮 직거래 시 매우 안전합니다. 카페 테이블 이용 가능.",
    icon: Coffee,
  },
  {
    id: "loc_library",
    name: "중앙도서관 정문",
    description: "계단 앞 넓은 광장이나 회전문 안 로비에서 안전하게 접선하기 좋습니다.",
    icon: BookOpen,
  },
  {
    id: "loc_bld7",
    name: "7호관(경영관) 1층 로비",
    description: "로비 안 소파 구역이 있어 기기 상태 검수 및 서적 거래에 최적화된 장소입니다.",
    icon: Building2,
  },
  {
    id: "loc_welfare",
    name: "복지관 앞",
    description: "매점 및 편의시설이 인접하여 저녁 거래 시에도 가로등이 밝아 거래하기 좋습니다.",
    icon: Heart,
  },
  {
    id: "loc_dorm",
    name: "기숙사(송도관) 앞",
    description: "택배 보관함 부근 또는 무인 락커 부근에서 비대면 거래 혹은 야간 직거래용으로 추천.",
    icon: Home,
  },
  {
    id: "loc_cafeteria",
    name: "학생식당 앞",
    description: "점심 및 저녁 식사 시간대 유동 인구가 많아 안전하게 거래할 수 있습니다.",
    icon: Utensils,
  },
  {
    id: "loc_bld2",
    name: "2호관 앞 광장",
    description: "자연대와 공대 인근 넓은 개활지로 날씨가 맑은 날 시야가 탁 트여 찾기 쉽습니다.",
    icon: Map,
  },
];

export default function LocationSelector({
  selectedLocations,
  onChange,
}: LocationSelectorProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPlace, setCustomPlace] = useState("");
  const [customError, setCustomError] = useState("");

  const handleTogglePreset = (name: string) => {
    if (selectedLocations.includes(name)) {
      onChange(selectedLocations.filter((l) => l !== name));
    } else {
      onChange([...selectedLocations, name]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError("");

    const term = customPlace.trim();
    if (!term) return;

    // Strict validation: must look like a campus place (Incheon National Univ keywords)
    const keywords = ["관", "호", "앞", "로비", "식당", "관 앞", "운동장", "정문", "후문", "도서관", "기숙사", "광장", "테이블", "카페", "매점", "옥상", "락커"];
    const hasKeyword = keywords.some(k => term.includes(k));

    if (!hasKeyword) {
      setCustomError("인천대 캠퍼스 내부 장소 명칭을 입력해 주세요. (예: 공대 8호관 매점 앞, 기숙사 락커 앞 등)");
      return;
    }

    if (selectedLocations.includes(term)) {
      setCustomError("이미 추가된 장소입니다.");
      return;
    }

    onChange([...selectedLocations, term]);
    setCustomPlace("");
    setShowCustomInput(false);
  };

  const handleRemoveTag = (name: string) => {
    onChange(selectedLocations.filter((l) => l !== name));
  };

  return (
    <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
      
      {/* Selector Title */}
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Map className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">캠퍼스 내 거래 가능 장소</span>
        </div>
        <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full dark:bg-blue-950 dark:text-blue-400">
          선택된 장소: {selectedLocations.length}개
        </span>
      </div>

      {/* Selected tags preview zone */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-slate-950/65 rounded-xl border border-slate-100 dark:border-slate-850">
          {selectedLocations.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 bg-blue-50 border border-blue-150 text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm"
            >
              <span>{loc}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(loc)}
                className="hover:bg-blue-100 dark:hover:bg-blue-900/60 p-0.5 rounded transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Checkbox preset list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PRESET_LOCATIONS.map((loc) => {
          const active = selectedLocations.includes(loc.name);
          const Icon = loc.icon;

          return (
            <div
              key={loc.id}
              className={`relative flex items-center justify-between p-3 rounded-xl border transition-all ${
                active
                  ? "bg-blue-50/20 border-blue-600 dark:bg-blue-950/20 dark:border-blue-700"
                  : "bg-white border-slate-200/80 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800"
              }`}
            >
              <button
                type="button"
                onClick={() => handleTogglePreset(loc.name)}
                className="flex items-center gap-2.5 flex-1 text-left focus:outline-none cursor-pointer"
              >
                <div className={`p-1.5 rounded-lg border ${
                  active
                    ? "bg-blue-600 border-blue-700 text-white"
                    : "bg-slate-150 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className={`text-xs font-bold block truncate ${
                    active ? "text-blue-700 dark:text-blue-300" : "text-slate-750 dark:text-slate-300"
                  }`}>
                    {loc.name}
                  </span>
                </div>
              </button>

              {/* Tooltip trigger button */}
              <div className="relative flex items-center justify-center pl-2">
                <button
                  type="button"
                  onMouseEnter={() => setActiveTooltip(loc.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setActiveTooltip(activeTooltip === loc.id ? null : loc.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>

                {/* Tooltip glassmorphic card */}
                {activeTooltip === loc.id && (
                  <div className="absolute right-0 bottom-6 z-20 w-48 p-3 rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-2xl text-[10px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-450 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95">
                    <span className="block font-bold text-slate-800 dark:text-slate-200 mb-1">💡 장소 추천 안내</span>
                    {loc.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Others / Custom input button */}
        {!showCustomInput ? (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all text-xs font-bold cursor-pointer bg-white dark:bg-slate-900"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            기타 장소 직접 입력
          </button>
        ) : (
          <form onSubmit={handleAddCustom} className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900 rounded-xl">
            <div className="flex gap-1">
              <input
                type="text"
                required
                placeholder="예: 공대 8호관 자판기 앞"
                value={customPlace}
                onChange={(e) => setCustomPlace(e.target.value)}
                className="flex-1 border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:bg-white text-slate-950 dark:text-white"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-750 text-white px-3.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomPlace("");
                  setCustomError("");
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {customError && (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {customError}
              </span>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
