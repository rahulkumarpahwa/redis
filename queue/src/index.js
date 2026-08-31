import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const QUEUE_KEY = "email:queue:key";

app.post("/emails", async (req, res) => {
  try {
    const job = {
      from: req.body.from,
      to: req.body.to,
      subject: req.body.subject || "No Subject",
      body: req.body.body || "No Content",
      createdAt: new Date().toISOString,
    };

    await redis.lpush(QUEUE_KEY, JSON.stringify(job));

    res.status(200).json({ message: "new job is added to the queue", job });
    return;
  } catch (error) {
    res.status(400).json({ error });
    return;
  }
});

app.get("/emails/length", async (req, res) => {
  try {
    const queueLength = await redis.llen(QUEUE_KEY);
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

app.get("/emails/process/one", async (req, res) => {
  try {
    const job = await redis.rpop(QUEUE_KEY);

    if (!job) {
      throw new Error("no jobs left in queue.");
    }

    const jobObj = await JSON.parse(job);

    console.log(jobObj);

    res.status(200).json({
      message: "email sent",
      email: jobObj,
    });
    return;
  } catch (error) {
    res.status(400).json({ error: error });
    return;
  }
});

app.get("/emails", async (req, res) => {
  try {
    const jobs = await redis.lrange(QUEUE_KEY, 0, -1);

    if (!jobs) {
      throw new Error("no jobs left in queue.");
    }

    const emails = jobs.map((job) => JSON.parse(job));

    res.status(200).json({
      message: "emails in the queue",
      emails,
      length: emails.length,
    });
    return;
  } catch (error) {
    res.status(400).json({ error: error });
    return;
  }
});

app.get("/redis", async (req, res) => {
  try {
    const reply = await redis.ping();
    res.status(200).json({ redis: reply });
  } catch (error) {
    console.log(error);
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
