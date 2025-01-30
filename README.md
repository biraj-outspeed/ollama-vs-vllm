# Ollama VS vLLM: Google Cloud Run

I've deployed Llama3.2 3B using both Ollama and vLLM on Google Cloud Run.

I've run the following experiments:

- **Sequential, one Cold-start**: 10 sequential requests when the _zero_ container instances are running
- **Concurrent, Cold-start**: 10 concurrent requests when the _zero_ container instances are running
- **Concurrent, Warm**: 10 concurrent requests when the _one_ container instance is running
- **Batched concurrent, Warm**: 10 batched concurrent requests, from 1 to 10, when the _one_ container instance is running

## Data

Data was collected using the code in `src/` directory. [`src/latency-tracker.js`](src/latency-tracker.js) was used by sequential and concurrent drivers to collect the data. Then it was processed and stats were calculated using the code in [`src/stats.js`](src/stats.js).

The data is available in the `data` directory.

## Analysis

Analysis is available at [`data/analysis.ipynb`](data/analysis.ipynb).

## Observation

- Cold-start latency is higher in vLLM than Ollama, but once it's up and running, TTFT is lower in vLLM.

- As we increased the concurrency, ollama started to perform _worse_ on TTFT (Time to First Token). vLLM's TTFT for the same experiment was under 0.6 seconds, compared to Ollama's, whose performance started degrading from 5 concurrent requests.

- In best case (i.e no concurrency), Ollama was able to serve at 63 tokens per second, while vLLM was only able to serve at 31-35 tokens per seconds for all levels of concurrency.

## Unknowns & Questions to explore

- We have to understand how these inference engines are utilizing the GPUs. If they are under utilizing, then we can expect to see a higher latency.

- I got error deploying with vLLM on both Google Cloud Run and when I did it on EC2. The error was about max sequence length exceeding GPU memory.

```
ValueError: The model's max seq len (131072) is larger than the maximum number of tokens that can be stored in KV cache (117328). Try increasing `gpu_memory_utilization` or decreasing `max_model_len` when initializing the engine.
```

- I decreased max_model_len to 8192. Also note that vLLM by default uses 0.9 of the GPU memory. The same is unknown to me for Ollama.

## Next steps

Optimize the shit out of vLLM. I am not sure about going with Ollama. I am biased towards vLLM.

And I read about run.ai's Model Streamer. Their benchmarks are impressive. [Here they are.](https://github.com/run-ai/runai-model-streamer/blob/master/docs/src/benchmarks.md). It is supported by vLLM.

There's also [tensorizer](https://github.com/coreweave/tensorizer).
