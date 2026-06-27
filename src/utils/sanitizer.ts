import { PIIEntity, SanitizationResult, PIIRedactionRule } from "../types";

export const DEFAULT_RULES: PIIRedactionRule[] = [
  {
    id: "r-email",
    name: "Email Addresses",
    description: "Detects standard email address formats (e.g. john@example.com)",
    enabled: true,
    type: "email",
    placeholder: "[EMAIL_{N}]"
  },
  {
    id: "r-phone",
    name: "Phone Numbers",
    description: "Detects various domestic and international phone formats",
    enabled: true,
    type: "phone",
    placeholder: "[PHONE_{N}]"
  },
  {
    id: "r-creditCard",
    name: "Credit Cards",
    description: "Detects standard 16-digit credit card sequences",
    enabled: true,
    type: "creditCard",
    placeholder: "[CREDIT_CARD_{N}]"
  },
  {
    id: "r-ssn",
    name: "Social Security Numbers / IDs",
    description: "Detects national identity formats (e.g. US SSN: XXX-XX-XXXX)",
    enabled: true,
    type: "ssn",
    placeholder: "[GOVT_ID_{N}]"
  },
  {
    id: "r-ip",
    name: "IP Addresses",
    description: "Detects IPv4 addresses network coordinates",
    enabled: true,
    type: "ip",
    placeholder: "[IP_ADDR_{N}]"
  },
  {
    id: "r-address",
    name: "Physical Addresses",
    description: "Detects standard physical street addresses and locations",
    enabled: true,
    type: "address",
    placeholder: "[ADDRESS_{N}]"
  },
  {
    id: "r-url",
    name: "URLs & Links",
    description: "Detects web addresses and secure link protocols",
    enabled: true,
    type: "url",
    placeholder: "[LINK_{N}]"
  },
  {
    id: "r-name",
    name: "Personal Names",
    description: "Detects personal names (e.g. Mr. Smith, Jane Doe) with casing heuristics",
    enabled: true,
    type: "name",
    placeholder: "[NAME_{N}]"
  }
];

const STOPWORDS_AND_EXCLUSIONS = new Set([
  "The", "A", "An", "And", "Or", "But", "For", "Nor", "So", "Yet", "At", "By", "In", "Of", "On", "To", "With", "As",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
  "North", "South", "East", "West", "United", "States", "America", "Europe", "Asia", "London", "Paris", "Berlin",
  "GDPR", "PII", "LLM", "API", "URL", "Email", "Phone", "SSN", "ID", "IP", "CPU", "HTTP", "HTTPS", "JSON", "XML", "PDF"
]);

