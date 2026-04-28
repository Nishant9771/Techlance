import * as crypto from "crypto";

interface ProtectionInput {
  ideaText: string;
}

interface ProtectionOutput {
  basic: string;
  full: string;
  hash: string;
  timestamp: number;
  locked: boolean;
}

// 🔒 MAIN FUNCTION
export const protectIdea = (input: ProtectionInput): ProtectionOutput => {
  const { ideaText } = input;

  // STEP 1: Create preview (basic idea)
  const basic = generatePreview(ideaText);

  // STEP 2: Full idea (locked content)
  const full = ideaText;

  // STEP 3: Generate hash (proof of ownership)
  const hash = crypto.createHash("sha256").update(ideaText).digest("hex");

  // STEP 4: Timestamp
  const timestamp = Date.now();

  return {
    basic,
    full,
    hash,
    timestamp,
    locked: true,
  };
};


// 🧠 PREVIEW GENERATOR
const generatePreview = (text: string): string => {
  if (text.length <= 120) return text;

  return text.substring(0, 120) + "...";
};