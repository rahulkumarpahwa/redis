import util from "util";
import { exec, spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const asyncExec = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workerPath = join(__dirname, "worker.js");
const workerPathArray = [];
workerPathArray.push(workerPath);

let processWorker = null;

// this will be executed one time only
export const runCommand = async function () {
  if (processWorker) {
    throw new Error("worker is already working.");
  }

  processWorker = spawn("node", workerPathArray, {
    stdio: "inherit",
  });

  processWorker.on("exit", () => {
    console.log("process worker has exit.");
  });

  return processWorker;
};


// todo: create the kill method as well and create the different api to kill the worker as well.