// app/api/review/monthly/pdf/route.ts
// REDIRECTION vers le nouveau système d'export
// Ce fichier redirige vers /api/export/monthly/pdf pour maintenir la compatibilité
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Construire le mois au format YYYY-MM depuis year/month ou utiliser le mois courant
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  
  let monthISO: string;
  if (yearParam && monthParam) {
    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);
    monthISO = `${year}-${String(month).padStart(2, "0")}`;
  } else {
    // Mois courant par défaut
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    monthISO = `${year}-${String(month).padStart(2, "0")}`;
  }
  
  // Construire la nouvelle URL
  const newUrl = new URL("/api/export/monthly/pdf", request.url);
  newUrl.searchParams.set("month", monthISO);
  if (searchParams.get("locale")) {
    newUrl.searchParams.set("locale", searchParams.get("locale")!);
  }
  if (searchParams.get("projectId")) {
    newUrl.searchParams.set("projectId", searchParams.get("projectId")!);
  }
  
  // Rediriger vers le nouveau endpoint
  return NextResponse.redirect(newUrl);
}

export async function POST(request: NextRequest) {
  // POST redirige vers GET
  return GET(request);
}
