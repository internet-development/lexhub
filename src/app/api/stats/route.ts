import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { sql, gte } from "drizzle-orm";

export const revalidate = 60; // Cache the stats for 60 seconds

function countUniqueAcrossTables<T>(
  validRows: T[],
  invalidRows: T[],
  key: keyof T,
): number {
  const allValues = new Set([
    ...validRows.map((row) => row[key]),
    ...invalidRows.map((row) => row[key]),
  ]);
  return allValues.size;
}

async function fetchTotalCounts() {
  const [validCount, invalidCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(validLexicons),
    db.select({ count: sql<number>`count(*)` }).from(invalidLexicons),
  ]);

  return {
    valid: Number(validCount[0].count),
    invalid: Number(invalidCount[0].count),
  };
}

async function fetchUniqueNsids() {
  const [validNsids, invalidNsids] = await Promise.all([
    db.selectDistinct({ nsid: validLexicons.nsid }).from(validLexicons),
    db.selectDistinct({ nsid: invalidLexicons.nsid }).from(invalidLexicons),
  ]);

  return countUniqueAcrossTables(validNsids, invalidNsids, "nsid");
}

async function fetchUniqueRepositories() {
  const [validRepos, invalidRepos] = await Promise.all([
    db.selectDistinct({ repoDid: validLexicons.repoDid }).from(validLexicons),
    db
      .selectDistinct({ repoDid: invalidLexicons.repoDid })
      .from(invalidLexicons),
  ]);

  return countUniqueAcrossTables(validRepos, invalidRepos, "repoDid");
}

async function fetchRecentActivity() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [valid24h, invalid24h, valid7d, invalid7d] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(validLexicons)
      .where(gte(validLexicons.ingestedAt, last24h)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(invalidLexicons)
      .where(gte(invalidLexicons.ingestedAt, last24h)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(validLexicons)
      .where(gte(validLexicons.ingestedAt, last7d)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(invalidLexicons)
      .where(gte(invalidLexicons.ingestedAt, last7d)),
  ]);

  return {
    last24h: Number(valid24h[0].count) + Number(invalid24h[0].count),
    last7d: Number(valid7d[0].count) + Number(invalid7d[0].count),
  };
}

export async function GET() {
  try {
    const [totalCounts, uniqueNsids, uniqueRepositories, recentActivity] =
      await Promise.all([
        fetchTotalCounts(),
        fetchUniqueNsids(),
        fetchUniqueRepositories(),
        fetchRecentActivity(),
      ]);

    const stats = {
      totalLexicons: totalCounts.valid + totalCounts.invalid,
      validLexicons: totalCounts.valid,
      invalidLexicons: totalCounts.invalid,
      uniqueNsids,
      uniqueRepositories,
      recentActivity,
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
