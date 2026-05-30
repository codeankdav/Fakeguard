import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, articlesTable } from "@workspace/db";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  ListArticlesQueryParams,
  AnalyzeArticleBody,
  GetArticleParams,
  DeleteArticleParams,
  ShareArticleParams,
  GetSharedArticleParams,
} from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();
const MAX_ARTICLE_CHARS = 12000;
const FETCH_TIMEOUT_MS = 10000;

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1] ?? text;
  const start = source.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  return null;
}

function normalizeAnalysis(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI analysis did not return a JSON object.");
  }

  const analysis = raw as Record<string, unknown>;
  const verdict = analysis.verdict;
  const confidenceScore = analysis.confidenceScore;
  const explanation = analysis.explanation;

  if (verdict !== "fake" && verdict !== "real" && verdict !== "uncertain") {
    throw new Error("AI analysis returned an invalid verdict.");
  }
  if (typeof confidenceScore !== "number" || confidenceScore < 0 || confidenceScore > 1) {
    throw new Error("AI analysis returned an invalid confidence score.");
  }
  if (typeof explanation !== "string" || explanation.trim() === "") {
    throw new Error("AI analysis returned an invalid explanation.");
  }

  return {
    title: typeof analysis.title === "string" ? analysis.title : undefined,
    verdict,
    confidenceScore,
    explanation,
    evidence: Array.isArray(analysis.evidence) ? analysis.evidence.filter((item) => typeof item === "string") : [],
    redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags.filter((item) => typeof item === "string") : [],
    positiveIndicators: Array.isArray(analysis.positiveIndicators)
      ? analysis.positiveIndicators.filter((item) => typeof item === "string")
      : [],
  };
}

async function fetchArticleText(url: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS article URLs are supported.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Article URL cannot include credentials.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html, text/plain;q=0.9, application/xhtml+xml;q=0.8",
        "user-agent": "FakeGuard/1.0 (+https://fakeguard.local)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Could not fetch article URL (${response.status} ${response.statusText}).`);
    }

    const mediaType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (mediaType && !mediaType.startsWith("text/") && mediaType !== "application/xhtml+xml") {
      throw new Error("The URL did not return readable article text.");
    }

    const body = await response.text();
    const readableText = body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();

    if (readableText.length < 50) {
      throw new Error("Could not extract enough readable text from the URL.");
    }

    return readableText.slice(0, MAX_ARTICLE_CHARS);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Timed out while fetching article URL.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeWithOpenAI(content: string, url?: string, title?: string) {
  const prompt = `You are an expert fact-checker and misinformation analyst. Analyze the following news article for credibility and authenticity.

${title ? `Title: ${title}\n` : ""}${url ? `URL: ${url}\n` : ""}

Article content:
${content}

Provide a detailed analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "verdict": "fake" | "real" | "uncertain",
  "confidenceScore": <number between 0 and 1>,
  "explanation": "<comprehensive explanation of the verdict>",
  "evidence": ["<specific evidence point 1>", "<specific evidence point 2>", ...],
  "redFlags": ["<red flag 1 if any>", ...],
  "positiveIndicators": ["<credibility indicator 1 if any>", ...]
}

Be thorough but objective. Consider:
- Source credibility and domain
- Factual accuracy and verifiability
- Sensationalist language or emotional manipulation
- Logical consistency
- Presence of citations and references
- Author expertise and accountability`;

  const model = process.env.AI_MODEL || "llama3:latest";
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const json = extractJsonObject(raw);
  if (!json) {
    throw new Error("AI analysis did not return valid JSON. Please try again.");
  }

  return normalizeAnalysis(JSON.parse(json));
}

// GET /api/articles
router.get("/", requireAuth, async (req: any, res) => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { verdict, limit = 20, offset = 0 } = parsed.data;

  const conditions = [eq(articlesTable.userId, req.userId)];
  if (verdict) {
    conditions.push(eq(articlesTable.verdict, verdict));
  }

  const articles = await db
    .select()
    .from(articlesTable)
    .where(and(...conditions))
    .orderBy(desc(articlesTable.createdAt))
    .limit(limit ?? 20)
    .offset(offset ?? 0);

  return res.json(articles);
});

