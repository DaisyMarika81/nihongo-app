/**
 * Migrate old space-aligned Japanese annotations to jp-token format.
 *
 * Detects patterns like:
 *   <p>          Đc yêu mến<br>         にんき<br>         人気</p>
 *
 * And converts to:
 *   <p><span class="jp-token"><span class="vn-meaning">...</span><span class="furigana">...</span><span class="jp-text">...</span></span></p>
 */

function normalizeLine(line: string): string {
  return line.trim().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasSubstantialLeadingWhitespace(line: string): boolean {
  const match = line.match(/^[ \t\u00A0]+/);
  if (!match) return false;
  // At least 2 leading spaces suggests intentional alignment
  return match[0].length >= 2;
}

/**
 * Attempt to parse 3 lines from a <br>-separated paragraph as a Japanese token.
 * Returns the parsed token or null if it doesn't match the pattern.
 */
function tryParseToken(lines: string[]): { text: string; furigana: string; meaning: string } | null {
  if (lines.length !== 3) return null;

  // Check that at least the first line has leading whitespace (old alignment style)
  if (!hasSubstantialLeadingWhitespace(lines[0])) return null;

  const [line1, line2, line3] = lines.map(normalizeLine);
  if (!line1 && !line2 && !line3) return null;

  // Heuristic: meaning (Vietnamese) is usually the longest with no typical Japanese chars
  // Furigana is hiragana-only, text contains kanji.
  // But it's hard to be 100% sure about ordering. Let's try a common pattern:
  // meaning (with spaces) / furigana (hiragana only) / kanji text

  const hasHiraganaOnly = (s: string) => /^[\u3040-\u309F\s]+$/.test(s);
  const hasKanji = (s: string) => /[\u4E00-\u9FFF]/.test(s);

  let meaning: string;
  let furigana: string;
  let text: string;

  // Pattern: line1 = meaning, line2 = furigana, line3 = kanji text
  if (hasHiraganaOnly(line2) && hasKanji(line3)) {
    meaning = line1;
    furigana = line2;
    text = line3;
  }
  // Pattern: line1 = meaning, line2 = kanji text, line3 = furigana
  else if (hasKanji(line2) && hasHiraganaOnly(line3)) {
    meaning = line1;
    text = line2;
    furigana = line3;
  }
  // Pattern: line1 = text, line2 = furigana, line3 = meaning
  else if (hasKanji(line1) && hasHiraganaOnly(line2)) {
    text = line1;
    furigana = line2;
    meaning = line3;
  }
  // Can't determine — skip
  else {
    return null;
  }

  if (!meaning && !furigana && !text) return null;
  return { text, furigana, meaning };
}

/**
 * Convert a single paragraph HTML string into a token if it matches the pattern.
 * Returns the converted HTML or the original if no conversion applies.
 */
function convertParagraph(pHtml: string): string {
  // Split by <br> (case-insensitive, with possible whitespace)
  const lines = pHtml.split(/<br\s*\/?>/i);
  if (lines.length !== 3) return pHtml;

  const token = tryParseToken(lines);
  if (!token) return pHtml;

  // Get the leading whitespace from the first line to preserve indentation
  const leadingMatch = pHtml.match(/^([ \t]*)/);
  const leading = leadingMatch ? leadingMatch[1] : '';

  const escAttr = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `${leading}<span class="jp-token"><span class="vn-meaning">${escAttr(token.meaning)}</span><span class="furigana">${escAttr(token.furigana)}</span><span class="jp-text">${escAttr(token.text)}</span></span>`;
}

/**
 * Migrate old space-aligned annotation blocks in HTML content to jp-token format.
 * Processes content inside <p> tags.
 */
export function migrateAnnotations(html: string): string {
  if (!html) return html;

  // Only process paragraphs that contain <br> (multi-line)
  return html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, inner) => {
    // Only attempt conversion if the paragraph has <br>
    if (!/<br/i.test(inner)) return match;
    return convertParagraph(inner);
  });
}
