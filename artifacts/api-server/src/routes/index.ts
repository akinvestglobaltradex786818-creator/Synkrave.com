import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { generateHandler } from "../../../../lib/api/generate";

const router: IRouter = Router();

router.use(healthRouter);

// 🔥 YOUR NEW ROUTE
router.post("/generate", generateHandler);

export default router;