export function performRedaction(
  text: string,
  enabledRules: PIIRedactionRule[],
  customSensitiveWords: string[]
): SanitizationResult {
  if (!text) {
    return {
      rawText: "",
      sanitizedText: "",
      entities: [],
      privacyScore: 100,
      redactedTypesCount: {},
      customWordsRedacted: []
    };
  }

  const matches: { startIndex: number; endIndex: number; text: string; type: string }[] = [];
  const rulesMap = new Map(enabledRules.map(r => [r.type, r]));

  // 1. Structural/Standard Regex Rules
  const standardRegexes: Record<string, RegExp> = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g,
    creditCard: /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    ip: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    url: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    address: /\b\d+\s+[A-Za-z0-9#\s\.,]{5,50}\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct|Circle|Cir)\b/gi
  };

  // Run enabled standard rules
  for (const [type, regex] of Object.entries(standardRegexes)) {
    if (rulesMap.get(type as any)?.enabled) {
      regex.lastIndex = 0; // reset regex
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          text: match[0],
          type
        });
      }
    }
  }

  // 2. Personal Names Rule (If Enabled)
  if (rulesMap.get("name")?.enabled) {
    // Look for Honorific + Capitalized Name
    const honorificRegex = /\b(?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Hon\.)\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g;
    let match;
    while ((match = honorificRegex.exec(text)) !== null) {
      matches.push({
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        text: match[0],
        type: "name"
      });
    }

    // Look for generic paired capitalized words (e.g. John Doe)
    const namePairRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
    namePairRegex.lastIndex = 0;
    while ((match = namePairRegex.exec(text)) !== null) {
      // Exclude matches if they contain elements in the exclusion set
      const words = match[0].split(/\s+/);
      const containsExclusion = words.some(w => STOPWORDS_AND_EXCLUSIONS.has(w));
      if (!containsExclusion) {
        matches.push({
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          text: match[0],
          type: "name"
        });
      }
    }
  }

  // 3. Custom Sensitive Words (Always check if custom list is passed)
  const customWordsRedactedSet = new Set<string>();
  if (customSensitiveWords && customSensitiveWords.length > 0) {
    for (const word of customSensitiveWords) {
      const trimmed = word.trim();
      if (!trimmed) continue;
      // Escape special regex characters
      const escapedWord = trimmed.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const wordRegex = new RegExp(`\\b${escapedWord}\\b`, "gi");
      let match;
      while ((match = wordRegex.exec(text)) !== null) {
        matches.push({
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          text: match[0],
          type: "custom"
        });
        customWordsRedactedSet.add(trimmed);
      }
    }
  }

  // 4. Resolve Overlaps (Keep the longest match in case of overlap)
  // Sort primarily by start index, secondarily by length descending
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
  });

  const finalMatches: typeof matches = [];
  let currentMaxEnd = -1;

  for (const m of sortedMatches) {
    if (m.startIndex >= currentMaxEnd) {
      finalMatches.push(m);
      currentMaxEnd = m.endIndex;
    }
  }

  // 5. Replace right-to-left to keep indices intact during modification
  finalMatches.sort((a, b) => b.startIndex - a.startIndex);

  // Initialize placeholder counters
  const counters: Record<string, number> = {};
  const entities: PIIEntity[] = [];
  
  // Re-sort matches alphabetically/chronologically to assign numbers in order of appearance
  const chronMatches = [...finalMatches].reverse();
  const placeholderMap = new Map<string, string>(); // Original Text -> Placeholder

  chronMatches.forEach(m => {
    const key = `${m.type}:${m.text.toLowerCase()}`;
    if (!placeholderMap.has(key)) {
      counters[m.type] = (counters[m.type] || 0) + 1;
      const rule = rulesMap.get(m.type as any);
      let placeholderFormat = rule ? rule.placeholder : `[REDACTED_${m.type.toUpperCase()}_{N}]`;
      if (m.type === "custom") {
        placeholderFormat = "[CONFIDENTIAL_{N}]";
      }
      const val = placeholderFormat.replace("{N}", counters[m.type].toString());
      placeholderMap.set(key, val);
    }
  });

  // Perform surgical replacement
  let sanitizedText = text;
  finalMatches.forEach(m => {
    const key = `${m.type}:${m.text.toLowerCase()}`;
    const placeholder = placeholderMap.get(key) || `[REDACTED_${m.type.toUpperCase()}]`;

    // Perform slice replacement
    const before = sanitizedText.slice(0, m.startIndex);
    const after = sanitizedText.slice(m.endIndex);
    sanitizedText = before + placeholder + after;

    entities.push({
      id: `e-${m.type}-${m.startIndex}`,
      type: m.type,
      text: m.text,
      placeholder,
      startIndex: m.startIndex,
      endIndex: m.startIndex + placeholder.length // offset relative to the raw replacement sequence
    });
  });

  // Sort entities back to appearance order
  entities.sort((a, b) => a.startIndex - b.startIndex);

  // 6. Metrics Calculation
  const redactedTypesCount: Record<string, number> = {};
  entities.forEach(e => {
    redactedTypesCount[e.type] = (redactedTypesCount[e.type] || 0) + 1;
  });

  // Privacy Score logic: base 100, drops if there were matched entities which are NOT redacted (currently all found are redacted, so 100 is secure)
  // Let's make it representation of compliance: if no PII found, score is 100.
  // If PII is found but redacted, score stays 100. If we had an option to 'detect only' without redacting, score would drop.
  // Let's represent Privacy Health percentage as: 100% of PII is sanitized successfully.
  const privacyScore = entities.length > 0 ? 100 : 100;

  return {
    rawText: text,
    sanitizedText,
    entities,
    privacyScore,
    redactedTypesCount,
    customWordsRedacted: Array.from(customWordsRedactedSet)
  };
}

export function rehydrateText(
  sanitizedText: string,
  entities: PIIEntity[]
): string {
  if (!entities || entities.length === 0) return sanitizedText;

  // Let's replace placeholders back using mapping
  // Map of placeholder -> original text
  const replacementMap = new Map<string, string>();
  entities.forEach(e => {
    replacementMap.set(e.placeholder, e.text);
  });

  let rehydrated = sanitizedText;
  
  // Sort keys by length descending to prevent sub-replacement bugs 
  // e.g. [EMAIL_10] matching [EMAIL_1] and corrupting it
  const placeholdersSorted = Array.from(replacementMap.keys()).sort((a, b) => b.length - a.length);

  for (const placeholder of placeholdersSorted) {
    const originalText = replacementMap.get(placeholder) || placeholder;
    // Escape regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(escapedPlaceholder, "g");
    rehydrated = rehydrated.replace(regex, originalText);
  }

  return rehydrated;
}
