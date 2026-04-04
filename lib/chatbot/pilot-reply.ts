import type { ChatbotUserContext } from "./user-context";

/**
 * Réponse en 3 phrases : (1) réponse directe avec prénom, (2) action concrète + lien profond /app/…, (3) question de relance.
 */
export function pilotThreePartReply(
  ctx: ChatbotUserContext,
  getS1: (c: ChatbotUserContext) => string,
  s2: string,
  s3: string,
): string {
  const fn = ctx.firstName.trim() || "toi";
  const c = { ...ctx, firstName: fn };
  let s1 = getS1(c).trim();
  if (!s1.endsWith(".")) s1 += ".";

  let s2n = s2.trim();
  if (!s2n.endsWith(".")) s2n += ".";

  let s3n = s3.trim();
  if (!s3n.endsWith("?")) s3n += "?";

  return `${s1} ${s2n} ${s3n}`.replace(/\s+/g, " ").trim();
}
