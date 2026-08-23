import express from "express";
import Redis from "ioredis";
import { connection } from "./conn.js";
import { generateOtp, parseAndValidatePhone } from "./utils.js";
import { updateOtpStatus } from "./DB/updateSchema.js";
import { date } from "zod";

const app = express();
app.use(express.json());

await connection();

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

function getOtpKey(phone) {
  return `otp:${phone}`;
}

app.post("/otp", async (req, res) => {
  try {
    const phone = req.body.phone;
    if (!parseAndValidatePhone(phone)) {
      throw new Error("Invalid Phone Number");
    }

    const otp = generateOtp();

    const otpObj = {
      otp: otp,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(Date.now()),
      lastAttemptAt: null,
      // blockedUntil: new Date(Date.now()),
    };

    // todo : Implement the above obj as value and then apply all the valiations based upon it.

    const redisData = await redis.set(getOtpKey(phone), otp, "EX", 30); // EX -> expiry and here time is 30 seconds
    console.log(redisData);
    res.status(201).json({ message: "OTP sent", otp: otp });
  } catch (error) {
    console.log(error);
  }
});

app.post("/otp/verify", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!parseAndValidatePhone(phone)) {
      throw new Error("Invalid Phone Number");
    }
    const otpKey = getOtpKey(phone);
    const savedOtp = await redis.get(otpKey);
    if (!savedOtp) {
      return res.status(400).json({ message: "OTP expired or Not Found!" });
    } else if (savedOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await updateOtpStatus(phone);

    await redis.del(otpKey);
    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.log(error);
  }
});

app.get("/otp/:phone/ttl", async (req, res) => {
  try {
    const { phone } = req.params;
    if (!parseAndValidatePhone(phone)) {
      throw new Error("Invalid Phone Number");
    }

    const otpKey = getOtpKey(phone);

    const ttl = await redis.ttl(otpKey);
    res.status(200).json({ ttl: ttl });
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT || 5000, async () => {
  console.log("server is listening at http://localhost:5000");
});
