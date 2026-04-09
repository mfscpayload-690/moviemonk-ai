let groqKeyIndex = 0;

export function getGroqKeys(): string[] {
  const keys = [process.env.GROQ_API_KEY, process.env.VIBE_SEARCH_API_KEY]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(keys));
}

export function pickGroqKey(): string | null {
  const keys = getGroqKeys();
  if (keys.length === 0) return null;
  const selected = keys[groqKeyIndex % keys.length];
  groqKeyIndex = (groqKeyIndex + 1) % keys.length;
  return selected;
}