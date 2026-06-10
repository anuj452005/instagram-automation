export class LeadParserService {
  /**
   * Validates and returns a parsed email address if valid, otherwise null.
   */
  static parseEmail(text: string): string | null {
    if (!text) return null;
    const cleanText = text.trim();
    // Standard email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(cleanText)) {
      return cleanText;
    }
    return null;
  }

  /**
   * Validates and returns a normalized 10-digit Indian phone number if valid, otherwise null.
   * Accepts optional +91 or 0 prefix, and 10 digits starting with [6-9].
   */
  static parseIndianPhone(text: string): string | null {
    if (!text) return null;
    
    // Clean string from whitespace, hyphens, parentheses, etc.
    const cleanText = text.replace(/[\s\-\(\)\+]/g, '');

    // Check if it's a valid Indian mobile number.
    // E.g. 919876543210 or 09876543210 or 9876543210.
    // We expect the core 10 digits to start with 6, 7, 8, or 9.
    const phoneRegex = /^(?:91|0)?([6-9]\d{9})$/;
    const match = cleanText.match(phoneRegex);

    if (match && match[1]) {
      return match[1]; // Return the core 10-digit number
    }

    return null;
  }
}
