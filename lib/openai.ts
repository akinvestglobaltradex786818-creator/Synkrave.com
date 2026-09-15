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
You are a system architect AI.
Return ONLY valid JSON.
No explanations, no text outside JSON.
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

  const raw = data.choices?.[0]?.message?.content || "";

  try {
    return JSON.parse(raw);
  } catch (err) {
    // fallback: extract JSON manually
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    return {
      error: "Invalid AI response",
      raw
    };
  }
}
