import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      validate: (value) => {
        if (!validator.isEmail(value)) {
          throw new Error("invalid email");
        }
        return true;
      },
    },

    password: {
      type: String,
      required: true,
      min: 8,
      validate: (value) => {
        if (!validator.isStrongPassword(value)) {
          throw new Error("invalid credentails");
        }
        return true;
      },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
