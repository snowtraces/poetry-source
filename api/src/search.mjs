const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u{20000}-\u{2ffff}]/u;
const WORD_RE = /[\p{L}\p{N}]/u;

export function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .trim();
}

/**
 * Creates whitespace-separated tokens that work with SQLite FTS5 without a
 * language-specific tokenizer. CJK characters are indexed individually and
 * as bigrams; Latin/digit runs stay as whole words.
 */
export function tokenizeSearchText(value) {
  const text = normalizeSearchText(value);
  const tokens = new Set();
  let word = "";
  let previousCjk = "";

  const flushWord = () => {
    if (word) {
      tokens.add(word);
      word = "";
    }
  };

  for (const char of text) {
    if (CJK_RE.test(char)) {
      flushWord();
      tokens.add(char);
      if (previousCjk) tokens.add(previousCjk + char);
      previousCjk = char;
      continue;
    }

    previousCjk = "";
    if (WORD_RE.test(char)) {
      word += char;
    } else {
      flushWord();
    }
  }

  flushWord();
  return [...tokens];
}

export function toSearchText(value) {
  return tokenizeSearchText(value).join(" ");
}

export function toFtsQuery(value) {
  const tokens = tokenizeSearchText(value);
  if (tokens.length === 0) return null;

  return tokens
    .map((token) => `"${token.replaceAll('"', '""')}"`)
    .join(" AND ");
}
