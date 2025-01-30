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

- As we increased the concurrency, ollama started to perform _worse_ on TTFT (Time to First Token). vLLM's TTFT for the same experiment was under 0.6 seconds, compared to Ollama's, whose performance started degrading from 5 concurrent requests.

- In best case (i.e no concurrency), Ollama was able to serve at 63 tokens per second, while vLLM was only able to serve at 31-35 tokens per seconds for all levels of concurrency.
