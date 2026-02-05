import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint de test simple pour vérifier la connexion DB sur Vercel
 */
export async function GET() {
  try {
    // Test de connexion
    await prisma.$connect();
    
    // Test de requête simple
    const userCount = await prisma.user.count().catch(() => 0);
    const projectCount = await prisma.project.count().catch(() => 0);
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      status: "ok",
      message: "Base de données accessible",
      userCount,
      projectCount,
      databaseUrl: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 30) + "..." : 
        "not set",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
      code: error.code,
      databaseUrl: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 30) + "..." : 
        "not set",
    }, { status: 500 });
  }
}

