/**
 * Worker BullMQ : machine avec REDIS_URL et NOTIFICATIONS_USE_QUEUE=1
 *   npx tsx workers/notification-worker.ts
 */
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_NAME } from "../lib/notifications/queue";
import { runScheduledNotifications } from "../lib/notifications/scheduled-runner";

const url = process.env.REDIS_URL?.trim();
if (!url) {
  console.error("[notification-worker] REDIS_URL manquant");
  process.exit(1);
}

const connection = new IORedis(url, { maxRetriesPerRequest: null });

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name === "tick") {
      const at = typeof job.data?.at === "number" ? job.data.at : Date.now();
      return runScheduledNotifications(new Date(at));
    }
  },
  { connection },
);

worker.on("failed", (job, err) => {
  console.error("[notification-worker] job failed", job?.id, err);
});

worker.on("completed", (job) => {
  console.log("[notification-worker] completed", job.id, job.returnvalue);
});

console.log("[notification-worker] listening on queue", QUEUE_NAME);
