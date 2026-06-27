---
name: privacy-proxy-agent
description: Redacts PII from raw text and forwards data safely to LLMs under GDPR Article 5 data minimization principles.
version: 1.0.0
---

# Privacy Proxy Agent Skill

This skill enables secure, GDPR-compliant LLM inference by providing deterministic PII redaction and rehydration tools.

## Capabilities

### 1. PII Redaction (`redact_pii`)
- Scans text for standard identifiers (Names, Email, Phone, Credit Card, Govt IDs/SSN, IP, Address, URLs).
- Replaces PII with unique structured placeholders (e.g., `[NAME_1]`, `[EMAIL_1]`).
- Integrates custom nomenclature blocklists.
- Computes compliance scores.

### 2. Rehydration (`rehydrate_text`)
- Replaces placeholders back with their original values for authorized audit logs.

## Setup & Running

### Run Vite & Express Web Application
```bash
npm run dev
```

### Run Model Context Protocol (MCP) Server
To use the redaction capabilities as an MCP tool inside other agents:
```bash
npm run mcp
```

### Run Python ADK Agent
```bash
cd adk-agent
uv run agents-cli playground
```
