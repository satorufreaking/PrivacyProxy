import { performRedaction, rehydrateText, DEFAULT_RULES } from "./utils/sanitizer.js";

// Standard input reader for JSON-RPC messages
let buffer = "";

process.stdin.on("data", (chunk) => {
  buffer += chunk.toString();
  let lineEndIndex;
  
  while ((lineEndIndex = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, lineEndIndex).trim();
    buffer = buffer.slice(lineEndIndex + 1);
    
    if (line) {
      handleRequest(line);
    }
  }
});

function sendResponse(response: any) {
  process.stdout.write(JSON.stringify(response) + "\n");
}

function sendError(id: any, code: number, message: string) {
  sendResponse({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message
    }
  });
}

function handleRequest(rawRequest: string) {
  let request: any;
  try {
    request = JSON.parse(rawRequest);
  } catch (err) {
    sendError(null, -32700, "Parse error");
    return;
  }

  if (request.jsonrpc !== "2.0") {
    sendError(request.id || null, -32600, "Invalid Request");
    return;
  }

  const { method, params, id } = request;

  switch (method) {
    case "initialize":
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "privacy-proxy-mcp",
            version: "1.0.0"
          }
        }
      });
      break;

    case "tools/list":
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "redact_pii",
              description: "Redact Personally Identifiable Information (PII) from a text string using compliance regexes and custom blocklists.",
              inputSchema: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "The raw text string to redact."
                  },
                  customWords: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Optional list of custom sensitive words/project names to redact."
                  }
                },
                required: ["text"]
              }
            },
            {
              name: "rehydrate_text",
              description: "Rehydrate a redacted text string using the entities list to restore original PII values.",
              inputSchema: {
                type: "object",
                properties: {
                  sanitizedText: {
                    type: "string",
                    description: "The sanitized text with placeholders."
                  },
                  entities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        placeholder: { type: "string" },
                        text: { type: "string" }
                      },
                      required: ["placeholder", "text"]
                    },
                    description: "The array of PII entities that were redacted."
                  }
                },
                required: ["sanitizedText", "entities"]
              }
            }
          ]
        }
      });
      break;

    case "tools/call":
      if (!params || !params.name) {
        sendError(id, -32602, "Invalid params: name is required");
        break;
      }
      
      const toolName = params.name;
      const args = params.arguments || {};

      if (toolName === "redact_pii") {
        if (typeof args.text !== "string") {
          sendError(id, -32602, "Missing or invalid 'text' argument");
          break;
        }
        
        try {
          const customWords = Array.isArray(args.customWords) ? args.customWords : [];
          const result = performRedaction(args.text, DEFAULT_RULES, customWords);
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result)
                }
              ]
            }
          });
        } catch (err: any) {
          sendError(id, -32603, err.message || "Internal error during redaction");
        }
      } else if (toolName === "rehydrate_text") {
        if (typeof args.sanitizedText !== "string") {
          sendError(id, -32602, "Missing or invalid 'sanitizedText' argument");
          break;
        }
        if (!Array.isArray(args.entities)) {
          sendError(id, -32602, "Missing or invalid 'entities' argument");
          break;
        }

        try {
          const result = rehydrateText(args.sanitizedText, args.entities);
          sendResponse({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: result
                }
              ]
            }
          });
        } catch (err: any) {
          sendError(id, -32603, err.message || "Internal error during rehydration");
        }
      } else {
        sendError(id, -32601, `Method not found: tool ${toolName}`);
      }
      break;

    default:
      // Silently ignore other notifications or return unsupported method error for requests
      if (id !== undefined) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
      break;
  }
}
