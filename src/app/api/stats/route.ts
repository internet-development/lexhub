import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { gte, sql } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

export const revalidate = 60; // Cache the stats for 60 seconds

async function fetchTotalCounts() {
  const [valid, invalid] = await Promise.all([
    db.$count(validLexicons),
    db.$count(invalidLexicons),
  ]);

  return { valid, invalid };
}

async function fetchUniqueNsids() {
  const combinedNsids = union(
    db.select({ nsid: validLexicons.nsid }).from(validLexicons),
    db.select({ nsid: invalidLexicons.nsid }).from(invalidLexicons),
  ).as("combined_nsids");

  const result = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(combinedNsids);

  return result[0].count;
}

async function fetchUniqueRepositories() {
  const combinedRepos = union(
    db.select({ repoDid: validLexicons.repoDid }).from(validLexicons),
    db.select({ repoDid: invalidLexicons.repoDid }).from(invalidLexicons),
  ).as("combined_repos");

  const result = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(combinedRepos);

  return result[0].count;
}

async function fetchRecentActivity() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [valid24h, invalid24h, valid7d, invalid7d] = await Promise.all([
    db.$count(validLexicons, gte(validLexicons.ingestedAt, last24h)),
    db.$count(invalidLexicons, gte(invalidLexicons.ingestedAt, last24h)),
    db.$count(validLexicons, gte(validLexicons.ingestedAt, last7d)),
    db.$count(invalidLexicons, gte(invalidLexicons.ingestedAt, last7d)),
  ]);

  return {
    last24h: {
      valid: valid24h,
      invalid: invalid24h,
      total: valid24h + invalid24h,
    },
    last7d: {
      valid: valid7d,
      invalid: invalid7d,
      total: valid7d + invalid7d,
    },
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
