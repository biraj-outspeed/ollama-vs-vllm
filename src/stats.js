import fs, { promises as fsProm } from "fs";

import path, { join } from "path";

const BASE_DIR = "data";
const OLLAMA_BASE_DIR = path.join(BASE_DIR, "ollama");
const VLLM_BASE_DIR = path.join(BASE_DIR, "vllm");

const BATCHED_DIR_NAME = "batched-concurrent-1-10-same-prompt-warm";

const sources = {
  [path.join(OLLAMA_BASE_DIR, BATCHED_DIR_NAME)]: fs.readdirSync(
    path.join(OLLAMA_BASE_DIR, BATCHED_DIR_NAME)
  ),

  [path.join(VLLM_BASE_DIR, BATCHED_DIR_NAME)]: fs.readdirSync(
    path.join(VLLM_BASE_DIR, BATCHED_DIR_NAME)
  ),

  [OLLAMA_BASE_DIR]: fs
    .readdirSync(OLLAMA_BASE_DIR)
    .filter((dir) => dir !== BATCHED_DIR_NAME),

  [VLLM_BASE_DIR]: fs
    .readdirSync(VLLM_BASE_DIR)
    .filter((dir) => dir !== BATCHED_DIR_NAME),
};

async function analyzeMetrics(baseDir, subDirs) {
  const results = {};

  for (const folder of subDirs) {
    const folderPath = join(baseDir, folder);

    if (!fs.statSync(folderPath).isDirectory()) {
      console.log(`${folderPath} not a directory. skipping.`);
      continue;
    }

    const files = await fsProm.readdir(folderPath);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const metrics = {
      timeToFirstChunk: [],
      totalTime: [],
      chunkCount: [],
      averageChunksPerSecond: [],
    };

    // Read and collect metrics from each JSON file
    for (const file of jsonFiles) {
      const filePath = join(folderPath, file);
      const content = await fsProm.readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      metrics.timeToFirstChunk.push(data.timeToFirstChunk);
      metrics.totalTime.push(data.totalTime);
      metrics.chunkCount.push(data.chunkCount);
      metrics.averageChunksPerSecond.push(data.averageChunksPerSecond);
    }

    // Calculate statistics for this folder
    results[folder] = {
      timeToFirstChunk: calculateStats(metrics.timeToFirstChunk),
      totalTime: calculateStats(metrics.totalTime),
      chunkCount: calculateStats(metrics.chunkCount),
      averageChunksPerSecond: calculateStats(metrics.averageChunksPerSecond),
    };
  }

  return results;
}

function calculateStats(numbers) {
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const average = numbers.reduce((a, b) => a + b, 0) / numbers.length;

  // Calculate percentiles
  const p50 = calculatePercentile(numbers, 50);
  const p75 = calculatePercentile(numbers, 75);
  const p95 = calculatePercentile(numbers, 95);
  const p99 = calculatePercentile(numbers, 99);
  const p100 = calculatePercentile(numbers, 100); // This will be same as max

  return {
    min,
    max,
    average,
    p50,
    p75,
    p95,
    p99,
    p100,
  };
}

function calculatePercentile(numbers, percentile) {
  // sort the numbers in ascending order
  const sorted = [...numbers].sort((a, b) => a - b);

  // calculate the percentile index
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper === lower) return sorted[index];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

for (const baseDir in sources) {
  const results = await analyzeMetrics(baseDir, sources[baseDir]);

  const dest = join(baseDir, "stats.json");

  // Write results to a JSON file
  await fsProm.writeFile(dest, JSON.stringify(results, null, 2));

  console.log(`Analysis complete! Results written to ${dest}`);
}
