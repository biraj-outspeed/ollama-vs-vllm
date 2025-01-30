import fs from "node:fs";

import { StreamingLatencyTracker } from "./latency-tracker.js";
import path from "node:path";

const OUTPUT_DIR = "vLLM-concurrent-1-10-same-prompt-again";
// const OUTPUT_DIR = "ollama-concurrent-1-10-same-prompt";
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const requestsPerTest = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (const num of requestsPerTest) {
  console.log(`Firing ${num} concurrent requests...`);
  await test(num);
}

async function test(numConcurrentRequests) {
  const outputDir = path.join(OUTPUT_DIR, numConcurrentRequests.toString());
  fs.mkdirSync(outputDir, { recursive: true });

  const trackers = [];
  const responseProms = [];

  for (let i = 0; i < numConcurrentRequests; i++) {
    const tracker = new StreamingLatencyTracker(i, outputDir);
    trackers.push(tracker);

    responseProms.push(
      tracker.trackStream(
        // "https://ollama-gcloud-1075661870729.us-central1.run.app/api/chat",
        // "http://localhost:6969/api/chat",
        "https://vllm-llama-3-3b-1075661870729.us-central1.run.app/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // model: "llama3.2",
            model: "meta-llama/Llama-3.2-3B-Instruct", // for vllm
            messages: [{ role: "user", content: "why is the sky blue?" }],
            stream: true, // vllm doesn't stream by default
          }),
        }
      )
    );
  }

  // wait for all responses to settle
  await Promise.allSettled(responseProms);

  // wait for all file saves to settle
  await Promise.allSettled(trackers.map((tracker) => tracker.saveMetrics()));
}
