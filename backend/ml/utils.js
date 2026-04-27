function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(text) {
  return String(text || '').toLowerCase();
}

function tokenize(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMoney(value, fallback = 0) {
  const match = String(value ?? '').match(/\d+(?:\.\d+)?/g);
  if (!match || match.length === 0) return fallback;
  const nums = match.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  if (nums.length === 0) return fallback;
  return nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
}

function parseDays(value, fallback = 0) {
  const match = String(value ?? '').match(/\d+/);
  if (!match) return fallback;
  const days = Number(match[0]);
  return Number.isFinite(days) ? days : fallback;
}

function average(values, fallback = 0) {
  const nums = values.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  if (nums.length === 0) return fallback;
  return nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
}

function keywordSignal(text, keywords = []) {
  const normalized = normalizeText(text);
  if (!keywords.length) return 0;
  const hits = keywords.filter((keyword) => normalized.includes(String(keyword).toLowerCase())).length;
  return clamp(hits / keywords.length);
}

function jaccardSimilarity(aText, bText) {
  const aSet = new Set(tokenize(aText));
  const bSet = new Set(tokenize(bText));
  if (aSet.size === 0 || bSet.size === 0) return 0;

  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }

  const union = aSet.size + bSet.size - intersection;
  return union > 0 ? clamp(intersection / union) : 0;
}

export {
  average,
  clamp,
  jaccardSimilarity,
  keywordSignal,
  normalizeText,
  parseDays,
  parseMoney,
  toNumber,
  tokenize,
};
