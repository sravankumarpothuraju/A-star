# MCP Learning Project - Setup Guide

Complete guide to getting started with the MCP learning project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running Examples](#running-examples)
4. [Connecting to Claude Desktop](#connecting-to-claude-desktop)
5. [Troubleshooting](#troubleshooting)
6. [Next Steps](#next-steps)

## Prerequisites

### Required Software

1. **Node.js 18 or higher**

   Check your version:
   ```bash
   node --version
   ```

   If you need to install/update Node.js:
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use [nvm](https://github.com/nvm-sh/nvm):
     ```bash
     nvm install 18
     nvm use 18
     ```

2. **npm (comes with Node.js)**

   Check your version:
   ```bash
   npm --version
   ```

3. **Claude Desktop** (Optional - for full integration)
   - Download from [claude.ai/download](https://claude.ai/download)

### Recommended Tools

- **Git** - For cloning and version control
- **VS Code** - For editing code
- **Terminal** - Command line access

## Installation

### 1. Clone or Download the Repository

```bash
git clone https://github.com/yourusername/mcp-learning-project.git
cd mcp-learning-project
```

Or download and extract the ZIP file.

### 2. Install Dependencies for Each Example

You need to install dependencies for each example you want to run:

#### Example 1: Filesystem Server

```bash
cd examples/01-filesystem-server
npm install
cd ../..
```

#### Example 2: Database Server

```bash
cd examples/02-database-server
npm install
npm run init-db  # Initialize the example database
cd ../..
```

#### Example 3: Weather API Server

```bash
cd examples/03-weather-api-server
npm install
cd ../..
```

#### Example 4: Task Manager Server

```bash
cd examples/04-task-manager-server
npm install
cd ../..
```

### Quick Install All

Or install all at once:

```bash
# From project root
for dir in examples/*/; do
  (cd "$dir" && npm install)
done

# Initialize database example
cd examples/02-database-server && npm run init-db && cd ../..
```

## Running Examples

Each example can be run standalone for testing.

### Example 1: Filesystem Server

```bash
cd examples/01-filesystem-server
npm start
```

You should see:
```
Filesystem MCP server running on stdio
Allowed directories: /path/to/current/dir, ...
```

Press `Ctrl+C` to stop.

### Example 2: Database Server

```bash
cd examples/02-database-server
npm start
```

You should see:
```
Connected to database: /path/to/example.db
Database MCP server running on stdio
```

### Example 3: Weather API Server

```bash
cd examples/03-weather-api-server
npm start
```

You should see:
```
Weather API MCP server running on stdio
Using Open-Meteo API (https://open-meteo.com/)
```

### Example 4: Task Manager Server

```bash
cd examples/04-task-manager-server
npm start
```

You should see:
```
Task Manager MCP server running on stdio
Tasks stored in: /path/to/tasks.json
Current task count: 0
```

## Connecting to Claude Desktop

To use these MCP servers with Claude Desktop, you need to configure them in Claude's configuration file.

### 1. Locate Claude Desktop Config File

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 2. Edit Configuration

Open the file in a text editor. If it doesn't exist, create it.

Add your MCP servers to the `mcpServers` section:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-learning-project/examples/01-filesystem-server/index.js"]
    },
    "database": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-learning-project/examples/02-database-server/index.js"]
    },
    "weather": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-learning-project/examples/03-weather-api-server/index.js"]
    },
    "tasks": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-learning-project/examples/04-task-manager-server/index.js"]
    }
  }
}
```

**Important:**
- Replace `/absolute/path/to/mcp-learning-project` with your actual path
- Use forward slashes `/` even on Windows (or double backslashes `\\`)
- Paths must be absolute, not relative

### 3. Restart Claude Desktop

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. The servers should now be available

### 4. Verify Connection

In Claude Desktop, try:

```
User: Can you list the files in the current directory?
Claude: [Uses filesystem server]

User: What's the weather in London?
Claude: [Uses weather server]

User: Create a task to learn MCP
Claude: [Uses task manager server]

User: What tables are in the database?
Claude: [Uses database server]
```

## Configuration Examples

### Minimal Configuration (One Server)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/Users/yourname/mcp-learning-project/examples/01-filesystem-server/index.js"]
    }
  }
}
```

### Full Configuration (All Servers)

See the example in section 2 above.

### With Custom Working Directory

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/path/to/01-filesystem-server/index.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### With Environment Variables

```json
{
  "mcpServers": {
    "database": {
      "command": "node",
      "args": ["/path/to/02-database-server/index.js"],
      "env": {
        "DB_PATH": "/custom/path/to/database.db"
      }
    }
  }
}
```

## Troubleshooting

### Server Not Connecting

**Problem:** Claude Desktop can't connect to the server

