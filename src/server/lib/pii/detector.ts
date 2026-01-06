import { PII_PATTERNS, NAME_INDICATORS, ADDRESS_INDICATORS, COMPANY_INDICATORS } from './patterns';

export interface PiiMatch {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface PiiDetectionResult {
  matches: PiiMatch[];
  counts: Record<string, number>;
}

export function detectPii(text: string): PiiDetectionResult {
  const matches: PiiMatch[] = [];
  const counts: Record<string, number> = {
    emails: 0,
    phones: 0,
    names: 0,
    addresses: 0,
    companies: 0,
  };

  // Detect emails
  const emailPattern = PII_PATTERNS.email.pattern;
  emailPattern.lastIndex = 0;
  let match;
  while ((match = emailPattern.exec(text)) !== null) {
    matches.push({
      type: 'email',
      value: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
    counts.emails++;
  }

  // Detect phone numbers
  const phonePattern = PII_PATTERNS.phone.pattern;
  phonePattern.lastIndex = 0;
  while ((match = phonePattern.exec(text)) !== null) {
    // Filter out dates that might match
    const value = match[0].replace(/\D/g, '');
    if (value.length >= 10) {
      matches.push({
        type: 'phone',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
      counts.phones++;
    }
  }

  // Detect potential names (simplified - checks for name indicators)
  for (const indicator of NAME_INDICATORS) {
    indicator.lastIndex = 0;
    while ((match = indicator.exec(text)) !== null) {
      // Look for words following the indicator
      const afterIndicator = text.slice(match.index + match[0].length);
      const nameMatch = afterIndicator.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (nameMatch) {
        const fullMatch = match[0] + nameMatch[1];
        matches.push({
          type: 'name',
          value: fullMatch,
          start: match.index,
          end: match.index + fullMatch.length,
        });
        counts.names++;
      }
    }
  }

  // Detect addresses
  for (const pattern of ADDRESS_INDICATORS) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        type: 'address',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
      counts.addresses++;
    }
  }

  // Detect company names
  for (const pattern of COMPANY_INDICATORS) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      // Look for words before the suffix
      const beforeSuffix = text.slice(0, match.index);
      const companyMatch = beforeSuffix.match(/([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\s*$/);
      if (companyMatch) {
        const fullMatch = companyMatch[1] + ' ' + match[0];
        const start = match.index - companyMatch[1].length - 1;
        matches.push({
          type: 'company',
          value: fullMatch.trim(),
          start: start >= 0 ? start : match.index,
          end: match.index + match[0].length,
        });
        counts.companies++;
      }
    }
  }

  // Sort by start position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep first)
  const filteredMatches: PiiMatch[] = [];
  for (const m of matches) {
    const overlaps = filteredMatches.some(
      (existing) => m.start < existing.end && m.end > existing.start
    );
    if (!overlaps) {
      filteredMatches.push(m);
    }
  }

  return { matches: filteredMatches, counts };
}

export function detectCustomPattern(
  text: string,
  pattern: string
): Array<{ value: string; start: number; end: number }> {
  try {
    const regex = new RegExp(pattern, 'g');
    const matches: Array<{ value: string; start: number; end: number }> = [];

    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return matches;
  } catch (error) {
    throw new Error(`Invalid regex pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
