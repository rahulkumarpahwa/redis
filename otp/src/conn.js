import mongoose from "mongoose"


const url =
  process.env.MONGODB_URL || "mongodb://localhost:27018/database_with_redis";

export async function connection() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url);
    }
    console.log({ mongodb: "connected", databse: mongoose.connection.name });
  } catch (error) {
    console.log(error);
  }
}

