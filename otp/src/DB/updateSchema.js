import { Otp } from "./otpSchema.js";

export async function updateOtpStatus(phone) {
  return Otp.findOneAndUpdate(
    { phone },
    { $set: { isOtpVerified: true } },
    { upsert: true, returnDocument: "after" },
  );
}
