# MCP Architecture: Deep Dive

## System Overview

The Model Context Protocol defines a client-server architecture where AI applications act as clients and external services act as servers.

```
┌──────────────────────────────────────┐
│        AI Application                │
│     (MCP Client - Claude)            │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   MCP Client SDK               │ │
│  │   - Connection Management      │ │
│  │   - Request/Response Handling  │ │
│  │   - Protocol Serialization     │ │
│  └───────────┬────────────────────┘ │
└──────────────┼──────────────────────┘
               │
               │ JSON-RPC 2.0 over stdio/HTTP
               │
┌──────────────┼──────────────────────┐
│  ┌───────────┴────────────────────┐ │
│  │   MCP Server SDK               │ │
│  │   - Request Handlers           │ │
│  │   - Capability Advertisement   │ │
│  │   - Resource Management        │ │
│  └───────────┬────────────────────┘ │
│              │                       │
│    ┌─────────┴─────────┐            │
│    │   Your Business   │            │
│    │   Logic & Data    │            │
│    └───────────────────┘            │
│                                      │
│      MCP Server Implementation      │
└──────────────────────────────────────┘
```

## Protocol Foundation

### JSON-RPC 2.0

MCP is built on [JSON-RPC 2.0](https://www.jsonrpc.org/specification), a lightweight remote procedure call protocol.

#### Request Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_files",
    "arguments": {
      "pattern": "*.js"
    }
  }
}
```

#### Response Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 42 JavaScript files"
      }
    ]
  }
}
```

#### Error Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "Pattern cannot be empty"
    }
  }
}
```

### Transport Layers

MCP supports multiple transport mechanisms:

#### 1. Standard I/O (stdio)
- Most common for local servers
- Server runs as a subprocess
- Communication via stdin/stdout
- Simple and efficient

```javascript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const transport = new StdioServerTransport();
await server.connect(transport);
```

#### 2. HTTP with SSE
- For remote servers
- Server-sent events for server-to-client messages
- Useful for web-based integrations

```javascript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
const transport = new SSEServerTransport("/messages", response);
await server.connect(transport);
```

## Core Capabilities

### 1. Resources

Resources provide read-only access to data.

#### Resource Discovery
```json
// Request
{
  "method": "resources/list"
}

// Response
{
  "resources": [
    {
      "uri": "file:///project/README.md",
      "name": "Project README",
      "mimeType": "text/markdown",
      "description": "Project documentation"
    }
  ]
}
```

#### Reading Resources
```json
// Request
{
  "method": "resources/read",
  "params": {
    "uri": "file:///project/README.md"
  }
}

// Response
{
  "contents": [
    {
      "uri": "file:///project/README.md",
      "mimeType": "text/markdown",
      "text": "# My Project\n..."
    }
  ]
}
```

#### Resource Templates
For dynamic resources:
```json
{
  "resourceTemplates": [
    {
      "uriTemplate": "user://{userId}",
      "name": "User Profile",
      "mimeType": "application/json"
    }
  ]
}
```

### 2. Tools

Tools enable the AI to perform actions.

#### Tool Definition
```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, JSONSchema>;
    required?: string[];
  };
}
```

#### Tool Listing
```json
{
  "method": "tools/list"
}
```

#### Tool Invocation
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_file",
    "arguments": {
      "path": "/tmp/test.txt",
      "content": "Hello, World!"
    }
  }
}
```

