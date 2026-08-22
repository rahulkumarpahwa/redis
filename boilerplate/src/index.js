import express from "express";
import Redis from "ioredis";
import mongoose from "mongoose";

const app = express();

const redis = new Redis({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

app.get("/redis", async (req, res) => {
  const reply = await redis.ping();
  res.status(200).json({ redis: reply });
});

app.get("/mongo", async (req, res) => {
  try {
    const url =
      process.env.MONGODB_URL ||
      "mongodb://localhost:27018/database_with_redis";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url);
    }

    res
      .status(200)
      .json({ mongodb: "connected", databse: mongoose.connection.name });
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT || 5000, async () => {
  console.log("server is listening at http://localhost:5000");
});
