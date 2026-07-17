export const LLM_PROVIDERS = [
  {
    provider: "gemini",
    label: "Google Gemini",
    description: "Gemini 2.5 models through Google AI Studio.",
    models: ["gemini-2.5-flash", "gemini-2.5-pro"],
  },
  {
    provider: "groq",
    label: "Groq",
    description: "Low-latency hosted Llama inference.",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  },
  {
    provider: "openai",
    label: "OpenAI",
    description: "GPT models through the OpenAI API.",
    models: ["gpt-4o", "gpt-4o-mini"],
  },
  {
    provider: "xai",
    label: "xAI",
    description: "Grok reasoning and agentic models.",
    models: ["grok-4.5", "grok-4.3"],
  },
  {
    provider: "deepseek",
    label: "DeepSeek",
    description: "DeepSeek V4 general and reasoning models.",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
  },
  {
    provider: "openrouter",
    label: "OpenRouter",
    description: "One key for routed OpenAI and Anthropic models.",
    models: ["~openai/gpt-latest", "~anthropic/claude-sonnet-latest"],
  },
  {
    provider: "mistral",
    label: "Mistral AI",
    description: "Mistral Large and Small through La Plateforme.",
    models: ["mistral-large-latest", "mistral-small-latest"],
  },
  {
    provider: "together",
    label: "Together AI",
    description: "Hosted Llama and Qwen serverless inference.",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "Qwen/Qwen3-235B-A22B-Instruct-2507-tput",
    ],
  },
  {
    provider: "cerebras",
    label: "Cerebras",
    description: "High-throughput open-model inference.",
    models: ["gpt-oss-120b", "zai-glm-4.7", "gemma-4-31b"],
  },
] as const;

export type LLMProviderId = (typeof LLM_PROVIDERS)[number]["provider"];

export const DEFAULT_LLM_MODEL = LLM_PROVIDERS[0].models[0];
