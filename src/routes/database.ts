import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

const router = Router();

router.get("/health/database", async (_req, res) => {
  try {
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
