import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { validLexicons, invalidLexicons } from "@/db/schema";
import { handleCorsPreFlight, withCors } from "@/util/cors";
import { sql, gte } from "drizzle-orm";

export async function OPTIONS() {
  return handleCorsPreFlight();
}

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
      uniqueNsidsValid,
      uniqueNsidsInvalid,
      uniqueReposValid,
      uniqueReposInvalid,
      valid24h,
      invalid24h,
      valid7d,
      invalid7d,
    ] = await Promise.all([
      // Total counts
      db.select({ count: sql<number>`count(*)` }).from(validLexicons),
      db.select({ count: sql<number>`count(*)` }).from(invalidLexicons),

      // Unique NSIDs
      db
        .select({ count: sql<number>`count(distinct ${validLexicons.nsid})` })
        .from(validLexicons),
      db
        .select({ count: sql<number>`count(distinct ${invalidLexicons.nsid})` })
        .from(invalidLexicons),

      // Unique repositories
      db
        .select({
          count: sql<number>`count(distinct ${validLexicons.repoDid})`,
        })
        .from(validLexicons),
      db
        .select({
          count: sql<number>`count(distinct ${invalidLexicons.repoDid})`,
        })
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

    // Combine unique NSIDs from both tables
    // Note: This is an approximation - some NSIDs may exist in both tables
    const uniqueNsids = Math.max(
      Number(uniqueNsidsValid[0].count),
      Number(uniqueNsidsInvalid[0].count)
    );

    // Combine unique repos from both tables
    const uniqueRepositories = Math.max(
      Number(uniqueReposValid[0].count),
      Number(uniqueReposInvalid[0].count)
    );

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

    return withCors(
      NextResponse.json({
        data: stats,
      })
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return withCors(
      NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to fetch statistics",
          },
        },
        { status: 500 }
      )
    );
  }
}
