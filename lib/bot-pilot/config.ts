import { prisma } from "@/lib/db";
import { DEFAULT_BOT_PILOT_SYSTEM_PROMPT } from "./default-system-prompt";

const SINGLETON_ID = "singleton";

export async function getBotPilotSystemPrompt(): Promise<string> {
  try {
    const row = await prisma.botPilotConfig.findUnique({
      where: { id: SINGLETON_ID },
      select: { systemPrompt: true },
    });
    if (row?.systemPrompt?.trim()) {
      return row.systemPrompt;
    }
  } catch (e) {
    console.warn("[bot-pilot] getBotPilotSystemPrompt fallback:", e);
  }
  return DEFAULT_BOT_PILOT_SYSTEM_PROMPT;
}

export async function setBotPilotSystemPrompt(systemPrompt: string): Promise<void> {
  await prisma.botPilotConfig.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, systemPrompt },
    update: { systemPrompt },
  });
}
