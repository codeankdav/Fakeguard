import { Router } from "express";
import { db, articlesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { GetRecentAnalysesQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /api/stats/overview
router.get("/overview", async (_req, res) => {
  const rows = await db
    .select({
      verdict: articlesTable.verdict,
      count: sql<number>`count(*)::int`,
      avgConfidence: sql<number>`avg(${articlesTable.confidenceScore})`,
    })
    .from(articlesTable)
    .groupBy(articlesTable.verdict);

  const todayRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articlesTable)
    .where(sql`${articlesTable.analyzedAt} >= now() - interval '24 hours'`);

  let fakeCount = 0;
  let realCount = 0;
  let uncertainCount = 0;
  let totalConfidence = 0;
  let totalCount = 0;

  for (const row of rows) {
    if (row.verdict === "fake") fakeCount = row.count;
    else if (row.verdict === "real") realCount = row.count;
    else uncertainCount = row.count;
    totalConfidence += (row.avgConfidence ?? 0) * row.count;
    totalCount += row.count;
  }

  return res.json({
    totalAnalyzed: totalCount,
    fakeCount,
    realCount,
    uncertainCount,
    avgConfidenceScore: totalCount > 0 ? totalConfidence / totalCount : 0,
    analyzedToday: todayRows[0]?.count ?? 0,
  });
});

// GET /api/stats/recent
router.get("/recent", async (req, res) => {
  const parsed = GetRecentAnalysesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const articles = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      url: articlesTable.url,
      verdict: articlesTable.verdict,
      confidenceScore: articlesTable.confidenceScore,
      analyzedAt: articlesTable.analyzedAt,
    })
    .from(articlesTable)
    .orderBy(desc(articlesTable.analyzedAt))
    .limit(limit);

  return res.json(articles);
});

export default router;
