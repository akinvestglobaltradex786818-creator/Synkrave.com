import { generateBlueprint } from "../generator/blueprint";
import { TEMPLATES } from "../templates";

export async function generateHandler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, templateId } = req.body;

  let finalPrompt = prompt;

  if (templateId) {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      finalPrompt = template.prompt;
    }
  }

  if (!finalPrompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const result = generateBlueprint(finalPrompt);

  return res.status(200).json(result);
}
