# MCP Learning Project

A comprehensive hands-on project to learn about **Model Context Protocol (MCP)** with practical use cases and implementations.

## What is MCP?

**Model Context Protocol (MCP)** is an open protocol developed by Anthropic that enables AI applications (like Claude) to securely connect to external data sources and tools. It standardizes how AI assistants interact with:

- **Data sources**: Databases, file systems, APIs
- **Tools**: External services, system operations
- **Context**: Information needed for AI reasoning

### Key Benefits

- **Standardization**: One protocol for all integrations
- **Security**: Controlled access to resources
- **Flexibility**: Works with any data source or tool
- **Extensibility**: Easy to build custom servers

## Project Structure

```
mcp-learning-project/
├── docs/                    # Documentation and guides
│   ├── 01-mcp-basics.md    # MCP fundamentals
│   ├── 02-architecture.md  # How MCP works
│   └── 03-building-servers.md
├── examples/               # Practical implementations
│   ├── 01-filesystem-server/
│   ├── 02-database-server/
│   ├── 03-weather-api-server/
│   └── 04-task-manager-server/
├── original-code/          # Original A-Star algorithm
└── README.md
```

## Learning Path

### 1. Understanding MCP
- Read `docs/01-mcp-basics.md` to understand core concepts
- Learn about MCP architecture in `docs/02-architecture.md`
- Review the server building guide in `docs/03-building-servers.md`

### 2. Practical Examples

#### Example 1: File System Server
**Location**: `examples/01-filesystem-server/`

A simple MCP server that provides file system operations.

**Features**:
- Read files
- List directory contents
- Search files by pattern
- Get file metadata

**Use Case**: Allow Claude to navigate and read project files safely.

#### Example 2: Database Query Server
**Location**: `examples/02-database-server/`

An MCP server for database operations.

**Features**:
- Execute queries
- Fetch schema information
- Insert/update records
- Transaction support

**Use Case**: Enable Claude to help with database analysis and queries.

#### Example 3: Weather API Server
**Location**: `examples/03-weather-api-server/`

An MCP server that integrates with weather APIs.

**Features**:
- Get current weather
- Fetch forecasts
- Historical weather data
- Location-based queries

**Use Case**: Demonstrate API integration with MCP.

#### Example 4: Task Manager Server
**Location**: `examples/04-task-manager-server/`

A practical task management system via MCP.

**Features**:
- Create/update/delete tasks
- Set priorities and deadlines
- Mark tasks complete
- Search and filter tasks

**Use Case**: Real-world productivity tool integration.

## Quick Start

### Prerequisites

```bash
# Node.js 18+ required
node --version

# Install MCP SDK
npm install -g @modelcontextprotocol/sdk
```

### Running an Example

```bash
# Navigate to an example
cd examples/01-filesystem-server

# Install dependencies
npm install

# Run the server
npm start
```

### Connecting to Claude

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/path/to/examples/01-filesystem-server/index.js"]
    }
  }
}
```

## Building Your Own MCP Server

Each example includes:
- **Source code** with detailed comments
- **README** explaining the implementation
- **Configuration** examples
- **Testing** instructions

Follow the progression from simple (filesystem) to complex (database) to understand MCP patterns.

## Additional Resources

- [Official MCP Documentation](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)

## Original Code

The original A-Star search algorithm code is preserved in `original-code/` directory.

## Contributing

Feel free to:
- Add more practical examples
- Improve documentation
- Share your own MCP server implementations
- Report issues or suggest improvements

## License

This is a learning project - use freely for educational purposes.

---

**Start Learning**: Begin with `docs/01-mcp-basics.md` and work through the examples in order.
