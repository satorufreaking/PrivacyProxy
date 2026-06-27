export interface PIIRedactionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: "email" | "phone" | "creditCard" | "ssn" | "ip" | "address" | "url" | "custom" | "name";
  pattern?: string; // Regex pattern if applicable
  placeholder: string;
}

export interface PIIEntity {
  id: string;
  type: string;
  text: string;
  placeholder: string;
  startIndex: number;
  endIndex: number;
}

export interface SanitizationResult {
  rawText: string;
  sanitizedText: string;
  entities: PIIEntity[];
  privacyScore: number; // 0-100 indicating percentage of sanitized PII or security status
  redactedTypesCount: Record<string, number>;
  customWordsRedacted: string[];
}

export interface SecureProxyResponse {
  sanitizedText: string;
  llmOutput: string;
  entities: PIIEntity[];
  logs: ProxyLog[];
}

export interface ProxyLog {
  id: string;
  timestamp: string;
  category: "guardrail" | "consent" | "model" | "user" | "gdpr";
  message: string;
  type: "info" | "warning" | "success" | "error";
}

export interface GDPRSettings {
  consentGiven: boolean;
  dataMinimizationEnabled: boolean;
  retentionCleared: boolean;
  encryptionTransit: boolean;
  localRehydration: boolean;
  dpaSigned: boolean;
  userName: string;
  companyName: string;
}
