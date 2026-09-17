import { safeParseAIResponse } from "./safeParse";
import { validateBlueprint, type Blueprint } from "./Validate";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const BLUEPRINT_SYSTEM_PROMPT = `You are a strict schema and blueprint generator.

Return ONLY one valid JSON object with exactly these top-level keys:
{
  "app_name": string,
  "entities": [],
  "apis": [],
  "pages": [],
  "user_flows": []
}

Do not return HTML, CSS, JavaScript, markdown, prose, or any other top-level keys.
Each entity should describe a data model, each API should describe an endpoint,
each page should describe a product surface, and each user_flow should describe
a user journey. Keep the response deterministic, complete, and machine-readable.`;

export async function generateWithAI(prompt: string): Promise<Blueprint> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: BLUEPRINT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const parsed = safeParseAIResponse(raw);

  if (!parsed) {
    throw new Error("OpenAI returned invalid JSON");
  }

  return validateBlueprint(parsed);
}
