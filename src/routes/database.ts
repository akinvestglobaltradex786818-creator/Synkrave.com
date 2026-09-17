import { Router } from "express";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/health/database", async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      throw new Error("DATABASE_URL is not configured");
    }

    const { db } = await import("@workspace/db");
    await db.execute(sql`SELECT 1`);

    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return res.status(500).json({
      status: "error",
      database: "unavailable",
    });
  }
});

export default router;
