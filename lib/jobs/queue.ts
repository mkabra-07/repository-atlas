import { Queue, Worker } from "bullmq";
import Redis from "ioredis";

import { processAnalysisJob } from "@/lib/jobs/run-analysis";

const QUEUE_NAME = "analysis-jobs";

function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

export function getAnalysisQueue() {
  const connection = getRedisConnection();
  if (!connection) {
    return null;
  }

  return new Queue(QUEUE_NAME, { connection });
}

export async function enqueueAnalysisJob(payload: { jobId: string; owner: string; name: string }) {
  const queue = getAnalysisQueue();
  if (!queue) {
    queueMicrotask(() => {
      void processAnalysisJob(payload);
    });
    return;
  }

  await queue.add("analyze-repository", payload, {
    attempts: 2,
    removeOnComplete: 100,
    removeOnFail: 100,
  });
}

export function startQueueWorker() {
  const connection = getRedisConnection();
  if (!connection) {
    throw new Error("REDIS_URL is required to run the dedicated worker.");
  }

  return new Worker(
    QUEUE_NAME,
    async (job) => {
      await processAnalysisJob(job.data as { jobId: string; owner: string; name: string });
    },
    { connection },
  );
}

