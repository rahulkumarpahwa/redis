import { Worker } from "bullmq";
import { connection } from "./queue.js";

const emailWorker = new Worker(
  "emails-queue",
  async (job) => {
    console.log("processing the email job...", job.id, job.name, job.data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("email job completed...", job.id, job.name, job.data);

    return { success: true };
  },
  {
    connection,
  },
);

emailWorker.on("completed", async (job) => {
  console.log("email job completed...", job.id, job.name, job.data);
  // todo remove from the queue as well and or marked it as completed.
});

emailWorker.on("failed", (job, err) => {
  console.log("email job failed...", job.id, job.name, job.data, err);
  // add in the queue to retry.
});
