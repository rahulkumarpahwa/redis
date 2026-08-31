export const worker = async () => {
  let running = true;

  process.on("SIGTERM", () => {
    running = false;
  });

  while (running) {
    const job = await redis.rpop(QUEUE_KEY);

    if (!job) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Retrying again!");
      continue;
    }

    if ((await redis.llen(QUEUE_KEY)) == 0) {
      running = false;
    }

    const email = await JSON.parse(job);

    console.log("Processing:", email);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Email sent:", email.to);
  }
};
