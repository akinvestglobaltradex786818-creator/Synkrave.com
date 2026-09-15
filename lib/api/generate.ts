import { generateBlueprint } from "../generator/blueprint";
import { BlueprintSchema } from "../api-zod/blueprint.schema";

export async function generateHandler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const result = generateBlueprint(prompt);

    // ✅ validation apply
    const validated = BlueprintSchema.parse(result);

    return res.status(200).json(validated);

  } catch (error: any) {
    return res.status(500).json({
      error: "Invalid blueprint generated",
      details: error.message,
    });
  }
}
