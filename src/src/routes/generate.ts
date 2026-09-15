import { Router } from "express";

const router = Router();

router.post("/generate", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  return res.json({
    app_name: "Demo App",
    description: `Generated from: ${prompt}`
  });
});

export default router;
