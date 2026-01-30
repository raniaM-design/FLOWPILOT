/**
 * Script pour migrer les données locales (SQLite) vers la production (PostgreSQL)
 * 
 * Usage:
 * 1. Configurez DATABASE_URL_LOCAL dans .env.local (SQLite local)
 * 2. Configurez DATABASE_URL dans .env.local (PostgreSQL de production)
 * 3. Exécutez: npm run migrate-data
 * 
 * ⚠️ ATTENTION: Ce script va écraser les données existantes en production!
 */

import { PrismaClient } from "@prisma/client";

// Client pour la base locale (SQLite)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL,
    },
  },
});

// Client pour la production (PostgreSQL)
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PROD || process.env.DATABASE_URL,
    },
  },
});

async function migrateUsers() {
  console.log("👥 Migration des utilisateurs...");
  const users = await localPrisma.user.findMany();
  
  for (const user of users) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existing = await prodPrisma.user.findUnique({
        where: { email: user.email },
      });

      if (existing) {
        console.log(`  ⚠️  Utilisateur ${user.email} existe déjà, mise à jour...`);
        await prodPrisma.user.update({
          where: { email: user.email },
          data: {
            passwordHash: user.passwordHash,
            preferredLanguage: user.preferredLanguage,
            displayReduceAnimations: user.displayReduceAnimations,
            displayMode: user.displayMode,
            displayDensity: user.displayDensity,
            displayTheme: user.displayTheme,
          },
        });
      } else {
        await prodPrisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            preferredLanguage: user.preferredLanguage,
            displayReduceAnimations: user.displayReduceAnimations,
            displayMode: user.displayMode,
            displayDensity: user.displayDensity,
            displayTheme: user.displayTheme,
            createdAt: user.createdAt,
          },
        });
        console.log(`  ✅ Utilisateur ${user.email} migré`);
      }
    } catch (error: any) {
      console.error(`  ❌ Erreur pour ${user.email}:`, error.message);
    }
  }
  console.log(`✅ ${users.length} utilisateur(s) traité(s)\n`);
}

async function migrateProjects() {
  console.log("📁 Migration des projets...");
  const projects = await localPrisma.project.findMany();
  
  for (const project of projects) {
    try {
      // Vérifier si le projet existe déjà
      const existing = await prodPrisma.project.findUnique({
        where: { id: project.id },
      });

      if (existing) {
        console.log(`  ⚠️  Projet ${project.name} existe déjà, mise à jour...`);
        await prodPrisma.project.update({
          where: { id: project.id },
          data: {
            name: project.name,
            description: project.description,
            client: project.client,
            teamMembers: project.teamMembers,
            status: project.status,
            updatedAt: project.updatedAt,
          },
        });
      } else {
        await prodPrisma.project.create({
          data: {
            id: project.id,
            ownerId: project.ownerId,
            name: project.name,
            description: project.description,
            client: project.client,
            teamMembers: project.teamMembers,
            status: project.status,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          },
        });
        console.log(`  ✅ Projet ${project.name} migré`);
      }
    } catch (error: any) {
      console.error(`  ❌ Erreur pour projet ${project.name}:`, error.message);
    }
  }
  console.log(`✅ ${projects.length} projet(s) traité(s)\n`);
}

async function migrateDecisions() {
  console.log("🎯 Migration des décisions...");
  const decisions = await localPrisma.decision.findMany();
  
  for (const decision of decisions) {
    try {
      const existing = await prodPrisma.decision.findUnique({
        where: { id: decision.id },
      });

      if (!existing) {
        await prodPrisma.decision.create({
          data: {
            id: decision.id,
            projectId: decision.projectId,
            createdById: decision.createdById,
            title: decision.title,
            context: decision.context,
            decision: decision.decision,
            status: decision.status,
            createdAt: decision.createdAt,
            updatedAt: decision.updatedAt,
          },
        });
        console.log(`  ✅ Décision ${decision.title} migrée`);
      }
    } catch (error: any) {
      console.error(`  ❌ Erreur pour décision ${decision.title}:`, error.message);
    }
  }
  console.log(`✅ ${decisions.length} décision(s) traitée(s)\n`);
}

