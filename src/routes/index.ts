import { Router } from "express";
import health from "./health";
import generate from "./generate";
import database from "./database";

const router = Router();

router.use(health);
router.use(generate);
router.use(database);

export default router;
