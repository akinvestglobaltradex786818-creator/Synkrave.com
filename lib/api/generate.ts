import { generateBlueprint } from "../generator/blueprint";

export async function generateHandler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const result = generateBlueprint(prompt);

  return res.status(200).json(result);
}
