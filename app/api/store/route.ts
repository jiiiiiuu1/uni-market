import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { MOCK_ITEMS, MOCK_USERS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

// Force this route to be executed dynamically on every request (disables caching)
export const dynamic = "force-dynamic";

const filePath = path.join(process.cwd(), "lib", "data-store.json");

function getInitialData() {
  const parsedItems = MOCK_ITEMS.map((item: any) => ({
    ...item,
    category: item.category === "디지털/가전" ? "전자기기" : item.category,
    condition: item.condition || "사용감 있음",
  }));

  const defaultNotifications = [
    {
      id: "notif_1",
      userId: "user_inu_senior",
      text: "정보기과26님이 대화방에서 예약을 제안했습니다.",
      time: new Date(Date.now() - 300000).toISOString(),
      read: false,
      type: "GENERAL",
    },
    {
      id: "notif_2",
      userId: "user_inu_senior",
      text: "알기 쉬운 알고리즘 전공책 판매 예약이 확정되었습니다.",
      time: new Date(Date.now() - 600000).toISOString(),
      read: false,
      type: "GENERAL",
    },
    {
      id: "notif_3",
      userId: "user_inu_senior",
      text: "경영학도님과의 직거래가 완료되었습니다. 후기를 남겨주세요.",
      time: new Date(Date.now() - 3600000).toISOString(),
      read: true,
      type: "GENERAL",
    },
  ];

  return {
    items: parsedItems,
    users: MOCK_USERS,
    chatRooms: [],
    tradeRequests: [],
    notifications: defaultNotifications,
  };
}

function readDataLocal() {
  try {
    if (!fs.existsSync(filePath)) {
      const init = getInitialData();
      fs.writeFileSync(filePath, JSON.stringify(init, null, 2), "utf-8");
      return init;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to read local store data:", error);
    return getInitialData();
  }
}

function writeDataLocal(data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write local store data:", error);
    return false;
  }
}

export async function GET() {
  const isConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const noCacheHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
  const responseOptions = { headers: noCacheHeaders };

  if (!isConfigured) {
    console.log("[Store API] Supabase not configured. Using local JSON store.");
    return NextResponse.json({
      ...readDataLocal(),
      _debug: {
        isSupabaseConfigured: false,
        usingLocalFallback: true,
        reason: "Missing environment variables"
      }
    }, responseOptions);
  }

  try {
    const [
      { data: dbItems, error: itemsErr },
      { data: dbChats, error: chatsErr },
      { data: dbRequests, error: requestsErr },
      { data: dbNotifs, error: notifsErr },
      { data: dbUsers, error: usersErr },
    ] = await Promise.all([
      supabase.from("items").select("*"),
      supabase.from("chat_rooms").select("*"),
      supabase.from("trade_requests").select("*"),
      supabase.from("notifications").select("*"),
      supabase.from("users").select("*"),
    ]);

    if (itemsErr || chatsErr || requestsErr || notifsErr || usersErr) {
      console.warn(
        "[Store API] One or more Supabase table queries failed (tables might not be created yet). Falling back to local store.",
        { itemsErr, chatsErr, requestsErr, notifsErr, usersErr }
      );
      return NextResponse.json({
        ...readDataLocal(),
        _debug: {
          isSupabaseConfigured: true,
          usingLocalFallback: true,
          reason: "Database query error",
          errors: {
            items: itemsErr?.message || null,
            chats: chatsErr?.message || null,
            requests: requestsErr?.message || null,
            notifs: notifsErr?.message || null,
            users: usersErr?.message || null
          }
        }
      }, responseOptions);
    }

    // Map user attributes from snake_case back to camelCase
    const mappedDbUsers = (dbUsers || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      nickname: u.nickname,
      department: u.department,
      mannerTemp: u.manner_temp !== null && u.manner_temp !== undefined ? Number(u.manner_temp) : 36.5,
      completedTradesCount: u.completed_trades_count || 0,
      wishlist: u.wishlist || [],
      avatarUrl: u.avatar_url || null,
      reviews: u.reviews || [],
      createdAt: u.created_at || null,
    }));

    // Merge database users with MOCK_USERS to ensure mock accounts are always present for demo purposes
    const mergedUsers = [...MOCK_USERS];
    mappedDbUsers.forEach((dbUser: any) => {
      const idx = mergedUsers.findIndex((u) => u.id === dbUser.id);
      if (idx >= 0) {
        mergedUsers[idx] = dbUser;
      } else {
        mergedUsers.push(dbUser);
      }
    });

    // Seed/return initial data if the tables are completely empty
    if (!dbItems || dbItems.length === 0) {
      console.log("[Store API] Supabase items table is empty. Seeding/returning initial mock data.");
      const initial = getInitialData();

      try {
        const seedItems = initial.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          category: item.category,
          condition: item.condition,
          images: item.images || [],
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          sellerMannerTemp: item.sellerMannerTemp,
          sellerDept: item.sellerDept,
          status: item.status || "ON_SALE",
          location: item.location || "",
          timeSlots: item.timeSlots || [],
          reservedBuyerId: item.reservedBuyerId || null,
          reservedBuyerName: item.reservedBuyerName || null,
          selectedTimeSlot: item.selectedTimeSlot || null,
          createdAt: item.createdAt || new Date().toISOString(),
          views: item.views || 0,
          likes: item.likes || 0,
          likedBy: item.likedBy || [],
        }));

        const seedNotifs = initial.notifications.map((notif: any) => ({
          id: notif.id,
          userId: notif.userId,
          text: notif.text,
          time: notif.time,
          read: notif.read || false,
          type: notif.type || "GENERAL",
          relatedId: notif.relatedId || null,
        }));

        await Promise.all([
          supabase.from("items").insert(seedItems),
          supabase.from("notifications").insert(seedNotifs),
        ]);
        console.log("[Store API] Successfully seeded initial mock items & notifications.");
      } catch (seedErr) {
        console.error("[Store API] Failed to seed Supabase database:", seedErr);
      }

      return NextResponse.json({
        ...initial,
        _debug: {
          isSupabaseConfigured: true,
          usingLocalFallback: false,
          seeded: true,
          dbItemsCount: 0
        }
      }, responseOptions);
    }

    return NextResponse.json({
      items: dbItems || [],
      chatRooms: dbChats || [],
      tradeRequests: dbRequests || [],
      notifications: dbNotifs || [],
      users: mergedUsers,
      _debug: {
        isSupabaseConfigured: true,
        usingLocalFallback: false,
        dbItemsCount: dbItems.length
      }
    }, responseOptions);
  } catch (error) {
    console.error("[Store API] Unexpected error querying Supabase. Falling back to local store:", error);
    return NextResponse.json({
      ...readDataLocal(),
      _debug: {
        isSupabaseConfigured: true,
        usingLocalFallback: true,
        reason: "Unexpected exception",
        error: String(error)
      }
    }, responseOptions);
  }
}

