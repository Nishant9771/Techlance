import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;

// 🔥 LOCAL FALLBACK AI
const localAnalyze = (ideaText: string) => {
  const text = ideaText.toLowerCase();

  const keywords = [
    "ai",
    "algorithm",
    "system",
    "architecture",
    "patent",
    "unique",
    "innovation",
  ];

  const isSensitive = keywords.some((k) => text.includes(k));

  return {
    sensitive: isSensitive,
    level: isSensitive ? "HIGH" : "LOW",
    reason: isSensitive
      ? "Contains technical innovation"
      : "Basic idea",
  };
};

export const analyzeIdeaWithGemini = async (ideaText: string) => {
  // 👉 If no API → use local
  if (!client) return localAnalyze(ideaText);

  try {
    const prompt = `
Return ONLY JSON:

{
  "sensitive": true or false,
  "level": "LOW" or "MEDIUM" or "HIGH",
  "reason": "short reason"
}

Idea:
${ideaText}
`;

    const res = await client.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct", // safer model
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.choices[0]?.message?.content || "";
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(clean);
  } catch (err) {
    console.warn("⚠️ NDA API failed → using local AI");
    return localAnalyze(ideaText);
  }
};