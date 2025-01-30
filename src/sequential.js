import fs from "fs";
import { StreamingLatencyTracker } from "./latency-tracker.js";

const OUTPUT_DIR = "vLLM-sequential-same-prompt";
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// const diffPrompts = [
//   "why is the sky blue?",
//   "what is the capital of france?",
//   "why does mirrors reflect light?",
//   "why is sun yellow?",
//   "what is the capital of india?",
//   "why is the moon round?",
//   "number of planets in our solar system",
//   "how many moons does jupiter have?",
// ];

const trackers = [];
for (let i = 0; i < 10; i++) {
  const tracker = new StreamingLatencyTracker(i, OUTPUT_DIR);
  trackers.push(tracker);

  await tracker.trackStream(
    // "https://ollama-gcloud-1075661870729.us-central1.run.app/api/chat",
    "https://vllm-llama-3-3b-1075661870729.us-central1.run.app/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // model: "llama3.2", // for ollama
        model: "meta-llama/Llama-3.2-3B-Instruct", // for vllm
        messages: [{ role: "user", content: "why is the sky blue?" }],
        stream: true, // vllm doesn't stream by default it seems
      }),
    }
  );
}

await Promise.all(trackers.map((tracker) => tracker.saveMetrics()));
