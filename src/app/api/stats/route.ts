import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { sql, gte } from "drizzle-orm";

// Revalidate cache every 60 seconds
export const revalidate = 60;

export async function GET() {
  try {
    // Calculate timestamps for recent activity
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      validCount,
      invalidCount,
      validNsids,
      invalidNsids,
      validRepos,
      invalidRepos,
      valid24h,
      invalid24h,
      valid7d,
      invalid7d,
    ] = await Promise.all([
      // Total counts
      db.select({ count: sql<number>`count(*)` }).from(validLexicons),
      db.select({ count: sql<number>`count(*)` }).from(invalidLexicons),

      // Get all distinct NSIDs from both tables
      db.selectDistinct({ nsid: validLexicons.nsid }).from(validLexicons),
      db.selectDistinct({ nsid: invalidLexicons.nsid }).from(invalidLexicons),

      // Get all distinct repositories from both tables
      db.selectDistinct({ repoDid: validLexicons.repoDid }).from(validLexicons),
      db
        .selectDistinct({ repoDid: invalidLexicons.repoDid })
        .from(invalidLexicons),

      // Last 24h activity
      db
        .select({ count: sql<number>`count(*)` })
        .from(validLexicons)
        .where(gte(validLexicons.ingestedAt, last24h)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(invalidLexicons)
        .where(gte(invalidLexicons.ingestedAt, last24h)),

      // Last 7d activity
      db
        .select({ count: sql<number>`count(*)` })
        .from(validLexicons)
        .where(gte(validLexicons.ingestedAt, last7d)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(invalidLexicons)
        .where(gte(invalidLexicons.ingestedAt, last7d)),
    ]);

    const validLexiconsCount = Number(validCount[0].count);
    const invalidLexiconsCount = Number(invalidCount[0].count);

    // Calculate truly unique NSIDs across both tables using a Set
    const allNsids = new Set([
      ...validNsids.map((row) => row.nsid),
      ...invalidNsids.map((row) => row.nsid),
    ]);
    const uniqueNsids = allNsids.size;

    // Calculate truly unique repositories across both tables using a Set
    const allRepos = new Set([
      ...validRepos.map((row) => row.repoDid),
      ...invalidRepos.map((row) => row.repoDid),
    ]);
    const uniqueRepositories = allRepos.size;

    const stats = {
      totalLexicons: validLexiconsCount + invalidLexiconsCount,
      validLexicons: validLexiconsCount,
      invalidLexicons: invalidLexiconsCount,
      uniqueNsids,
      uniqueRepositories,
      recentActivity: {
        last24h: Number(valid24h[0].count) + Number(invalid24h[0].count),
        last7d: Number(valid7d[0].count) + Number(invalid7d[0].count),
      },
    };

    return Response.json({
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch statistics",
        },
      },
      { status: 500 },
    );
  }
}
