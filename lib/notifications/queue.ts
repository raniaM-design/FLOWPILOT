import { Queue } from "bullmq";
import IORedis from "ioredis";

const QUEUE_NAME = "pilotys-notifications";

let sharedConnection: IORedis | null = null;

export function getBullRedisConnection(): IORedis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!sharedConnection) {
    sharedConnection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return sharedConnection;
}

export function getNotificationQueue(): Queue | null {
  const connection = getBullRedisConnection();
  if (!connection) return null;
  return new Queue(QUEUE_NAME, { connection });
}

/**
 * Si `REDIS_URL` et `NOTIFICATIONS_USE_QUEUE=1`, enfile un tick ; sinon retourne false.
 */
export async function enqueueNotificationTick(at: number): Promise<boolean> {
  if (process.env.NOTIFICATIONS_USE_QUEUE !== "1") return false;
  const q = getNotificationQueue();
  if (!q) return false;
  await q.add("tick", { at }, { removeOnComplete: 50 });
  return true;
}

export { QUEUE_NAME };
