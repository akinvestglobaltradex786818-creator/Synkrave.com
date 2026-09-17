import { Router } from "express";
import { templates } from "../lib/template";
import { generateWithAI } from "../lib/openai";

const router = Router();

router.post("/generate", async (req, res) => {
  const { prompt, type } = req.body ?? {};
  const templatePrompt =
    typeof type === "string"
      ? templates[type as keyof typeof templates]
      : undefined;
  const finalPrompt = typeof templatePrompt === "string" ? templatePrompt : prompt;

  if (typeof finalPrompt !== "string" || !finalPrompt.trim()) {
    return res.status(400).json({ error: "Prompt required" });
  }

  try {
    const blueprint = await generateWithAI(finalPrompt.trim());
    return res.status(200).json(blueprint);
  } catch (error) {
    console.error("Blueprint generation failed:", error);
    return res.status(500).json({ error: "Blueprint generation failed" });
  }
});

export default router;