#### Tool Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "File created successfully"
    },
    {
      "type": "resource",
      "resource": {
        "uri": "file:///tmp/test.txt",
        "mimeType": "text/plain"
      }
    }
  ]
}
```

### 3. Prompts

Prompts are reusable templates for common tasks.

#### Prompt Structure
```json
{
  "name": "analyze_logs",
  "description": "Analyze application logs",
  "arguments": [
    {
      "name": "log_file",
      "description": "Path to log file",
      "required": true
    },
    {
      "name": "time_range",
      "description": "Time range to analyze",
      "required": false
    }
  ]
}
```

#### Getting a Prompt
```json
{
  "method": "prompts/get",
  "params": {
    "name": "analyze_logs",
    "arguments": {
      "log_file": "/var/log/app.log"
    }
  }
}
```

### 4. Sampling

Allows servers to request AI completions (advanced feature).

```json
{
  "method": "sampling/createMessage",
  "params": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Summarize this data..."
        }
      }
    ],
    "maxTokens": 100
  }
}
```

## Capability Negotiation

During initialization, client and server negotiate capabilities:

### Client Initialization
```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": {
        "listChanged": true
      },
      "sampling": {}
    },
    "clientInfo": {
      "name": "Claude Desktop",
      "version": "1.0.0"
    }
  }
}
```

### Server Response
```json
{
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "resources": {
      "subscribe": true,
      "listChanged": true
    },
    "tools": {},
    "prompts": {
      "listChanged": true
    }
  },
  "serverInfo": {
    "name": "my-server",
    "version": "1.0.0"
  }
}
```

## Lifecycle Management

### Connection Lifecycle

```
1. Client spawns server process (for stdio)
2. Client sends "initialize" request
3. Server responds with capabilities
4. Client sends "initialized" notification
5. Normal operation (requests/responses)
6. Client sends "shutdown" request (optional)
7. Connection closes
```

### State Management

Servers should be stateless when possible, but can maintain:
- Connection-specific state
- Cached data
- Resource subscriptions

### Error Handling

```javascript
server.setRequestHandler("tools/call", async (request) => {
  try {
    // Process request
    return result;
  } catch (error) {
    // Return structured error
    throw {
      code: -32603, // Internal error
      message: "Tool execution failed",
      data: {
        error: error.message,
        tool: request.params.name
      }
    };
  }
});
```

## Advanced Features

### Resource Subscriptions

Clients can subscribe to resource changes:

```json
{
  "method": "resources/subscribe",
  "params": {
    "uri": "file:///project/config.json"
  }
}
```

Server notifies on changes:
```json
{
  "method": "notifications/resources/updated",
  "params": {
    "uri": "file:///project/config.json"
  }
}
```

### Progress Reporting

For long-running operations:

```json
{
  "method": "notifications/progress",
  "params": {
    "progressToken": "op-123",
    "progress": 50,
    "total": 100
  }
}
```

### Logging

Servers can send logs to clients:

```json
{
  "method": "notifications/message",
  "params": {
    "level": "info",
    "logger": "my-server",
    "data": "Processing 100 files..."
  }
}
```

## Implementation Patterns

### 1. Stateless Tools
```javascript
server.setRequestHandler("tools/call", async (request) => {
  // Pure function - no side effects on server state
  return compute(request.params.arguments);
});
```

### 2. Resource Caching
```javascript
const cache = new Map();

server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;
  if (!cache.has(uri)) {
    cache.set(uri, await loadResource(uri));
  }
  return cache.get(uri);
});
```

### 3. Async Operations
```javascript
server.setRequestHandler("tools/call", async (request) => {
  const jobId = startLongRunningJob(request.params.arguments);

  // Return job reference
  return {
    content: [{
      type: "text",
      text: `Job ${jobId} started. Check status with get_job_status tool.`
    }]
  };
});
```

## Security Architecture

### Isolation
- Servers run in separate processes
- No shared memory with client
- Communication only via protocol

### Permission Model
- Users explicitly approve server connections
- Servers declare capabilities upfront
- No privilege escalation

### Input Validation
```javascript
function validateInput(schema, data) {
  // Validate against JSON Schema
  // Sanitize file paths
  // Check for injection attempts
  // Enforce size limits
}
```

## Performance Considerations

### 1. Minimize Round Trips
- Batch operations when possible
- Return complete data in single response

### 2. Stream Large Data
- Use chunked responses for large files
- Implement pagination for lists

### 3. Cache Appropriately
- Cache stable resources
- Invalidate on changes
- Consider memory limits

### 4. Handle Errors Gracefully
- Return specific error messages
- Don't expose internal details
- Log for debugging

## Next Steps

1. **Implement**: Build the filesystem server example
2. **Extend**: Add custom capabilities
3. **Optimize**: Apply performance patterns
4. **Secure**: Follow security best practices

## References

- [MCP Specification](https://spec.modelcontextprotocol.io)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [TypeScript SDK Source](https://github.com/modelcontextprotocol/typescript-sdk)
