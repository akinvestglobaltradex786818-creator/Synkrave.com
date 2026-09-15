import { Router } from "express";
import { generateWithAI } from "../lib/openai";
import { templates } from "../lib/template";

const router = Router();

router.post("/generate", async (req, res) => {
  const { prompt, type } = req.body;

  let finalPrompt = prompt;

  // template handling
  if (type && Object.prototype.hasOwnProperty.call(templates, type)) {
    finalPrompt = templates[type as keyof typeof templates];
  }

  if (!finalPrompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  try {
    const result = await generateWithAI(finalPrompt);

    if (result.error) {
      return res.status(500).json(result);
    }

    return res.json(result);

  } catch (err) {
    return res.status(500).json({
      error: "AI request failed"
    });
  }
});

export default router;
