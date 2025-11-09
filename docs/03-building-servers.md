# Building MCP Servers: A Practical Guide

## Introduction

This guide walks you through building MCP servers from scratch, covering common patterns, best practices, and real-world examples.

## Prerequisites

```bash
# Node.js 18 or higher
node --version

# npm or yarn
npm --version
```

## Project Setup

### 1. Initialize Your Project

```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
```

### 2. Install Dependencies

```bash
# Core MCP SDK
npm install @modelcontextprotocol/sdk

# Type definitions (TypeScript)
npm install -D @types/node typescript

# Optional: Additional utilities
npm install zod  # For schema validation
```

### 3. Configure TypeScript (Optional but Recommended)

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 4. Update package.json

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc && node dist/index.js"
  }
}
```

## Basic Server Implementation

### Minimal Server (JavaScript)

```javascript
// src/index.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create server with metadata
const server = new Server(
  {
    name: "example-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},  // We'll provide tools
    },
  }
);

// List available tools
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "greet",
        description: "Greet someone by name",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name to greet",
            },
          },
          required: ["name"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "greet") {
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${args.name}! Welcome to MCP!`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

## Implementing Resources

### Simple Resource Server

```javascript
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "config://app",
        name: "Application Configuration",
        mimeType: "application/json",
        description: "Current app configuration",
      },
    ],
  };
});

server.setRequestHandler("resources/read", async (request) => {
  const { uri } = request.params;

  if (uri === "config://app") {
    const config = {
      appName: "My App",
      version: "1.0.0",
      features: ["auth", "api", "ui"],
    };

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(config, null, 2),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});
```

### Dynamic Resources with Templates

```javascript
server.setRequestHandler("resources/templates/list", async () => {
  return {
    resourceTemplates: [
      {
        uriTemplate: "user://{userId}/profile",
        name: "User Profile",
        mimeType: "application/json",
        description: "User profile data",
      },
    ],
  };
});

server.setRequestHandler("resources/read", async (request) => {
  const { uri } = request.params;

  // Parse dynamic URI
  const match = uri.match(/^user:\/\/(\d+)\/profile$/);
  if (match) {
    const userId = match[1];
    const profile = await getUserProfile(userId);

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(profile),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});
```

## Implementing Prompts

```javascript
server.setRequestHandler("prompts/list", async () => {
  return {
    prompts: [
      {
        name: "code-review",
        description: "Review code for issues",
        arguments: [
          {
            name: "file",
            description: "File to review",
            required: true,
          },
          {
            name: "focus",
            description: "What to focus on",
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler("prompts/get", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "code-review") {
    const file = args.file;
    const focus = args.focus || "general quality";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please review the file "${file}" focusing on ${focus}.
                   Look for bugs, security issues, and code quality problems.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```

## Error Handling Best Practices

### 1. Structured Error Responses

```javascript
class MCPError extends Error {
  constructor(code, message, data = null) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

// Use in handlers
server.setRequestHandler("tools/call", async (request) => {
  try {
    // Process request
    return result;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new MCPError(-32002, "File not found", {
        path: error.path,
      });
    }
    throw new MCPError(-32603, "Internal error", {
      message: error.message,
    });
  }
});
```

### 2. Input Validation

```javascript
import { z } from "zod";

const GreetArgsSchema = z.object({
  name: z.string().min(1).max(100),
  formal: z.boolean().optional(),
});

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "greet") {
    // Validate input
    const args = GreetArgsSchema.parse(request.params.arguments);

    const greeting = args.formal
      ? `Good day, ${args.name}.`
      : `Hey ${args.name}!`;

    return {
      content: [{ type: "text", text: greeting }],
    };
  }
});
```

### 3. Logging

```javascript
function log(level, message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  console.error(JSON.stringify(entry));
}

server.setRequestHandler("tools/call", async (request) => {
  log("info", "Tool called", {
    tool: request.params.name,
    args: request.params.arguments,
  });

  try {
    const result = await executeTool(request.params);
    log("info", "Tool completed", { tool: request.params.name });
    return result;
  } catch (error) {
    log("error", "Tool failed", {
      tool: request.params.name,
      error: error.message,
    });
    throw error;
  }
});
```

## Advanced Patterns

### 1. Stateful Servers

```javascript
class StatefulServer {
  constructor() {
    this.sessions = new Map();
    this.server = new Server(/* ... */);
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler("tools/call", async (request) => {
      const sessionId = request.params.arguments.sessionId;
      let session = this.sessions.get(sessionId);

      if (!session) {
        session = { data: {}, createdAt: Date.now() };
        this.sessions.set(sessionId, session);
      }

      // Use session state
      return this.handleTool(session, request);
    });
  }

  // Cleanup old sessions periodically
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessions.entries()) {
        if (now - session.createdAt > 3600000) {
          // 1 hour
          this.sessions.delete(id);
        }
      }
    }, 300000); // Every 5 minutes
  }
}
```

### 2. Resource Caching

```javascript
class CachedResourceServer {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minute
  }

  async getResource(uri) {
    const cached = this.cache.get(uri);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const data = await this.loadResource(uri);
    this.cache.set(uri, { data, timestamp: Date.now() });

    return data;
  }

  invalidate(uri) {
    this.cache.delete(uri);

    // Notify clients if subscriptions are supported
    if (this.hasSubscribers(uri)) {
      this.server.notification({
        method: "notifications/resources/updated",
        params: { uri },
      });
    }
  }
}
```

### 3. Async Tool Execution

```javascript
const jobs = new Map();

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "start_analysis") {
    const jobId = crypto.randomUUID();

    // Start job asynchronously
    jobs.set(jobId, { status: "running", progress: 0 });

    performAnalysis(request.params.arguments)
      .then((result) => {
        jobs.set(jobId, { status: "completed", result });
      })
      .catch((error) => {
        jobs.set(jobId, { status: "failed", error: error.message });
      });

    return {
      content: [
        {
          type: "text",
          text: `Analysis started. Job ID: ${jobId}. Use check_job to get status.`,
        },
      ],
    };
  }

  if (request.params.name === "check_job") {
    const job = jobs.get(request.params.arguments.jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(job, null, 2),
        },
      ],
    };
  }
});
```

## Testing Your Server

### Manual Testing with MCP Inspector

```bash
# Install inspector
npm install -g @modelcontextprotocol/inspector

