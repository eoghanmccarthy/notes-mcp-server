#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.BLOG_API_URL || "https://www.eoghanmccarthy.com";
const AUTH_KEY = process.env.BLOG_AUTH_KEY || "";

const server = new McpServer({
  name: "notes",
  version: "1.0.0",
});

server.registerTool(
  "create_post",
  {
    description: "Create a new blog post",
    inputSchema: {
      content: z.string().describe("The markdown content of the post"),
    },
  },
  async ({ content }) => {
    if (!AUTH_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "Error: BLOG_AUTH_KEY environment variable is not set",
          },
        ],
      };
    }

    const formData = new FormData();
    formData.append("content", content);

    try {
      const response = await fetch(`${API_BASE}/api/posts/create`, {
        method: "POST",
        headers: {
          "X-Custom-Auth-Key": AUTH_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: [
            {
              type: "text",
              text: `Error creating post (${response.status}): ${errorText}`,
            },
          ],
        };
      }

      const result = await response.json();

      return {
        content: [
          {
            type: "text",
            text: `Post created successfully!\nID: ${result.id}\nURL: ${result.url}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notes MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