async function migrateActions() {
  console.log("✅ Migration des actions...");
  const actions = await localPrisma.actionItem.findMany();
  
  for (const action of actions) {
    try {
      const existing = await prodPrisma.actionItem.findUnique({
        where: { id: action.id },
      });

      if (!existing) {
        await prodPrisma.actionItem.create({
          data: {
            id: action.id,
            projectId: action.projectId,
            decisionId: action.decisionId,
            meetingId: action.meetingId,
            createdById: action.createdById,
            assigneeId: action.assigneeId,
            title: action.title,
            description: action.description,
            status: action.status,
            dueDate: action.dueDate,
            createdAt: action.createdAt,
            updatedAt: action.updatedAt,
          },
        });
        console.log(`  ✅ Action ${action.title} migrée`);
      }
    } catch (error: any) {
      console.error(`  ❌ Erreur pour action ${action.title}:`, error.message);
    }
  }
  console.log(`✅ ${actions.length} action(s) traitée(s)\n`);
}

async function migrateMeetings() {
  console.log("📅 Migration des réunions...");
  const meetings = await localPrisma.meeting.findMany();
  
  for (const meeting of meetings) {
    try {
      const existing = await prodPrisma.meeting.findUnique({
        where: { id: meeting.id },
      });

      if (!existing) {
        await prodPrisma.meeting.create({
          data: {
            id: meeting.id,
            ownerId: meeting.ownerId,
            projectId: meeting.projectId,
            title: meeting.title,
            date: meeting.date,
            participants: meeting.participants,
            context: meeting.context,
            raw_notes: meeting.raw_notes,
            analysisJson: meeting.analysisJson,
            analyzedAt: meeting.analyzedAt,
            externalProvider: meeting.externalProvider,
            externalEventId: meeting.externalEventId,
            externalCalendarId: meeting.externalCalendarId,
            externalICalUId: meeting.externalICalUId,
            externalLastModified: meeting.externalLastModified,
            externalIsCancelled: meeting.externalIsCancelled,
            externalStartDateTime: meeting.externalStartDateTime,
            externalEndDateTime: meeting.externalEndDateTime,
            isSynced: meeting.isSynced,
            createdAt: meeting.createdAt,
            updatedAt: meeting.updatedAt,
          },
        });
        console.log(`  ✅ Réunion ${meeting.title} migrée`);
      }
    } catch (error: any) {
      console.error(`  ❌ Erreur pour réunion ${meeting.title}:`, error.message);
    }
  }
  console.log(`✅ ${meetings.length} réunion(s) traitée(s)\n`);
}

async function main() {
  console.log("🚀 Début de la migration des données locales vers la production\n");
  console.log("⚠️  ATTENTION: Les données existantes en production seront mises à jour!\n");

  // Vérifier les configurations
  const localUrl = process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL;
  const prodUrl = process.env.DATABASE_URL_PROD;

  if (!prodUrl) {
    console.error("❌ DATABASE_URL_PROD n'est pas définie!");
    console.error("   Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production");
    process.exit(1);
  }

  console.log(`📦 Source (local): ${localUrl?.substring(0, 30)}...`);
  console.log(`🌐 Destination (prod): ${prodUrl.substring(0, 30)}...\n`);

  try {
    // Tester les connexions
    console.log("🔌 Test des connexions...");
    await localPrisma.$connect();
    console.log("  ✅ Connexion locale OK");
    await prodPrisma.$connect();
    console.log("  ✅ Connexion production OK\n");

    // Migrer les données dans l'ordre des dépendances
    await migrateUsers();
    await migrateProjects();
    await migrateDecisions();
    await migrateActions();
    await migrateMeetings();

    console.log("✅ Migration terminée avec succès!");
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await prodPrisma.$disconnect();
  }
}

main();