// POST /api/articles (analyze)
router.post("/", requireAuth, async (req: any, res) => {
  const parsed = AnalyzeArticleBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { url, content, title } = parsed.data;

  if (!url && !content) {
    return res.status(400).json({ error: "Either url or content is required" });
  }

  let textToAnalyze = content;
  try {
    textToAnalyze = textToAnalyze || (url ? await fetchArticleText(url) : undefined);
  } catch (err: any) {
    return res.status(400).json({
      error: err?.message ?? "Unable to fetch article URL. Try pasting the article text instead.",
    });
  }

  if (!textToAnalyze) {
    return res.status(400).json({ error: "Either url or content is required" });
  }

  let analysis: any;
  try {
    analysis = await analyzeWithOpenAI(textToAnalyze, url ?? undefined, title ?? undefined);
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    if (status === 429) {
      return res.status(429).json({
        error: "OpenAI quota exceeded. Please check your API key billing at platform.openai.com.",
      });
    }
    if (status === 401) {
      return res.status(401).json({
        error: "Invalid OpenAI API key. Please update the OPENAI_API_KEY secret.",
      });
    }
    const message = err?.message ?? "AI analysis failed";
    return res.status(502).json({ error: message });
  }

  const [article] = await db
    .insert(articlesTable)
    .values({
      userId: req.userId,
      title: title ?? analysis.title ?? null,
      url: url ?? null,
      content: content ?? null,
      verdict: analysis.verdict,
      confidenceScore: analysis.confidenceScore,
      explanation: analysis.explanation,
      evidence: analysis.evidence ?? [],
      redFlags: analysis.redFlags ?? [],
      positiveIndicators: analysis.positiveIndicators ?? [],
    })
    .returning();

  return res.status(201).json(article);
});

// GET /api/articles/shared/:shareToken (must be before /:id)
router.get("/shared/:shareToken", async (req, res) => {
  const parsed = GetSharedArticleParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid params" });

  const article = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.shareToken, parsed.data.shareToken))
    .then((rows) => rows[0]);

  if (!article) return res.status(404).json({ error: "Not found" });
  return res.json(article);
});

// GET /api/articles/:id
router.get("/:id", requireAuth, async (req: any, res) => {
  const parsed = GetArticleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const article = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.id, parsed.data.id), eq(articlesTable.userId, req.userId)))
    .then((rows) => rows[0]);

  if (!article) return res.status(404).json({ error: "Not found" });
  return res.json(article);
});

// DELETE /api/articles/:id
router.delete("/:id", requireAuth, async (req: any, res) => {
  const parsed = DeleteArticleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const existing = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.id, parsed.data.id), eq(articlesTable.userId, req.userId)))
    .then((rows) => rows[0]);

  if (!existing) return res.status(404).json({ error: "Not found" });

  await db.delete(articlesTable).where(eq(articlesTable.id, parsed.data.id));
  return res.status(204).send();
});

// POST /api/articles/:id/share
router.post("/:id/share", requireAuth, async (req: any, res) => {
  const parsed = ShareArticleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const article = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.id, parsed.data.id), eq(articlesTable.userId, req.userId)))
    .then((rows) => rows[0]);

  if (!article) return res.status(404).json({ error: "Not found" });

  const shareToken = article.shareToken ?? crypto.randomBytes(12).toString("hex");

  if (!article.shareToken) {
    await db
      .update(articlesTable)
      .set({ shareToken })
      .where(eq(articlesTable.id, parsed.data.id));
  }

  const host = req.get("host") ?? "";
  const proto = req.get("x-forwarded-proto") ?? "https";
  const shareUrl = `${proto}://${host}/shared/${shareToken}`;

  return res.json({ shareToken, shareUrl });
});

export default router;
