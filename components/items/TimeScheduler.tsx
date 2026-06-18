"use client";

import React, { useState, useMemo } from "react";
import { Clock, Calendar, CheckSquare, Square, Trash2, Check, AlertCircle } from "lucide-react";

interface TimeSchedulerProps {
  // Array of formatted slot strings, e.g. ["월요일 오전(9-12시)", "화요일 오후(2-6시)"]
  value: string[];
  onChange: (value: string[]) => void;
}

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const DAYS_FULL = {
  "월": "월요일",
  "화": "화요일",
  "수": "수요일",
  "목": "목요일",
  "금": "금요일",
  "토": "토요일",
  "일": "일요일"
} as const;

const SLOTS = [
  { label: "오전", time: "09:00-12:00", value: "오전(9-12시)" },
  { label: "점심", time: "12:00-14:00", value: "점심(12-2시)" },
  { label: "오후", time: "14:00-18:00", value: "오후(2-6시)" },
  { label: "저녁", time: "18:00-21:00", value: "저녁(6-9시)" },
];

export default function TimeScheduler({ value, onChange }: TimeSchedulerProps) {
  // Internal helper to parse full slot strings to flat day-slot IDs for easier UI state tracking
  // E.g., "월요일 오전(9-12시)" -> "월-오전(9-12시)"
  const selectedKeys = useMemo(() => {
    return value.map((v) => {
      // Find matching day
      const foundDay = DAYS.find((d) => v.startsWith(DAYS_FULL[d as keyof typeof DAYS_FULL]));
      // Find matching slot
      const foundSlot = SLOTS.find((s) => v.includes(s.value));
      if (foundDay && foundSlot) {
        return `${foundDay}-${foundSlot.value}`;
      }
      return "";
    }).filter(Boolean);
  }, [value]);

  const handleCellToggle = (day: string, slotValue: string) => {
    const key = `${day}-${slotValue}`;
    const fullString = `${DAYS_FULL[day as keyof typeof DAYS_FULL]} ${slotValue}`;

    if (selectedKeys.includes(key)) {
      onChange(value.filter((v) => v !== fullString));
    } else {
      onChange([...value, fullString]);
    }
  };

  const handleSelectAll = () => {
    const allSlots: string[] = [];
    DAYS.forEach((day) => {
      SLOTS.forEach((slot) => {
        allSlots.push(`${DAYS_FULL[day as keyof typeof DAYS_FULL]} ${slot.value}`);
      });
    });
    onChange(allSlots);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Generate a friendly Korean summary string
  const summaryText = useMemo(() => {
    if (value.length === 0) {
      return "선택된 거래 시간대가 없습니다. (최소 1개 이상 지정)";
    }

    const totalPossible = DAYS.length * SLOTS.length;
    if (value.length === totalPossible) {
      return "요일 불문 언제든 조율 가능 ⏰";
    }

    // Group selected slots by day
    const dayGroups: Record<string, string[]> = {};
    DAYS.forEach((day) => {
      const daySlots = SLOTS.filter((slot) =>
        selectedKeys.includes(`${day}-${slot.value}`)
      ).map((s) => s.label);
      if (daySlots.length > 0) {
        dayGroups[day] = daySlots;
      }
    });

    const activeDays = Object.keys(dayGroups);
    if (activeDays.length === 0) return "";

    // If weekdays have the exact same slots, and weekends have the exact same slots, we can simplify!
    const weekdayList = ["월", "화", "수", "목", "금"];
    const weekendList = ["토", "일"];

    // Format individual days: "월(오후/저녁)"
    const dayParts = activeDays.map((day) => {
      const slots = dayGroups[day];
      if (slots.length === SLOTS.length) {
        return `${day}(하루종일)`;
      }
      return `${day}(${slots.join("/")})`;
    });

    return `${dayParts.join(", ")} 가능`;
  }, [value, selectedKeys]);

  return (
    <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">거래 가능 일정 타임테이블 설정</span>
        </div>

        {/* Global actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-850 cursor-pointer shadow-sm"
          >
            <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
            전체 선택
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-[10px] font-bold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-red-950/20 cursor-pointer shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            전체 해제
          </button>
        </div>
      </div>

      {/* DESKTOP TIMETABLE VIEW (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/45 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-center text-xs font-semibold">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-850">요일</th>
              {SLOTS.map((slot) => (
                <th key={slot.label} className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-850 last:border-r-0">
                  <span className="block">{slot.label}</span>
                  <span className="block text-[8px] font-normal text-slate-400 mt-0.5">{slot.time}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850/65">
            {DAYS.map((day) => (
              <tr key={day} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                <td className="py-3 px-3 font-bold border-r border-slate-100 dark:border-slate-850 text-slate-750 dark:text-slate-300">
                  {day}
                </td>
                {SLOTS.map((slot) => {
                  const key = `${day}-${slot.value}`;
                  const active = selectedKeys.includes(key);
                  return (
                    <td
                      key={slot.label}
                      onClick={() => handleCellToggle(day, slot.value)}
                      className={`py-3 px-3 border-r border-slate-100 dark:border-slate-850 last:border-r-0 cursor-pointer transition-all duration-150 ${
                        active
                          ? "bg-blue-50/50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300 font-bold"
                          : "text-slate-400 hover:text-slate-800 dark:text-slate-650"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <div className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                          active
                            ? "bg-blue-600 border-blue-650 text-white scale-95"
                            : "bg-transparent border-slate-200 dark:border-slate-800"
                        }`}>
                          {active && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE ACCORDION STACK VIEW (Hidden on desktop) */}
      <div className="md:hidden space-y-2">
        {DAYS.map((day) => {
          const daySelectedCount = SLOTS.filter((slot) =>
            selectedKeys.includes(`${day}-${slot.value}`)
          ).length;

          return (
            <div
              key={day}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="flex justify-between items-center px-4 py-3 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-850">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{day}요일</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  daySelectedCount > 0
                    ? "bg-blue-50 text-blue-600 border border-blue-150"
                    : "bg-slate-100 text-slate-450"
                }`}>
                  시간 {daySelectedCount}개 선택됨
                </span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {SLOTS.map((slot) => {
                  const key = `${day}-${slot.value}`;
                  const active = selectedKeys.includes(key);

                  return (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => handleCellToggle(day, slot.value)}
                      className={`flex flex-col p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                        active
                          ? "bg-blue-50/20 border-blue-600 text-blue-755 dark:bg-blue-950/20 dark:border-blue-700 dark:text-blue-300 font-bold"
                          : "bg-white border-slate-150 text-slate-550 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-450 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[11px] font-extrabold">{slot.label}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{slot.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule live summary display */}
      <div className="flex gap-2 p-3.5 bg-blue-50/25 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/35 rounded-xl text-xs">
        <Calendar className="h-4.5 w-4.5 text-blue-650 dark:text-blue-450 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="block font-bold text-slate-800 dark:text-slate-200">📆 선택된 일정 요약</span>
          <p className="font-semibold text-blue-700 dark:text-blue-400 underline decoration-indigo-300 dark:decoration-indigo-850">
            {summaryText}
          </p>
        </div>
      </div>
    </div>
  );
}
