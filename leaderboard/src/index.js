import { Redis } from "ioredis";
import express from "express";
import { any } from "zod";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.get("/health", async (req, res) => {
  try {
    const redisStatus = await redis.ping();

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

// webpage 'post' count increment:
app.post("/post/:id/views", async (req, res) => {
  try {
    const { id } = req.params;
    const key = `post:${id}:views`;

    const count = await redis.incr(key);
    res.status(201).json({
      message: `post:${id} count has been increased by ${count}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// get the webpage 'post' count
app.get("/post/:id/views", async (req, res) => {
  try {
    const { id } = req.params;
    const key = `post:${id}:views`;

    const count = await redis.get(key);
    res.status(200).json({
      message: `post:${id} has count of ${count}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// leaderboard

const leaderBoardKey = "leaderboard";

// add points to the user score
app.post("/leaderboard/score", async (req, res) => {
  try {
    const { id, score } = req.body;
    const memberKey = `user:${id}:score`;

    const count = await redis.zincrby(leaderBoardKey, score, memberKey);
    res.status(200).json({
      message: `member ${memberKey} has count of ${count}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// get top 10 leaders (index start from 0)
app.get("/leaderboard", async (req, res) => {
  try {
    const top10Members = await redis.zrevrange(
      leaderBoardKey,
      0,
      9,
      "WITHSCORES",
    );
    res.status(200).json({
      top10Members,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// get rank of user in leaderboard, rank starts from 0 (top)
app.get("/leaderboard/:userId/rank", async (req, res) => {
  try {
    const { userId } = req.params;
    const memberKey = `user:${userId}:score`;
    const userRank = await redis.zrevrank(leaderBoardKey, memberKey);
    res.status(200).json({
      userRank,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

app.use((error, req, res, next) => {
  res.status(500).json({
    message: "internal error",
    status: 500,
    error: error,
    uptime: process.uptime(),
    current_timeStamp: new Date().toISOString(),
  });
  return;
});

app.listen(process.env.PORT || 5000, async () => {
  console.log(
    `Server is listening at http://localhost:${process.env.PORT || 5000}`,
  );
});
