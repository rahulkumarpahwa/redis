import express from "express";
import Redis from "ioredis";
import { connection } from "./db/connection.js";
import { validateUser } from "./validation/user.js";
import { User } from "./schema/user.js";

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

    const user = await User.findOne({ email: email });
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

    const obj = user.toObject();

    const resp = await fetch(
      `http://localhost:5000/user/${obj._id.toString()}/json`,
      {
        method: "POST",
        body: JSON.stringify({ ...user.toObject() }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!resp.ok) {
      throw new Error(`Error in Redis`);
    }

    const result = await resp.json();
    if (!result) {
      throw new Error(`invalid result`);
    }

    res.status(200).json({ message: "user loggedin successfully", user: user });
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id == "") {
      console.log("id does not exist.");
      res.status(400).json({ message: "invalid id" });
      return;
    }

    // first check in redis and then if not then find in the DB.
    const resp = await fetch(`http://localhost:5000/user/${id}/json`);

    if (!resp.ok) {
      throw new Error(`Request failed: ${resp.status} ${resp.statusText}`);
    }

    const result = await resp.json();

    if (!result.success) {
      throw new Error("Invalid result returned from server");
    }


    let user;
    const redisUser = result.user;
    if (!redisUser) {
      user = await User.findOne({ _id: id });
      if (!user) {
        console.log("user does not exist.");
        res.status(400).json({ message: "invalid credentails" });
        return;
      }
    } else {
      res.status(200).json({
        message: "get the user successfully from the redis",
        user: redisUser,
      });
      return;
    }

    res
      .status(200)
      .json({ message: "get the user successfully from DB", user: user });
    return;
  } catch (err) {
    res.status(400).json({ error: err });
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
    console.log(req.body);
    const redisData = await redis.set(
      `user:${id}:json`,
      JSON.stringify(req.body),
    );
    console.log("POST JSON USER IN REDIS", redisData);
    res.status(201).json({ message: "User data set as json" });
    return;
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
    console.log("hashed user", hashedUser);
    res.status(200).json({
      success: true,
      user: hashedUser ? JSON.parse(hashedUser) : null,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
    return;
  }
});

app.delete("/user/:id/json", async (req, res) => {
  try {
    const { id } = req.params;
    const redisData = await redis.del(`user:${id}:json`);
    res.status(200).json({ message: "User data deleted", user: redisData });
    return;
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
