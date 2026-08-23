import { z } from "zod";
import validator from "validator";

const schema = z.object({
  phone: z.string().refine((value) => validator.isMobilePhone(value, "en-IN"), {
    message: "Invalid Indian phone number",
  }),
});

export function parseAndValidatePhone(phone) {
  if (!phone) {
    return false;
  }

  const result = schema.safeParse({
    phone: phone,
  });

  if (result.success) {
    return true;
  }
  return false;
}

export function generateOtp() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}
