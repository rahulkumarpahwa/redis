import { Redis } from "ioredis";

const subscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const emailSubsciber = subscriber.subscribe(
  "email:pubsub:channel",
  async (err) => {
    if (err) {
      console.error("failed to subscribe: ", err.message);
      return;
    }

    console.log("Subscribed successfully!");
  },
);

emailSubsciber.on("message", async (channel, message) => {
  console.log("email recieved on", channel, " : ", message);
});