export async function POST(request: Request) {
  const isConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse POST body:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }

  const { items, users, chatRooms, tradeRequests, notifications } = body;

  if (!isConfigured) {
    const success = writeDataLocal({ items, users, chatRooms, tradeRequests, notifications });
    return NextResponse.json({ success });
  }

  try {
    let dbError: any = null;

    // Helper function to safely sync a table by:
    // 1. Fetching current IDs in DB
    // 2. Deleting only rows that are not in the payload
    // 3. Upserting the payload rows (avoiding wiping the table empty and causing GET race conditions)
    async function syncTable(tableName: string, payloadItems: any[], mapper: (item: any) => any) {
      if (dbError) return;

      const payloadIds = (payloadItems || []).map((x: any) => x.id);
      
      // 1. Fetch current IDs
      const { data: dbRows, error: fetchErr } = await supabase.from(tableName).select("id");
      if (fetchErr) {
        dbError = fetchErr;
        return;
      }

      const dbIds = (dbRows || []).map((x: any) => x.id);
      const idsToDelete = dbIds.filter((id: string) => !payloadIds.includes(id));

      // 2. Delete rows removed on client
      if (idsToDelete.length > 0) {
        const { error: delErr } = await supabase.from(tableName).delete().in("id", idsToDelete);
        if (delErr) {
          dbError = delErr;
          return;
        }
      }

      // 3. Upsert current rows
      if (payloadItems && payloadItems.length > 0) {
        const mappedItems = payloadItems.map(mapper);
        const { error: upsertErr } = await supabase.from(tableName).upsert(mappedItems, { onConflict: "id" });
        if (upsertErr) {
          dbError = upsertErr;
        }
      }
    }

    // 1. Sync items
    await syncTable("items", items, (item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      condition: item.condition,
      images: item.images || [],
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      sellerMannerTemp: item.sellerMannerTemp,
      sellerDept: item.sellerDept,
      status: item.status || "ON_SALE",
      location: item.location || "",
      timeSlots: item.timeSlots || [],
      reservedBuyerId: item.reservedBuyerId || null,
      reservedBuyerName: item.reservedBuyerName || null,
      selectedTimeSlot: item.selectedTimeSlot || null,
      createdAt: item.createdAt || new Date().toISOString(),
      views: item.views || 0,
      likes: item.likes || 0,
      likedBy: item.likedBy || [],
    }));

    // 2. Sync chat rooms
    await syncTable("chat_rooms", chatRooms, (room: any) => ({
      id: room.id,
      itemId: room.itemId,
      itemTitle: room.itemTitle,
      itemPrice: room.itemPrice,
      itemImage: room.itemImage || null,
      itemStatus: room.itemStatus || null,
      buyerId: room.buyerId,
      buyerName: room.buyerName || null,
      sellerId: room.sellerId,
      sellerName: room.sellerName || null,
      messages: room.messages || [],
      reservationStatus: room.reservationStatus || "NONE",
      proposedTimeSlot: room.proposedTimeSlot || null,
      lastMessageText: room.lastMessageText || null,
      lastMessageTime: room.lastMessageTime || null,
    }));

    // 3. Sync trade requests
    await syncTable("trade_requests", tradeRequests, (req: any) => ({
      id: req.id,
      itemId: req.itemId,
      itemTitle: req.itemTitle || null,
      itemImage: req.itemImage || null,
      itemPrice: req.itemPrice || 0,
      buyerId: req.buyerId,
      buyerName: req.buyerName || null,
      sellerId: req.sellerId,
      sellerName: req.sellerName || null,
      selectedLocation: req.selectedLocation || null,
      selectedTimeSlot: req.selectedTimeSlot || null,
      message: req.message || null,
      status: req.status || "PENDING",
      expiresAt: req.expiresAt || null,
      createdAt: req.createdAt || new Date().toISOString(),
    }));

    // 4. Sync notifications
    await syncTable("notifications", notifications, (notif: any) => ({
      id: notif.id,
      userId: notif.userId,
      text: notif.text,
      time: notif.time,
      read: notif.read || false,
      type: notif.type || "GENERAL",
      relatedId: notif.relatedId || null,
    }));

    // 5. Sync users (only for valid UUID keys representing real authenticated users)
    if (!dbError && users && users.length > 0) {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = (id: string) => UUID_REGEX.test(id);

      const usersToUpsert = users
        .filter((u: any) => isValidUuid(u.id))
        .map((u: any) => ({
          id: u.id,
          email: u.email,
          nickname: u.nickname,
          department: u.department,
          manner_temp: u.mannerTemp !== undefined ? u.mannerTemp : 36.5,
          completed_trades_count: u.completedTradesCount || 0,
          wishlist: u.wishlist || [],
          avatar_url: u.avatarUrl || null,
          reviews: u.reviews || [],
        }));

      if (usersToUpsert.length > 0) {
        const { error: upsertErr } = await supabase.from("users").upsert(usersToUpsert, { onConflict: "id" });
        if (upsertErr) dbError = upsertErr;
      }
    }

    if (dbError) {
      console.warn(
        "[Store API] Supabase sync failed, falling back to local JSON store.",
        dbError
      );
      const success = writeDataLocal({ items, users, chatRooms, tradeRequests, notifications });
      return NextResponse.json({
        success,
        fallback: true,
        error: dbError.message || String(dbError),
      });
    }

    // Success sync, write to local JSON also to maintain dual parity
    writeDataLocal({ items, users, chatRooms, tradeRequests, notifications });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Store API] Unexpected sync error. Falling back to local store:", error);
    const success = writeDataLocal({ items, users, chatRooms, tradeRequests, notifications });
    return NextResponse.json({
      success,
      fallback: true,
      error: String(error),
    });
  }
}

