# GLINR Task Manager - Ollama Setup Guide

## What is Ollama?

[Ollama](https://ollama.com/) is a local LLM runtime that lets you run powerful language models on your own machine. GLINR uses Ollama to provide **zero-cost** AI-powered summaries and embeddings without relying on cloud APIs.

## Installation

### macOS / Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows
Download from [ollama.com/download](https://ollama.com/download)

## Required Models

GLINR uses two models from Ollama:

1. **llama3.2:3b** - For generating structured summaries (small, fast, efficient)
2. **mxbai-embed-large** - For generating semantic embeddings

### Pull the models
```bash
ollama pull llama3.2:3b
ollama pull mxbai-embed-large
```

## Verify Installation

Check if Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response with your installed models.

## Configuration

GLINR automatically detects Ollama if it's running. To customize:

**config/settings.yml**:
```yaml
ai:
  providers:
    ollama:
      baseUrl: http://localhost:11434
      summaryModel: llama3.2:3b
      embeddingModel: mxbai-embed-large
  defaultSummaryProvider: ollama  # 'ollama', 'openai', or 'auto'
  defaultEmbeddingProvider: ollama
```

### Provider Modes

- **`ollama`**: Always use local Ollama (fails if unavailable)
- **`openai`**: Always use OpenAI (requires API key)
- **`auto`**: Try Ollama first, fallback to OpenAI or pattern-based extraction

## How It Works

When a task completes:

1. **Summary Generation**:
   - If `defaultSummaryProvider` is `ollama` or `auto`, GLINR calls Ollama's `/api/generate` endpoint
   - The LLM analyzes the task output and generates a structured summary
   - Falls back to pattern-based extraction if Ollama is unavailable

2. **Embedding Generation**:
   - When creating a summary, GLINR generates embeddings for semantic search
   - Uses Ollama's `/api/embeddings` endpoint with the configured model
   - Falls back to OpenAI or zero-vector if unavailable

## Cost Savings

Using Ollama vs OpenAI for 1000 tasks:

| Provider | Summary Cost | Embedding Cost | Total |
|----------|--------------|----------------|-------|
| **OpenAI** | ~$2.00 | ~$0.10 | **$2.10** |
| **Ollama** | $0.00 | $0.00 | **$0.00** |

*Electricity costs ~$0.01-0.05 for running Ollama locally*

## Performance

- **Llama 3.2 3B**: ~2-5 seconds per summary (Apple Silicon M1/M2)
- **mxbai-embed-large**: ~0.5-1 second per embedding

## Troubleshooting

### Ollama not detected
```bash
# Check if service is running
ollama list

# Start Ollama service (if not running)
ollama serve
```

### Models not found
```bash
# List installed models
ollama list

# Pull missing models
ollama pull llama3.2:3b
ollama pull mxbai-embed-large
```

### Slow inference
```bash
# Check system resources
top

# Consider using smaller models if needed
ollama pull llama3.2:1b  # Faster but less capable
```

## Advanced: Custom Models

You can use any Ollama-compatible model by updating `settings.yml`:

```yaml
ai:
  providers:
    ollama:
      summaryModel: codellama:7b    # Better for code-heavy tasks
      embeddingModel: nomic-embed-text  # Alternative embedding model
```

## Next Steps

1. Install Ollama
2. Pull required models
3. Restart GLINR: `pnpm dev`
4. Check logs for `[Ollama]` messages confirming it's working

For more info: https://ollama.com/library
