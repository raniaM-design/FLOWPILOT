import { prisma } from "@/lib/db";
import { encryptToken, decryptToken } from "./encryption";

export interface OutlookEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{
    emailAddress: { address: string; name?: string };
    type: string;
  }>;
  organizer?: {
    emailAddress: { address: string; name?: string };
  };
  bodyPreview?: string;
  onlineMeetingUrl?: string;
  webLink?: string;
  isOnlineMeeting?: boolean;
}

/**
 * Récupère le compte Outlook de l'utilisateur depuis la DB
 * Les tokens sont stockés chiffrés, cette fonction retourne les données brutes
 */
export async function getOutlookAccount(userId: string) {
  return await prisma.outlookAccount.findUnique({
    where: { userId },
  });
}

/**
 * Rafraîchit le token d'accès si nécessaire (expire dans moins de 2 minutes)
 * @internal Utiliser getValidMicrosoftAccessToken() à la place
 */
export async function refreshAccessTokenIfNeeded(userId: string): Promise<string> {
  const account = await getOutlookAccount(userId);
  if (!account) {
    throw new Error("Outlook account not found");
  }

  if (!account.refreshToken) {
    throw new Error("Refresh token missing");
  }

  const now = new Date();
  const expiresAt = new Date(account.expiresAt);
  const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);

  // Déchiffrer le refresh token
  let refreshTokenPlain: string;
  try {
    refreshTokenPlain = decryptToken(account.refreshToken);
  } catch (error) {
    console.error(`[outlook] Failed to decrypt refresh token for user ${userId}`);
    throw new Error("Invalid refresh token encryption");
  }

  // Si le token expire dans moins de 2 minutes, on le rafraîchit
  if (expiresAt <= twoMinutesFromNow || !account.accessToken) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[outlook] Refreshing access token for user ${userId} (expires at ${expiresAt.toISOString()})`);
    }

    // Lire les variables d'environnement DANS la fonction (pas au top-level)
    // IMPORTANT: Utiliser le même tenant que dans les autres endpoints ("common" pour comptes pro + personnels)
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
    const scopes = process.env.MICROSOFT_SCOPES || defaultScopes;

    if (!clientId || !clientSecret) {
      throw new Error(`Configuration Microsoft manquante: ${!clientId ? "MICROSOFT_CLIENT_ID" : ""} ${!clientSecret ? "MICROSOFT_CLIENT_SECRET" : ""}`.trim());
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshTokenPlain,
      scope: scopes,
    });

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[outlook] Token refresh failed for user ${userId}: ${response.status}`);
      throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const newExpiresAt = new Date(now.getTime() + data.expires_in * 1000);

    // Chiffrer les nouveaux tokens avant stockage
    const encryptedAccessToken = encryptToken(data.access_token);
    const encryptedRefreshToken = encryptToken(data.refresh_token || refreshTokenPlain);

    // Mettre à jour le compte avec les nouveaux tokens chiffrés
    await prisma.outlookAccount.update({
      where: { userId },
      data: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: newExpiresAt,
        tokenType: data.token_type || "Bearer",
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[outlook] Access token refreshed for user ${userId}, expires at ${newExpiresAt.toISOString()}`);
    }

    return data.access_token;
  }

  // Token encore valide, déchiffrer et retourner
  if (!account.accessToken) {
    throw new Error("Access token missing");
  }

  try {
    return decryptToken(account.accessToken);
  } catch (error) {
    console.error(`[outlook] Failed to decrypt access token for user ${userId}`);
    throw new Error("Invalid access token encryption");
  }
}

/**
 * Retourne un access token Microsoft valide pour l'utilisateur
 * Refresh automatiquement si expiré ou manquant
 * 
 * @param userId ID de l'utilisateur PILOTYS
 * @returns Access token valide (en clair)
 * @throws Error si le compte Outlook n'existe pas ou si le refresh échoue
 */
export async function getValidMicrosoftAccessToken(userId: string): Promise<string> {
  const account = await getOutlookAccount(userId);
  
  if (!account) {
    throw new Error(`Outlook account not found for user ${userId}`);
  }

  if (!account.refreshToken) {
    throw new Error(`Refresh token missing for user ${userId}`);
  }

  const now = new Date();
  const expiresAt = new Date(account.expiresAt);
  const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);

  // Si le token expire dans moins de 2 minutes ou est manquant, on le rafraîchit
  if (expiresAt <= twoMinutesFromNow || !account.accessToken) {
    return await refreshAccessTokenIfNeeded(userId);
  }

  // Token encore valide, déchiffrer et retourner
  try {
    return decryptToken(account.accessToken);
  } catch (error) {
    // Si le déchiffrement échoue, tenter un refresh
    console.error(`[outlook] Failed to decrypt access token for user ${userId}, attempting refresh`);
    return await refreshAccessTokenIfNeeded(userId);
  }
}

/**
 * Récupère les événements Outlook pour un utilisateur dans une plage de dates
 */
export async function fetchOutlookEvents(
  userId: string,
  fromISO: string,
  toISO: string
): Promise<OutlookEvent[]> {
  const accessToken = await getValidMicrosoftAccessToken(userId);

  const graphEndpoint = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(fromISO)}&endDateTime=${encodeURIComponent(toISO)}&$orderby=start/dateTime&$select=id,subject,start,end,attendees,organizer,bodyPreview,onlineMeeting,webLink`;

  if (process.env.NODE_ENV === "development") {
    console.log(`[outlook] Fetching events for user ${userId} from ${fromISO} to ${toISO}`);
  }

  const response = await fetch(graphEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: 'outlook.timezone="Europe/Paris"',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[outlook] Failed to fetch events for user ${userId}: ${response.status}`);
    throw new Error(`Failed to fetch Outlook events: ${response.status} ${error}`);
  }

  const data = await response.json();
  
  if (process.env.NODE_ENV === "development") {
    console.log(`[outlook] Fetched ${data.value?.length || 0} events for user ${userId}`);
  }

  return data.value.map((event: any) => ({
    id: event.id,
    subject: event.subject || "Sans titre",
    start: event.start,
    end: event.end,
    attendees: event.attendees,
    organizer: event.organizer,
    bodyPreview: event.bodyPreview,
    onlineMeetingUrl: event.onlineMeeting?.joinUrl,
    webLink: event.webLink,
    isOnlineMeeting: event.onlineMeeting !== null,
  }));
}

/**
 * Récupère un événement Outlook spécifique par son ID
 */
export async function fetchOutlookEventById(userId: string, eventId: string): Promise<OutlookEvent> {
  const accessToken = await getValidMicrosoftAccessToken(userId);

  const graphEndpoint = `https://graph.microsoft.com/v1.0/me/events/${eventId}?$select=id,subject,start,end,attendees,organizer,bodyPreview,onlineMeeting,webLink`;

  if (process.env.NODE_ENV === "development") {
    console.log(`[outlook] Fetching event ${eventId} for user ${userId}`);
  }

  const response = await fetch(graphEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[outlook] Failed to fetch event ${eventId} for user ${userId}: ${response.status}`);
    throw new Error(`Failed to fetch Outlook event: ${response.status} ${error}`);
  }

  const event = await response.json();
  return {
    id: event.id,
    subject: event.subject || "Sans titre",
    start: event.start,
    end: event.end,
    attendees: event.attendees,
    organizer: event.organizer,
    bodyPreview: event.bodyPreview,
    onlineMeetingUrl: event.onlineMeeting?.joinUrl,
    webLink: event.webLink,
    isOnlineMeeting: event.onlineMeeting !== null,
  };
}

