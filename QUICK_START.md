# Quick Start Guide

Get up and running with MCP in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Terminal/Command Prompt

## Step 1: Install Dependencies (2 min)

Choose one example to start with:

### Option A: Filesystem Server (Simplest)

```bash
cd examples/01-filesystem-server
npm install
```

### Option B: Task Manager (Most Practical)

```bash
cd examples/04-task-manager-server
npm install
```

## Step 2: Test the Server (1 min)

Run the server to verify it works:

```bash
npm start
```

You should see a message like "MCP server running on stdio". Press `Ctrl+C` to stop.

## Step 3: Connect to Claude Desktop (2 min)

### Find Your Config File

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Add Server Configuration

Edit the file and add:

```json
{
  "mcpServers": {
    "my-first-server": {
      "command": "node",
      "args": ["/FULL/PATH/TO/examples/01-filesystem-server/index.js"]
    }
  }
}
```

**Replace** `/FULL/PATH/TO/` with your actual path!

### Restart Claude Desktop

1. Quit Claude Desktop
2. Reopen it
3. Your server is now connected!

## Step 4: Try It Out!

In Claude Desktop, type:

### For Filesystem Server:
```
Can you list the files in the current directory?
```

### For Task Manager:
```
Create a task to learn MCP with high priority
```

## What's Next?

### Learn the Basics
Read `docs/01-mcp-basics.md` to understand MCP concepts.

### Try More Examples
- `examples/02-database-server` - Database operations
- `examples/03-weather-api-server` - API integration
- `examples/04-task-manager-server` - Full application

### Build Your Own
Use the examples as templates for your own MCP servers!

## Common Issues

### "Module not found"
→ Run `npm install` in the example directory

### "Server not connecting"
→ Check the path in your config is absolute and correct

### "Permission denied"
→ Ensure you have read/write access to the directory

## Full Documentation

- `README.md` - Project overview
- `SETUP.md` - Complete setup guide
- `docs/` - MCP tutorials and guides

## Need Help?

1. Check `SETUP.md` for detailed troubleshooting
2. Review example READMEs for specific guidance
3. Check Claude Desktop logs (Help → View Logs)

---

**You're all set! Start exploring MCP! 🚀**
