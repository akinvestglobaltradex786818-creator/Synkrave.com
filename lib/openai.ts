export async function generateWithAI(prompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a strict system generator.

Return ONLY valid JSON.

Must follow EXACT structure:

{
  "app_name": string,
  "entities": array,
  "apis": array,
  "pages": array,
  "user_flows": array
}

Rules:
- No extra text
- No markdown
- No explanation
- No extra keys
- Always return valid JSON
- If unsure, use empty arrays
`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    })
  });

  const data = await response.json();

  const raw = data?.choices?.[0]?.message?.content || "";

  // safe parsing
  try {
    return JSON.parse(raw);
  } catch (err) {
    const match = raw.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return {
          error: "Corrupted JSON",
          raw
        };
      }
    }

    return {
      error: "Invalid AI response",
      raw
    };
  }
}
