import zod from "zod";

export const userSchema = zod.object({
  email: zod.email().required(),
  password: zod.string().minLength(8).required(),
});

export const validateUser = (data) => {
  const result = userSchema.parse(data);
  if (!result.success) {
    console.log(result.error);
    return {};
  } else {
    return result.data;
  }
};
