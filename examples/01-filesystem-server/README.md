# File System MCP Server

A practical MCP server implementation that provides safe file system operations.

## Features

### Resources
- List files in allowed directories
- Read file contents with metadata
- Automatic MIME type detection

### Tools
1. **read_file** - Read file contents
2. **list_directory** - List directory contents (simple or detailed)
3. **search_files** - Search for files by pattern (supports wildcards)
4. **get_file_info** - Get detailed file metadata
5. **write_file** - Create or overwrite files

## Security Features

- **Path Validation**: Only allows access to configured directories
- **Path Traversal Protection**: Prevents `../` attacks
- **Error Handling**: Safe error messages without exposing system details

## Installation

```bash
cd examples/01-filesystem-server
npm install
```

## Usage

### Running Standalone

```bash
npm start
```

### Connecting to Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/absolute/path/to/examples/01-filesystem-server/index.js"]
    }
  }
}
```

Restart Claude Desktop to load the server.

## Example Interactions

### Reading a File

```
User: Can you read the README.md file in the current directory?
Claude: [Uses read_file tool to read the file]
```

### Listing Directory

```
User: Show me all files in the current directory with details
Claude: [Uses list_directory tool with detailed=true]
```

### Searching Files

```
User: Find all JavaScript files in this directory
Claude: [Uses search_files tool with pattern="*.js"]
```

### Getting File Info

```
User: What's the size and modification date of package.json?
Claude: [Uses get_file_info tool]
```

## Configuration

Edit the `ALLOWED_DIRECTORIES` array in `index.js` to customize which directories the server can access:

```javascript
const ALLOWED_DIRECTORIES = [
  process.cwd(),
  "/path/to/your/project",
  "/another/safe/directory",
];
```

## Code Structure

```
index.js
├── Configuration (ALLOWED_DIRECTORIES)
├── Security (validatePath function)
├── Server Setup
├── Resource Handlers
│   ├── resources/list
│   └── resources/read
├── Tool Handlers
│   ├── tools/list
│   └── tools/call
└── Utility Functions
```

## Learning Points

1. **Security First**: Always validate and sanitize inputs
2. **Error Handling**: Catch and handle errors gracefully
3. **Resource Pattern**: How to expose data as MCP resources
4. **Tool Pattern**: How to implement executable tools
5. **Input Schemas**: Using JSON Schema for tool parameters

## Extension Ideas

- Add file watching capabilities
- Implement file copy/move operations
- Add compression/decompression tools
- Support binary file operations
- Add file content search (grep-like functionality)
- Implement file diff operations

## Testing

Try these commands in Claude Desktop once connected:

1. "List all files in the current directory"
2. "Read the package.json file"
3. "Find all markdown files"
4. "Show me detailed information about index.js"
5. "Create a test.txt file with 'Hello MCP!'"

## Troubleshooting

**Server not connecting:**
- Check the path in Claude Desktop config is absolute
- Verify Node.js is installed (`node --version`)
- Check server logs in Claude Desktop (Help → View Logs)

**Access denied errors:**
- Ensure requested paths are in ALLOWED_DIRECTORIES
- Check file permissions

**Tool execution fails:**
- Verify the file/directory exists
- Check you have read/write permissions

## Next Steps

1. Review the code to understand the implementation
2. Try extending with your own tools
3. Move on to the Database server example to learn about stateful operations
