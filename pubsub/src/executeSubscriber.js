import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const subscriberPath = join(__dirname, "subscriber.js");
const subscriberPathArray = [];
subscriberPathArray.push(subscriberPath);

let processWorker = null;

// this will be executed one time only
export const runCommand = async function () {
  processWorker = spawn("node", subscriberPathArray, {
    stdio: "inherit",
  });

  processWorker.on("exit", () => {
    console.log("process subscriber has exit.");
  });

  return processWorker;
};

// todo: create the kill method as well and create the different api to kill the subscriber as well.
