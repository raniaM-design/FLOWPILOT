import { cookies } from "next/headers";
import { verifySessionToken } from "./jwt";
import { COOKIE_NAME } from "./session";

/**
 * Get the current user ID from the session cookie
 * Returns the user ID if valid, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Version "strict" : redirige vers /login si l'utilisateur n'est pas connecté
 * Utile dans les pages Server Components
 */
export async function getCurrentUserIdOrThrow(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  return userId;
}
