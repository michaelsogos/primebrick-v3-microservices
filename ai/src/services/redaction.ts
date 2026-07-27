/**
 * PII redaction — masks sensitive fields in user messages before sending
 * them to a cloud LLM.
 *
 * Activated only when `REDACT_PII=true` is set in the environment (typically
 * only when using a cloud LLM provider like OpenAI/Anthropic). When using a
 * self-hosted LLM (the default), redaction is OFF because the data never
 * leaves the infrastructure.
 *
 * Redacted fields:
 * - Email addresses → [EMAIL]
 * - Phone numbers (E.164 and common formats) → [PHONE]
 * - Credit card numbers (16 digits, optional separators) → [CARD]
 *
 * The redaction is one-way (no restoration). The LLM sees placeholders
 * instead of the real PII. This is intentional — we don't want the LLM to
 * echo back the real PII in its response.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// E.164 (+1234567890) or common formats (+1 234-567-8900, +44 20 7946 0958)
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g;
// 16-digit credit card numbers (Visa/MC/Amex/Discover), with optional separators
const CARD_RE = /\b(?:\d[ -]*?){13,16}\b/g;

/**
 * Check if PII redaction is enabled (REDACT_PII=true env var).
 */
export function isRedactionEnabled(): boolean {
  return process.env.REDACT_PII === "true";
}

/**
 * Redact PII from a text string. Returns the redacted text and a map of
 * placeholders → original values (for potential restoration in the response,
 * though v1 does not restore).
 *
 * @example
 * ```ts
 * const { text, map } = redactPii("Contact admin@primebrick.dev or +1 555-123-4567");
 * // text: "Contact [EMAIL_1] or [PHONE_1]"
 * // map: { "[EMAIL_1]": "admin@primebrick.dev", "[PHONE_1]": "+1 555-123-4567" }
 * ```
 */
export function redactPii(text: string): {
  text: string;
  map: Map<string, string>;
} {
  const map = new Map<string, string>();
  let counters = { email: 0, phone: 0, card: 0 };
  let result = text;

  // Redact emails first (most specific pattern).
  result = result.replace(EMAIL_RE, (match) => {
    counters.email++;
    const placeholder = `[EMAIL_${counters.email}]`;
    map.set(placeholder, match);
    return placeholder;
  });

  // Redact phone numbers.
  result = result.replace(PHONE_RE, (match) => {
    // Skip false positives (e.g. version numbers like "1.2.3.4").
    // A phone number must contain at least 7 digits.
    const digitCount = match.replace(/\D/g, "").length;
    if (digitCount < 7) return match;
    counters.phone++;
    const placeholder = `[PHONE_${counters.phone}]`;
    map.set(placeholder, match);
    return placeholder;
  });

  // Redact credit card numbers.
  result = result.replace(CARD_RE, (match) => {
    const digits = match.replace(/\D/g, "");
    // A credit card number is 13-16 digits and passes a basic Luhn check.
    if (digits.length < 13 || digits.length > 16 || !luhnCheck(digits)) return match;
    counters.card++;
    const placeholder = `[CARD_${counters.card}]`;
    map.set(placeholder, match);
    return placeholder;
  });

  return { text: result, map };
}

/**
 * Luhn algorithm check — validates credit card number checksum.
 */
function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}
