import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { MOCK_ITEMS, MOCK_USERS } from "@/lib/constants";

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

function readData() {
  try {
    if (!fs.existsSync(filePath)) {
      const init = getInitialData();
      fs.writeFileSync(filePath, JSON.stringify(init, null, 2), "utf-8");
      return init;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to read store data:", error);
    return getInitialData();
  }
}

function writeData(data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write store data:", error);
    return false;
  }
}

export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const success = writeData(body);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to parse POST body:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 400 }
    );
  }
}
