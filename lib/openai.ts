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
Generate a structured JSON blueprint with:
- app_name
- entities
- apis
- pages
- user_flows
Return ONLY JSON.
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

  return JSON.parse(data.choices[0].message.content);
}
