import express from "express";
import Redis from "ioredis";
import { connection } from "./db/connection.js";
import { validateUser } from "./validation/user.js";
import User from "./schema/user.js";

const app = express();
app.use(express.json());

await connection();

const redis = new Redis({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

app.post("/user/signup", async (req, res) => {
  try {
    const validateData = validateUser(req.body);

    const user = new User({ ...validateData });
    await user.save();

    res
      .status(200)
      .json({ message: "user can be created successfully", user: user });
    return;
  } catch (error) {
    res.status(400).json({ error: error });
    return;
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const validateData = validateUser(req.body);
    const { email, password } = validateData;

    const user = User.findOne({ email: email });
    if (!user) {
      console.log("user does not exist.");
      res.status(400).json({ message: "invalid credentails" });
      return;
    }

    if (user.password !== password) {
      console.log("password is not valid.");
      res.status(400).json({ message: "invalid credentails" });
      return;
    }

    const resp = await fetch(`/user/${user._id}/json`, {
      method: "POST",
      body: JSON.stringify({ ...user }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status !== 201) {
      throw new Error(`invalid result status: ${result.status}`);
    }

    res.status(200).json({ message: "user loggedin successfully", user: user });
    return;
  } catch (error) {
    res.status(400).json({ error: error });
    return;
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id == "") {
      console.log("id does not exist.");
      res.status(400).json({ message: "invalid id" });
      return;
    }

    // first check in redis and then if not then find in the DB.
    const resp = await fetch(`/user/${user._id}/json`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`invalid result.`);
    }

    let user;
    const redisUser = result.user;
    if (!redisUser) {
      user = User.findOne({ _id: id });
      if (!user) {
        console.log("user does not exist.");
        res.status(400).json({ message: "invalid credentails" });
        return;
      }
    } else {
      res
        .status(200)
        .json({
          message: "get the user successfully from the redis",
          user: redisUser,
        });
      return;
    }

    res.status(200).json({ message: "get the user successfully", user: user });
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
    res.status(400).json({ error: error });
    return;
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
    res.status(400).json({ error: error });
    return;
  }
});

app.post("/user/:id/hash", async (req, res) => {
  try {
    const id = req.params.id;
    const redisData = await redis.hset(`user:${id}:hash`, req.body);
    console.log(redisData);
    res.status(201).json({ message: "User data set as hash" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
    return;
  }
});

app.get("/user/:id/hash", async (req, res) => {
  try {
    const id = req.params.id;
    const redisData = await redis.hgetall(`user:${id}:hash`);
    console.log(redisData);
    res.status(200).json({ message: "User data get as hash", user: redisData });
  } catch (error) {
    console.log(error);
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
