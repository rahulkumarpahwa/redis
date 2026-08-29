import { z } from "zod";

export const userSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const validateUser = (data) => {
  const result = userSchema.safeParse(data);

  if (!result.success) {
    console.log(result.error);
    return {};
  }

  return result.data;
};