**Solutions:**
1. Check the path in config is absolute and correct
2. Verify Node.js is installed: `node --version`
3. Test server runs standalone: `cd examples/XX && npm start`
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
   - Linux: `~/.config/Claude/logs/`

### Permission Errors

**Problem:** "Access denied" or permission errors

**Solutions:**
1. Ensure you have read/write permissions on the directory
2. For filesystem server, check `ALLOWED_DIRECTORIES` in `index.js`
3. On macOS, grant Terminal/Claude disk access in System Preferences

### Module Not Found

**Problem:** `Cannot find module '@modelcontextprotocol/sdk'`

**Solutions:**
1. Run `npm install` in the example directory
2. Delete `node_modules` and `package-lock.json`, then run `npm install` again
3. Verify `package.json` exists in the directory

### Database Locked

**Problem:** Database is locked (SQLite)

**Solutions:**
1. Close other connections to the database
2. Restart the server
3. Delete the `.db-wal` and `.db-shm` files

### Weather API Not Working

**Problem:** Weather queries fail

**Solutions:**
1. Check internet connection
2. Verify you can access `https://open-meteo.com`
3. Try a different city name
4. Check if firewall is blocking requests

### Tasks Not Saving

**Problem:** Tasks disappear after restart

**Solutions:**
1. Check write permissions in the server directory
2. Verify `tasks.json` is created and writable
3. Look for error messages in server output

## Testing Your Setup

### Quick Test Script

Create a file `test-setup.sh`:

```bash
#!/bin/bash

echo "Testing MCP Learning Project Setup"
echo "==================================="

echo -n "Node.js version: "
node --version

echo -n "npm version: "
npm --version

echo ""
echo "Testing filesystem server..."
cd examples/01-filesystem-server
timeout 2 npm start &
cd ../..

echo "Testing database server..."
cd examples/02-database-server
timeout 2 npm start &
cd ../..

echo "Testing weather server..."
cd examples/03-weather-api-server
timeout 2 npm start &
cd ../..

echo "Testing task manager server..."
cd examples/04-task-manager-server
timeout 2 npm start &
cd ../..

echo ""
echo "All servers tested!"
```

Make it executable and run:
```bash
chmod +x test-setup.sh
./test-setup.sh
```

### Manual Testing

For each server, run these commands:

1. **Filesystem:**
   ```bash
   cd examples/01-filesystem-server
   npm start
   # Should show "Filesystem MCP server running on stdio"
   # Press Ctrl+C to stop
   ```

2. **Database:**
   ```bash
   cd examples/02-database-server
   npm run init-db  # First time only
   npm start
   # Should show "Connected to database: ..."
   ```

3. **Weather:**
   ```bash
   cd examples/03-weather-api-server
   npm start
   # Should show "Weather API MCP server running on stdio"
   ```

4. **Task Manager:**
   ```bash
   cd examples/04-task-manager-server
   npm start
   # Should show "Task Manager MCP server running on stdio"
   ```

## Development Setup

### Using with VS Code

1. Open the project in VS Code
2. Install recommended extensions:
   - ESLint
   - Prettier
   - JavaScript (ES6) code snippets

3. Add to `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Filesystem Server",
      "program": "${workspaceFolder}/examples/01-filesystem-server/index.js",
      "console": "integratedTerminal"
    }
  ]
}
```

### Hot Reload (Development)

Install nodemon:
```bash
npm install -g nodemon
```

Run with auto-reload:
```bash
cd examples/01-filesystem-server
nodemon index.js
```

## Next Steps

### Learning Path

1. **Start with Documentation**
   - Read `docs/01-mcp-basics.md`
   - Review `docs/02-architecture.md`
   - Study `docs/03-building-servers.md`

2. **Work Through Examples**
   - Example 1: Filesystem (basics)
   - Example 2: Database (stateful operations)
   - Example 3: Weather API (external integration)
   - Example 4: Task Manager (complete application)

3. **Build Your Own**
   - Combine concepts from examples
   - Create a server for your use case
   - Share with the community!

### Resources

- [Official MCP Documentation](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [Example Servers](https://github.com/modelcontextprotocol/servers)

### Community

- Share your MCP servers
- Contribute improvements
- Report issues
- Help others learn!

## Getting Help

If you encounter issues:

1. Check this setup guide
2. Review the README.md files in each example
3. Check the troubleshooting section
4. Review server logs
5. Check Claude Desktop logs
6. Create an issue on GitHub

## Summary

You should now have:
- ✅ Node.js installed
- ✅ All example dependencies installed
- ✅ Servers running standalone
- ✅ (Optional) Claude Desktop configured
- ✅ Understanding of next steps

**Ready to learn MCP? Start with `docs/01-mcp-basics.md`!**
