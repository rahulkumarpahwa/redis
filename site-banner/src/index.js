import express from "express";
import Redis from "ioredis";
import { SITE_BANNER_KEY } from "./constants.js";

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

app.post("/banner", async (req, res) => {
  try {
    await redis.set(
      SITE_BANNER_KEY,
      req.body.message || "Welcome to https://rahulkumarpahwa.me!",
    );
    res
      .status(201)
      .json({ success: true, message: "data setted in redis successfully!" });
  } catch (error) {
    console.log(error);
  }
});

app.get("/banner", async (req, res) => {
  try {
    const banner = await redis.get(SITE_BANNER_KEY);
    if (banner) {
      res.status(201).json({ success: true, banner: message });
      return;
    }
    res.status(400).json({ success: false, message: "No Banner Message" });
  } catch (error) {
    console.log(error);
  }
});

app.delete("/banner", async (req, res) => {
  try {
    await redis.del(SITE_BANNER_KEY);
    res
      .status(200)
      .json({ success: true, message: `deleted ${SITE_BANNER_KEY}` });
  } catch (error) {
    console.log(error);
  }
});

app.get("/banner/exists", async (req, res) => {
  try {
    const exists = await redis.exists(SITE_BANNER_KEY);
    res.status(200).json({ exists: Boolean(exists) });  // !!exists is convert to boolean
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT || 5000, async () => {
  console.log("server is listening at http://localhost:5000");
});
