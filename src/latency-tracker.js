import fs from "node:fs";
import path from "node:path";

export class StreamingLatencyTracker {
  constructor(id, outputDir = ".") {
    this.id = id;
    this.startTime = null;
    this.firstChunkTime = null;
    this.chunkTimestamps = [];
    this.chunks = [];
    this.decoder = new TextDecoder();
    this.error = null;
    this.errorAt = null;
    this.outputDir = outputDir;
  }

  async trackStream(url, options) {
    try {
      console.log("Sending request", this.id);

      this.startTime = performance.now();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Accept: "text/event-stream",
        },
      });

      if (!response.ok) {
        this.errorAt = performance.now();
        this.error = response.status + ":" + (await response.text());
        return;
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.endTime = performance.now();
          break;
        }

        const timestamp = performance.now();
        this.chunkTimestamps.push(timestamp);

        if (!this.firstChunkTime) {
          this.firstChunkTime = timestamp;
        }

        this.chunks.push(value);
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  getMetrics() {
    const endTime = this.endTime || this.errorAt;

    return {
      error: this.error,
      errorAt: this.errorAt,
      firstChuntAt: this.firstChunkTime,
      timeToFirstChunk: this.firstChunkTime - this.startTime,
      totalTime: endTime - this.startTime,
      chunkCount: this.chunkTimestamps.length,
      averageChunksPerSecond:
        this.chunkTimestamps.length / ((endTime - this.startTime) / 1000),

      // delays between chunks
      interChunkDelays: this.chunkTimestamps
        .slice(1)
        .map((time, i) => time - this.chunkTimestamps[i]),
    };
  }

  async saveMetrics() {
    const metrics = this.getMetrics();
    metrics.content = this.chunks.map((chunk) => this.decoder.decode(chunk));
    await fs.promises.writeFile(
      path.join(this.outputDir, `metrics-${this.id}.json`),
      JSON.stringify(metrics, null, 2),
      "utf-8"
    );
  }
}
