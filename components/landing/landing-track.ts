/**
 * Helper pour tracker les événements CTA sur la landing.
 * TODO: Brancher sur @vercel/analytics ou système analytics existant si souhaité.
 */
export function trackLandingEvent(eventName: string, properties?: Record<string, string>) {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[Landing] Event:", eventName, properties ?? {});
  }
}
