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

Return ONLY valid JSON.

Exact format:

{
  "app_name": "",
  "entities": [],
  "apis": [],
  "pages": [],
  "user_flows": []
}

Rules:
- No text outside JSON
- No markdown
- No extra keys
- If unsure return empty arrays
`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    return {
      error: "OpenAI API failed",
      status: response.status
    };
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(raw);
  } catch {
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
