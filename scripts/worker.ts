import { startQueueWorker } from "@/lib/jobs/queue";

const worker = startQueueWorker();

worker.on("completed", (job) => {
  console.log(`Completed job ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id ?? "unknown"} failed`, error);
});

console.log("Repository analysis worker is listening for jobs.");

