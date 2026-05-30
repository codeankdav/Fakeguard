import OpenAI from "openai";

const configuredBaseURL =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
  process.env.OPENAI_BASE_URL;

const apiKey =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  "ollama";

const baseURL = configuredBaseURL || (apiKey === "ollama" ? "http://localhost:11434/v1" : undefined);

export const openai = new OpenAI({ apiKey, baseURL });
