/**
 * Utility functions for blog article content text extraction and validation
 */

export const extractMeaningfulText = (htmlOrText) => {
  if (!htmlOrText || typeof htmlOrText !== "string") return "";
  return htmlOrText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const validateArticleContent = (content) => {
  const raw = content || "";
  const rawLength = raw.length;

  if (!raw.trim()) {
    return {
      valid: false,
      error: "Article content is required.",
      meaningfulLength: 0,
      rawLength: 0,
    };
  }

  if (rawLength > 20000) {
    return {
      valid: false,
      error: "Article content cannot exceed 20,000 characters.",
      meaningfulLength: extractMeaningfulText(raw).length,
      rawLength,
    };
  }

  const meaningfulText = extractMeaningfulText(raw);
  if (meaningfulText.length < 100) {
    return {
      valid: false,
      error: `Article content must contain at least 100 characters of meaningful text (currently ${meaningfulText.length} character${meaningfulText.length === 1 ? "" : "s"}).`,
      meaningfulLength: meaningfulText.length,
      rawLength,
    };
  }

  return {
    valid: true,
    error: null,
    meaningfulLength: meaningfulText.length,
    rawLength,
  };
};

