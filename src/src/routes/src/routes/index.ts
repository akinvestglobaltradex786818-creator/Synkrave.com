import { Router } from "express";
import health from "./health";
import generate from "./generate";

const router = Router();

router.use(health);
router.use(generate);

export default router;