# Run your server with inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### Unit Testing

```javascript
import { describe, it, expect } from "vitest";

describe("MCP Server", () => {
  it("should list tools", async () => {
    const response = await server.handleRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });

    expect(response.result.tools).toHaveLength(3);
    expect(response.result.tools[0].name).toBe("greet");
  });

  it("should execute tool", async () => {
    const response = await server.handleRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "greet",
        arguments: { name: "Alice" },
      },
    });

    expect(response.result.content[0].text).toContain("Alice");
  });
});
```

## Deployment

### 1. Local Installation (Stdio)

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

### 2. Docker Container

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist

CMD ["node", "dist/index.js"]
```

### 3. HTTP Deployment

```javascript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();

app.post("/mcp", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.listen(3000, () => {
  console.log("MCP server listening on port 3000");
});
```

## Performance Tips

1. **Minimize I/O**: Batch file operations, cache frequently accessed data
2. **Async All The Way**: Use async/await consistently
3. **Resource Limits**: Set timeouts, limit concurrent operations
4. **Efficient Serialization**: Keep responses compact
5. **Connection Pooling**: Reuse database/API connections

## Security Checklist

- [ ] Validate all inputs against schemas
- [ ] Sanitize file paths (prevent directory traversal)
- [ ] Escape SQL queries (prevent injection)
- [ ] Rate limit expensive operations
- [ ] Don't expose internal errors to client
- [ ] Log security events
- [ ] Use least-privilege file/database access
- [ ] Validate URI formats
- [ ] Set resource size limits
- [ ] Handle untrusted input safely

## Common Pitfalls

1. **Forgetting Error Handling**: Always wrap operations in try/catch
2. **Blocking Operations**: Use async for I/O operations
3. **Memory Leaks**: Clean up resources, clear old cache entries
4. **Inconsistent URIs**: Use a consistent URI scheme
5. **Missing Validation**: Always validate tool arguments
6. **Exposing Secrets**: Never return credentials or tokens

## Next Steps

1. **Build**: Work through the practical examples
2. **Customize**: Adapt examples to your use case
3. **Publish**: Share your server with the community
4. **Iterate**: Gather feedback and improve

## Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [Example Servers](https://github.com/modelcontextprotocol/servers/tree/main/src)

Happy building!
