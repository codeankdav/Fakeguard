import OpenAI from "openai";

const baseURL =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
  process.env.OPENAI_BASE_URL ||
  "http://localhost:11434/v1";

const apiKey =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  "ollama";

export const openai = new OpenAI({ apiKey, baseURL });
