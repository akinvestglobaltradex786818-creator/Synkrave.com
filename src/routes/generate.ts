import { Router } from "express";
import { generateBlueprint } from "../lib/generator";
import { templates } from "../templates";

const router = Router();

router.post("/generate", (req, res) => {
  const { prompt, type } = req.body;

  let finalPrompt = prompt;

  // template handling (safe)
  if (type && Object.prototype.hasOwnProperty.call(templates, type)) {
    finalPrompt = templates[type as keyof typeof templates];
  }

  // اگر کچھ بھی نہ ملا
  if (!finalPrompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  // generator call
  const result = generateBlueprint(finalPrompt);

  return res.json(result);
});

export default router;
