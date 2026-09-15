import { safeParseAIResponse } from "./safeParse";
import { validateBlueprint } from "./validate";

export async function generateWithAI(prompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
You are a strict system generator.

Return ONLY valid JSON:

{
  "app_name": string,
  "entities": [],
  "apis": [],
  "pages": [],
  "user_flows": []
}

No text. No markdown. No extra keys.
`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || "";

  const parsed = safeParseAIResponse(raw);

  if (!parsed) {
    return {
      error: "Invalid AI response",
      raw
    };
  }

  return validateBlueprint(parsed);
}
