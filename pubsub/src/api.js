import express from "express";
import { runCommand } from "./executeSubscriber.js";
import { Redis } from "ioredis";

const app = express();
app.use(express.json());

const publisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.get("/health", async (req, res) => {
  try {
    const redisStatus = await publisher.ping();

    res.status(200).json({
      status: "ok",
      redis: redisStatus === "PONG" ? "connected" : "unknown",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      redis: "disconnected",
    });
  }
});

app.post("/emails/publish", async (req, res) => {
  try {
    const job = {
      from: req.body.from,
      to: req.body.to,
      subject: req.body.subject || "No Subject",
      body: req.body.body || "No Content",
      createdAt: new Date().toISOString(),
    };

    const publishedJob = await publisher.publish(
      "email:pubsub:channel",
      JSON.stringify(job),
    );
    res.status(200).json({
      message: "new email notification has been published",
      publishedJob,
    });
    return;
  } catch (error) {
    res.status(400).json({ error });
    return;
  }
});

app.post("/email/start/subscriber", async (req, res) => {
  try {
    runCommand();
    res.status(201).json({ message: "subscriber started" });
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
