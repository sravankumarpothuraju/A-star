# MCP Basics: Understanding Model Context Protocol

## Introduction

The **Model Context Protocol (MCP)** is a revolutionary open standard that enables AI applications to seamlessly and securely connect to external data sources and tools. Think of it as a universal adapter that lets AI assistants like Claude interact with your data and services.

## The Problem MCP Solves

Before MCP, integrating AI with external systems required:
- Custom code for each integration
- Different APIs and patterns for each data source
- Complex security and permission handling
- Difficulty scaling to multiple tools and services

## The MCP Solution

MCP provides a **standardized protocol** where:
- One integration pattern works for all data sources
- Security is built-in and consistent
- Servers are reusable across different AI applications
- Adding new capabilities is straightforward

## Core Concepts

### 1. MCP Architecture

```
┌─────────────────┐
│   AI Client     │  (e.g., Claude Desktop)
│  (MCP Client)   │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────┴────────┐
│   MCP Server    │  (Your custom server)
└────────┬────────┘
         │
    ┌────┴────┐
    │  Data   │  (Files, DBs, APIs, etc.)
    └─────────┘
```

### 2. Key Components

#### MCP Client
- The AI application (like Claude Desktop)
- Connects to one or more MCP servers
- Makes requests using the MCP protocol

#### MCP Server
- A program that implements the MCP protocol
- Provides access to specific resources or tools
- Handles requests from the client securely

#### Resources
- Data that can be read (files, database records, API responses)
- Exposed through a standardized interface

#### Tools
- Actions that can be performed (create file, run query, send email)
- Invoked by the AI with specific parameters

#### Prompts
- Pre-defined templates for common tasks
- Help guide the AI's interactions

### 3. Communication Flow

```
1. Client connects to Server
2. Server announces available Resources and Tools
3. Client can:
   - Read Resources
   - Invoke Tools
   - Use Prompts
4. Server responds with data or results
```

## MCP Protocol Features

### Resources

Resources represent data the AI can access:

```json
{
  "name": "user_profile",
  "uri": "profile://user/123",
  "mimeType": "application/json",
  "description": "User profile information"
}
```

### Tools

Tools are functions the AI can call:

```json
{
  "name": "create_task",
  "description": "Create a new task",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": {"type": "string"},
      "priority": {"type": "string", "enum": ["low", "medium", "high"]}
    },
    "required": ["title"]
  }
}
```

### Prompts

Prompts are reusable templates:

```json
{
  "name": "analyze_data",
  "description": "Analyze a dataset",
  "arguments": [
    {
      "name": "dataset",
      "description": "Path to dataset",
      "required": true
    }
  ]
}
```

## Building Your First MCP Server

### Basic Structure (Node.js)

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Create server instance
const server = new Server(
  {
    name: "my-first-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Define a tool
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "echo",
        description: "Echoes back the input",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string" }
          },
          required: ["message"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "echo") {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${request.params.arguments.message}`
        }
      ]
    };
  }
  throw new Error("Unknown tool");
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Security Considerations

MCP includes built-in security features:

1. **Sandboxing**: Servers run in isolated processes
2. **Permission Control**: Users must approve server connections
3. **Resource Restrictions**: Servers only access what they're configured for
4. **Audit Trail**: All interactions can be logged

### Best Practices

- ✅ Validate all inputs
- ✅ Use least-privilege access
- ✅ Sanitize file paths and queries
- ✅ Handle errors gracefully
- ✅ Log security-relevant events
- ❌ Never expose credentials in tool responses
- ❌ Don't allow arbitrary code execution
- ❌ Avoid unrestricted file system access

## Common Use Cases

### 1. Data Access
- Read configuration files
- Query databases
- Fetch API data
- Access local documents

### 2. Automation
- Create and manage tasks
- Send notifications
- Generate reports
- Update records

### 3. Development Tools
- Run tests
- Deploy applications
- Analyze code
- Manage git repositories

### 4. Integration
- Connect to third-party services
- Aggregate data from multiple sources
- Orchestrate workflows
- Transform data formats

## Comparison with Other Approaches

| Feature | MCP | Custom API | Function Calling |
|---------|-----|-----------|------------------|
| Standardization | ✅ One protocol | ❌ Custom per integration | ⚠️ Provider-specific |
| Security | ✅ Built-in | ⚠️ DIY | ⚠️ Limited |
| Reusability | ✅ High | ❌ Low | ⚠️ Medium |
| Setup Complexity | ⚠️ Medium | ❌ High | ✅ Low |
| Flexibility | ✅ Very High | ✅ Very High | ⚠️ Medium |

## Next Steps

1. **Read**: Continue to `02-architecture.md` to understand the technical details
2. **Practice**: Work through the filesystem server example
3. **Build**: Create your own MCP server for a real use case
4. **Explore**: Check out the official MCP documentation

## Additional Reading

- [MCP Specification](https://spec.modelcontextprotocol.io)
- [TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Python SDK Documentation](https://github.com/modelcontextprotocol/python-sdk)

## Summary

MCP is a game-changer for AI integration:
- **Standardized** protocol for all integrations
- **Secure** by design
- **Flexible** and extensible
- **Easy** to implement

Start with the simple examples and build up to more complex servers. The investment in learning MCP pays off quickly as you build more integrations.
