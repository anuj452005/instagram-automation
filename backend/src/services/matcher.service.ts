import { env } from '../config/env';

export class MatcherService {
  /**
   * Normalizes comment text or keywords by:
   * 1. Converting to lowercase.
   * 2. Normalizing Unicode characters to NFC form.
   * 3. Stripping emojis, symbols, and punctuation using Unicode property escapes (\p{P} and \p{S}).
   * 4. Collapsing extra whitespace and trimming.
   */
  static normalize(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFC')
      .replace(/[\p{P}\p{S}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Evaluates if a given comment matches a keyword trigger according to its match type.
   */
  static match(
    commentText: string,
    keywordText: string,
    matchType: 'exact' | 'contains' | 'starts_with'
  ): boolean {
    const normalizedComment = this.normalize(commentText);
    const normalizedKeyword = this.normalize(keywordText);

    if (!normalizedComment || !normalizedKeyword) {
      return false;
    }

    switch (matchType) {
      case 'exact':
        return normalizedComment === normalizedKeyword;
      case 'contains':
        return normalizedComment.includes(normalizedKeyword);
      case 'starts_with':
        return normalizedComment.startsWith(normalizedKeyword);
      default:
        return false;
    }
  }
}
