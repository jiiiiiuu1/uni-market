"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import {
  ShoppingBag,
  MessageSquare,
  Calendar,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Compass,
  PlusCircle,
  HelpCircle,
  ChevronDown,
  Bell
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    logout,
    notifications,
    tradeRequests,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptTradeRequest,
    rejectTradeRequest,
    openLoginPopup
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const myNotifications = React.useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => n.userId === currentUser.id);
  }, [notifications, currentUser]);

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      if (diffMins < 5) return "방금 전";
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
    } catch {
      return isoString;
    }
  };




  const navItems = [
    { name: "둘러보기", href: "/", icon: Compass },
    { name: "판매하기", href: "/items/new", icon: PlusCircle, requireAuth: true },
    { name: "거래 예약", href: "/reservations", icon: Calendar, requireAuth: true },
    { name: "마이페이지", href: "/profile", icon: User, requireAuth: true },
  ];

  return (
    <>
      {(showNotifications || showProfileMenu) && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
          }}
        />
      )}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-blue-600 transition-all hover:scale-105 dark:text-blue-400">
            <ShoppingBag className="h-6 w-6 stroke-[2.5]" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              UNI MARKET
            </span>
          </Link>
          <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 md:inline-block">
            인천대 전용
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            
            // If page requires auth and user is not logged in, we hide it or show it with disabled click
            if (item.requireAuth && !currentUser) return null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Profile Actions */}
        <div className="flex items-center gap-4">

          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
                  title="알림"
                >
                  <Bell className="h-5 w-5" />
                  {myNotifications.some((n) => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-100 bg-white p-2.5 shadow-2xl ring-1 ring-black/5 dark:border-slate-850 dark:bg-slate-850 z-50">
                    <div className="flex items-center justify-between px-2.5 py-1 pb-2 border-b border-slate-50 dark:border-slate-800 text-[11px] font-bold text-slate-400">
                      <span>최근 알림</span>
                      {myNotifications.length > 0 && (
                        <button
                          onClick={() => markAllNotificationsAsRead()}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          모두 읽음
                        </button>
                      )}
                    </div>
                    <div className="mt-1 divide-y divide-slate-50 dark:divide-slate-800/50 max-h-60 overflow-y-auto">
                      {myNotifications.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 text-xs font-semibold">새로운 알림이 없습니다.</p>
                      ) : (
                        myNotifications.map((n, idx) => {
                          const req = n.relatedId ? tradeRequests.find((r) => r.id === n.relatedId) : null;
                          return (
                            <div
                              key={`${n.id}-${idx}`}
                              onClick={() => {
                                markNotificationAsRead(n.id);
                                if (n.type === "TRADE_ACCEPTED" && n.relatedId) {
                                  router.push(`/chat/${n.relatedId}`);
                                  setShowNotifications(false);
                                }
                              }}
                              className={`p-2.5 text-xs transition-colors rounded-xl flex flex-col ${
                                !n.read ? "bg-blue-50/35 dark:bg-blue-950/20 font-semibold" : ""
                              } ${n.type === "TRADE_ACCEPTED" ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40" : ""}`}
                            >
                              <p className="text-slate-700 dark:text-slate-350 leading-snug">{n.text}</p>
                              
                              {n.type === "TRADE_REQUEST" && req && (
                                <>
                                  {req.status === "PENDING" ? (
                                    <div className="flex gap-1.5 mt-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          acceptTradeRequest(req.id);
                                        }}
                                        className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-750 text-white rounded text-[10px] font-bold transition-colors cursor-pointer text-center"
                                      >
                                        수락
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          rejectTradeRequest(req.id);
                                        }}
                                        className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer text-center dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 border border-slate-250 dark:border-slate-750"
                                      >
                                        거절
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 block">
                                      {req.status === "ACCEPTED" ? "수락 완료 ✅" : "거절됨 ❌"}
                                    </span>
                                  )}
                                </>
                              )}
                              
                              <span className="text-[9px] text-slate-400 mt-1 block">{getRelativeTime(n.time)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

                {/* User Profile Popover */}
              <div className="relative flex items-center gap-2 py-1.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="h-9 w-9 rounded-full overflow-hidden focus:outline-none transition-transform hover:scale-105 cursor-pointer shadow-sm border border-slate-200/80"
                >
                  {currentUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      {currentUser.nickname ? currentUser.nickname.slice(-2) : <User className="h-4 w-4" />}
                    </div>
                  )}
                </button>
                
                {/* Popover Card */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-slate-150 bg-white p-2.5 shadow-2xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-850 z-50">
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.nickname}님
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    
                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                    
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="h-3.5 w-3.5" />
                      마이페이지
                    </Link>
                    
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openLoginPopup}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                로그인
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation bar at the bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 pb-safe-bottom">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            
            if (item.requireAuth && !currentUser) return null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 w-16 h-full text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
    </>
  );
}
