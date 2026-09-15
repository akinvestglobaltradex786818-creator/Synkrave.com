export function safeParseAIResponse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    // fallback: extract JSON from messy response
    const match = raw.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        return null;
      }
    }

    return null;
  }
}
