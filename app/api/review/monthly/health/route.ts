// Endpoint health pour valider le routing
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true, ts: Date.now(), route: "/api/review/monthly/health" });
}

export async function POST() {
  return Response.json({ ok: true, ts: Date.now(), route: "/api/review/monthly/health", method: "POST" });
}

