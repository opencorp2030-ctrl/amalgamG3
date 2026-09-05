#!/usr/bin/env node
// MCP server for amalgamG3 merchant accounts.
// Lets Claude create/edit verification buttons ("apps"), read their embed code, and update the
// merchant profile — all scoped to a single merchant account via an API key (never admin access,
// never access to other merchants' or individuals' data).
//
// Setup: generate a key from "Mon commerce" > "Clé API — Claude / MCP" on the amalgamG3 site,
// then set AMALGAMG3_API_KEY (env var) or pass --api-key=... when launching this server.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.AMALGAMG3_API_BASE || "https://pnqaczmsyfzosxuyhcmn.supabase.co/functions/v1/mcp-api";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucWFjem1zeWZ6b3N4dXloY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTk0ODgsImV4cCI6MjEwMzQ3NTQ4OH0.N_5nWHZLHd7JQjxc0FAwevlk5RUTOmTkfT4eUFiejrk";

const apiKeyArg = process.argv.find((a) => a.startsWith("--api-key="));
const API_KEY = apiKeyArg ? apiKeyArg.slice("--api-key=".length) : process.env.AMALGAMG3_API_KEY;

if (!API_KEY) {
  console.error("Missing amalgamG3 API key. Set AMALGAMG3_API_KEY or pass --api-key=... (generate one from 'Mon commerce' on the amalgamG3 site).");
  process.exit(1);
}

async function apiCall(path, method = "GET", body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "x-api-key": API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `amalgamG3 API error (${res.status})`);
  return data;
}

const TOOLS = [
  {
    name: "get_merchant_profile",
    description: "Get the current amalgamG3 merchant's profile: business name, description, service type, minimum age, logo.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_merchant_profile",
    description: "Update the merchant's profile fields. Only pass the fields to change.",
    inputSchema: {
      type: "object",
      properties: {
        business_name: { type: "string" },
        description: { type: "string" },
        service_type: { type: "string", description: "e.g. bar, restaurant, nightclub, tabac, epicerie, evenementiel, autre" },
        min_age: { type: "number", description: "Minimum age (0-99) required for a scan to return 'verified'." },
      },
    },
  },
  {
    name: "list_verification_buttons",
    description: "List all of the merchant's verification buttons ('apps') — includes each one's ready-to-embed HTML snippet.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_verification_button",
    description: "Create a new age/identity verification button for the merchant's website or app. Returns the button including its embeddable HTML snippet.",
    inputSchema: {
      type: "object",
      properties: {
        label: { type: "string", description: "Internal name for the button, not shown to visitors." },
        min_age: { type: "number", description: "Minimum age required (0-99)." },
        redirect_url: { type: "string", description: "Optional: where to send the visitor after verification, with the result in the query string." },
        request_name: { type: "boolean", description: "Request the visitor's full name on success. Default false." },
        request_date_of_birth: { type: "boolean", description: "Request the visitor's exact date of birth on success. Default false." },
        request_document_expiry: { type: "boolean", description: "Request the document's expiry date on success. Default false." },
        request_nationality: { type: "boolean", description: "Request the visitor's nationality on success. Default false." },
        request_photo: { type: "boolean", description: "Request a photo of the visitor on success. Default false." },
      },
      required: ["label", "min_age"],
    },
  },
  {
    name: "update_verification_button",
    description: "Update an existing verification button. Only pass the fields to change.",
    inputSchema: {
      type: "object",
      properties: {
        button_id: { type: "string" },
        label: { type: "string" },
        min_age: { type: "number" },
        redirect_url: { type: "string" },
        request_name: { type: "boolean" },
        request_date_of_birth: { type: "boolean" },
        request_document_expiry: { type: "boolean" },
        request_nationality: { type: "boolean" },
        request_photo: { type: "boolean" },
      },
      required: ["button_id"],
    },
  },
  {
    name: "delete_verification_button",
    description: "Permanently delete a verification button.",
    inputSchema: {
      type: "object",
      properties: { button_id: { type: "string" } },
      required: ["button_id"],
    },
  },
  {
    name: "get_button_embed_code",
    description: "Get the ready-to-copy-paste HTML snippet for one verification button, to add to a website or WebView app.",
    inputSchema: {
      type: "object",
      properties: { button_id: { type: "string" } },
      required: ["button_id"],
    },
  },
];

const server = new Server(
  { name: "amalgamg3-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result;
    switch (name) {
      case "get_merchant_profile":
        result = await apiCall("/merchant");
        break;

      case "update_merchant_profile":
        result = await apiCall("/merchant", "PATCH", args);
        break;

      case "list_verification_buttons":
        result = await apiCall("/buttons");
        break;

      case "create_verification_button":
        result = await apiCall("/buttons", "POST", args);
        break;

      case "update_verification_button": {
        const { button_id, ...rest } = args;
        result = await apiCall(`/buttons/${button_id}`, "PATCH", rest);
        break;
      }

      case "delete_verification_button":
        result = await apiCall(`/buttons/${args.button_id}`, "DELETE");
        break;

      case "get_button_embed_code":
        result = await apiCall(`/buttons/${args.button_id}/snippet`);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("amalgamG3 MCP server running (stdio).");