import { NextResponse } from "next/server";
import { prisma, ensurePrismaConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint de diagnostic pour la base de données
 * Accessible depuis Vercel pour diagnostiquer les problèmes de connexion
 */
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    checks: {},
    errors: [],
  };

  // Check 1: DATABASE_URL existe
  diagnostics.checks.hasDatabaseUrl = !!process.env.DATABASE_URL;
  diagnostics.checks.databaseUrlPreview = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.substring(0, 30) + "..."
    : "not set";

  // Check 2: Format de DATABASE_URL
  if (process.env.DATABASE_URL) {
    diagnostics.checks.isPostgres = 
      process.env.DATABASE_URL.startsWith("postgresql://") ||
      process.env.DATABASE_URL.startsWith("postgres://");
    diagnostics.checks.isSqlite = process.env.DATABASE_URL.startsWith("file:");
    diagnostics.checks.hasPlaceholders = 
      process.env.DATABASE_URL.includes("xxx") ||
      process.env.DATABASE_URL.includes("user:password") ||
      process.env.DATABASE_URL.includes("dbname");
  }

  // Check 3: FLOWPILOT_JWT_SECRET existe
  diagnostics.checks.hasJwtSecret = !!process.env.FLOWPILOT_JWT_SECRET;

  // Check 4: Test de connexion à la base de données avec ensurePrismaConnection
  try {
    await ensurePrismaConnection(3);
    diagnostics.checks.dbConnection = "success";
    diagnostics.checks.connectionMethod = "ensurePrismaConnection";
    
    // Check 5: Vérifier que les tables existent
    try {
      const userCount = await prisma.user.count();
      diagnostics.checks.userTableExists = true;
      diagnostics.checks.userCount = userCount;
    } catch (error: any) {
      diagnostics.checks.userTableExists = false;
      diagnostics.errors.push({
        check: "userTable",
        error: error.message,
        code: error.code,
        details: error.stack?.substring(0, 300),
      });
      
      // Si c'est une erreur de schéma, ajouter des détails
      if (error.code === "P1012" || error.message?.includes("schema") || error.message?.includes("does not exist")) {
        diagnostics.errors.push({
          check: "migrations",
          error: "Les migrations Prisma ne sont probablement pas appliquées",
          code: error.code,
          solution: "Exécutez: npm run db:deploy ou npx prisma migrate deploy",
        });
      }
    }

    try {
      const projectCount = await prisma.project.count();
      diagnostics.checks.projectTableExists = true;
      diagnostics.checks.projectCount = projectCount;
    } catch (error: any) {
      diagnostics.checks.projectTableExists = false;
      diagnostics.errors.push({
        check: "projectTable",
        error: error.message,
        code: error.code,
      });
    }

    // Test de création (sans réellement créer)
    try {
      await prisma.$queryRaw`SELECT 1`;
      diagnostics.checks.canQuery = true;
    } catch (error: any) {
      diagnostics.checks.canQuery = false;
      diagnostics.errors.push({
        check: "query",
        error: error.message,
        code: error.code,
      });
    }

    await prisma.$disconnect();
  } catch (error: any) {
    diagnostics.checks.dbConnection = "failed";
    diagnostics.errors.push({
      check: "connection",
      error: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 500),
    });
  }

  // Résumé
  const allChecksPassed = 
    diagnostics.checks.hasDatabaseUrl &&
    diagnostics.checks.isPostgres &&
    !diagnostics.checks.hasPlaceholders &&
    diagnostics.checks.dbConnection === "success" &&
    diagnostics.checks.userTableExists &&
    diagnostics.checks.projectTableExists;

  diagnostics.summary = {
    status: allChecksPassed ? "healthy" : "unhealthy",
    message: allChecksPassed
      ? "Tous les checks sont passés ✅"
      : "Certains checks ont échoué ❌",
  };

  return NextResponse.json(diagnostics, {
    status: allChecksPassed ? 200 : 500,
  });
}

