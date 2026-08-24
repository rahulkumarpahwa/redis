import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

app.get("/redis", async (req, res) => {
  try {
    const reply = await redis.ping();
    res.status(200).json({ redis: reply });
  } catch (error) {
    console.log(error);
  }
});

app.post("/user/:id/json", async (req, res) => {
  try {
    const id = req.params.id;
    const redisData = await redis.set(
      `user:${id}:json`,
      JSON.stringify(req.body),
    );
    console.log(redisData);
    res.status(201).json({ message: "User data set as json" });
  } catch (error) {
    console.log(error);
  }
});

app.get("/user/:id/json", async (req, res) => {
  try {
    const { id } = req.params;
    const hashedUser = await redis.get(`user:${id}:json`);
    res.status(200).json({
      success: true,
      user: hashedUser ? JSON.parse(hashedUser) : null,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/user/:id/hash", async (req, res) => {
  try {
    const id = req.params.id;
    const redisData = await redis.hset(`user:${id}:json`, req.body);
    console.log(redisData);
    res.status(201).json({ message: "User data set as hash" });
  } catch (error) {
    console.log(error);
  }
});

app.get("/user/:id/hash", async (req, res) => {
  try {
    const id = req.params.id;
    const redisData = await redis.hgetall(`user:${id}:json`);
    console.log(redisData);
    res
      .status(200)
      .json({ message: "User data get as hash", user: hashedUser });
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
