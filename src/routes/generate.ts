import { Router } from "express";
import { generateWithAI } from "../lib/openai";
import { templates } from "../lib/template";
import { normalizeResponse } from "../lib/normalize";

const router = Router();

router.post("/generate", async (req, res) => {
  const { prompt, type } = req.body || {};

  let finalPrompt = "";

  if (type && templates[type as keyof typeof templates]) {
    finalPrompt = templates[type as keyof typeof templates];
  } else if (prompt) {
    finalPrompt = prompt;
  }

  if (!finalPrompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  try {
    const result = await generateWithAI(finalPrompt);

    return res.json(normalizeResponse(result));

  } catch {
    return res.status(500).json({
      error: "AI request failed"
    });
  }
});

export default router;
