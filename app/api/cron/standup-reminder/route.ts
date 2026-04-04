import { NextRequest } from "next/server";
import { GET as notificationsGet } from "@/app/api/cron/notifications/route";

/** @deprecated Utiliser `/api/cron/notifications` (même comportement). */
export async function GET(request: NextRequest) {
  return notificationsGet(request);
}
