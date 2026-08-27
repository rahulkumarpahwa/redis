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
      message: `${value} is not a valid email`,
    },

    password: {
      type: String,
      required: true,
      min: 8,
      validate: (value) => {
        if (!validator.isStrongPassword(value)) {
          throw new Error("invalid credentails");
        }
        return false;
      },
    },
  },
  { timestamps: true },
);

export default User = mongoose.Model("User", userSchema);
