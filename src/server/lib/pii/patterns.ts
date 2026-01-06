// PII Detection Patterns

export const PII_PATTERNS = {
  email: {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    description: 'Email addresses',
  },
  phone: {
    pattern: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
    description: 'Phone numbers (US format)',
  },
  ssn: {
    pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    description: 'Social Security Numbers',
  },
  creditCard: {
    pattern: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,
    description: 'Credit card numbers',
  },
  ipAddress: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    description: 'IP addresses',
  },
};

// Common name patterns (simplified - in production use NLP/ML)
export const NAME_INDICATORS = [
  /\bMr\.?\s/gi,
  /\bMrs\.?\s/gi,
  /\bMs\.?\s/gi,
  /\bDr\.?\s/gi,
  /\bmy name is\s/gi,
  /\bI am\s/gi,
  /\bthis is\s/gi,
  /\bsigned,?\s/gi,
  /\bregards,?\s/gi,
  /\bthanks,?\s/gi,
  /\bsincerely,?\s/gi,
];

// Address patterns (simplified)
export const ADDRESS_INDICATORS = [
  /\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)/gi,
  /\b[A-Z][a-z]+,?\s+[A-Z]{2}\s+\d{5}(-\d{4})?\b/g, // City, ST ZIP
];

// Company name indicators
export const COMPANY_INDICATORS = [
  /\b(Inc|Corp|LLC|Ltd|Co|Company|Corporation|Incorporated|Limited)\b\.?/gi,
];
