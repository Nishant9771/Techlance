import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;

// 🔥 LOCAL SIMILARITY ENGINE
const localSimilarity = (newIdea: string, existingIdeas: string[]) => {
  const newWords = newIdea.toLowerCase().split(" ");

  let maxScore = 0;

  for (const idea of existingIdeas) {
    const words = idea.toLowerCase().split(" ");

    const match = words.filter((w) => newWords.includes(w)).length;
    const score = match / words.length;

    if (score > maxScore) maxScore = score;
  }

  return {
    isDuplicate: maxScore > 0.6,
    similarityScore: Number(maxScore.toFixed(2)),
    reason:
      maxScore > 0.6
        ? "High similarity detected"
        : "No strong similarity",
  };
};

export const checkIdeaSimilarity = async (
  newIdea: string,
  existingIdeas: string[]
) => {
  // 👉 If no API → use local
  if (!client) return localSimilarity(newIdea, existingIdeas);

  try {
    const prompt = `
Return ONLY JSON:

{
  "isDuplicate": true or false,
  "similarityScore": number (0-1),
  "reason": "short reason"
}

New Idea:
${newIdea}

Existing Ideas:
${existingIdeas.join("\n")}
`;

    const res = await client.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.choices[0]?.message?.content || "";
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(clean);
  } catch (err) {
    console.warn("⚠️ Similarity API failed → using local AI");
    return localSimilarity(newIdea, existingIdeas);
  }
};