import express from "express";
import { emailQueue } from "./queue.js";
import { runCommand } from "./executeWorker.js";

const app = express();
app.use(express.json());

app.post("/emails/bullmq", async (req, res) => {
  try {
    const job = {
      from: req.body.from,
      to: req.body.to,
      subject: req.body.subject || "No Subject",
      body: req.body.body || "No Content",
      createdAt: new Date().toISOString(),
    };

    const queuedJob = await emailQueue.add("email-queue-job", job, {
      removeOnComplete: false,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
        // jitter: 0.5,
      },
    });

    // https://docs.bullmq.io/guide/retrying-failing-jobs
    // https://docs.bullmq.io/api/interfaces/v6.BackoffOptions.html
    // https://docs.bullmq.io/api/interfaces/v6.BaseJobOptions.html

    res
      .status(200)
      .json({ message: "new job is added to the bullmq", queuedJob });
    return;
  } catch (error) {
    res.status(400).json({ error });
    return;
  }
});

app.get("/emails/length", async (req, res) => {
  try {
    const queueLength = await emailQueue.getJobCounts();
    res.status(200).json({
      message: "queue length",
      length: queueLength,
    });
    return;
  } catch (error) {
    res.status(400).json({ error: error });
    return;
  }
});

app.post("/email/start/worker", async (req, res) => {
  try {
    runCommand();
    res.status(201).json({ message: "worker started" });
    return;
  } catch (error) {
    res.status(400).json({ error: error });
    return;
  }
});

app.use((error, req, res, next) => {
  return res.status(500).json({
    status: 500,
    error: error,
  });
});

app.listen(process.env.PORT || 5000, async () => {
  console.log("server is listening at http://localhost:5000");
});
