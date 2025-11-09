#!/usr/bin/env node

/**
 * MCP Filesystem Server
 *
 * A practical example of an MCP server that provides safe file system operations.
 * This server demonstrates:
 * - Resource listing and reading
 * - Tool implementation for file operations
 * - Input validation and security
 * - Error handling
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ALLOWED_DIRECTORIES = [
  process.cwd(), // Current working directory
  __dirname,     // Server directory
];

/**
 * Security: Validate that path is within allowed directories
 */
function validatePath(requestedPath) {
  const absolute = path.resolve(requestedPath);

  const isAllowed = ALLOWED_DIRECTORIES.some(dir =>
    absolute.startsWith(path.resolve(dir))
  );

  if (!isAllowed) {
    throw new Error(`Access denied: ${requestedPath} is outside allowed directories`);
  }

  return absolute;
}

/**
 * Format file size in human-readable format
 */
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Create the MCP server
const server = new Server(
  {
    name: "filesystem-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * List available resources (files in allowed directories)
 */
server.setRequestHandler("resources/list", async () => {
  const resources = [];

  for (const dir of ALLOWED_DIRECTORIES) {
    try {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = await fs.stat(fullPath);

        if (stats.isFile()) {
          resources.push({
            uri: `file://${fullPath}`,
            name: file,
            mimeType: getMimeType(file),
            description: `File in ${dir}`,
          });
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  }

  return { resources };
});

/**
 * Read a specific resource (file)
 */
server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;

  if (!uri.startsWith("file://")) {
    throw new Error(`Unsupported URI scheme: ${uri}`);
  }

  const filePath = uri.slice(7); // Remove "file://" prefix
  const validatedPath = validatePath(filePath);

  try {
    const content = await fs.readFile(validatedPath, "utf-8");
    const stats = await fs.stat(validatedPath);

    return {
      contents: [
        {
          uri,
          mimeType: getMimeType(validatedPath),
          text: content,
          metadata: {
            size: stats.size,
            modified: stats.mtime.toISOString(),
          },
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

/**
 * List available tools
 */
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "read_file",
        description: "Read the contents of a file",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the file to read",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "list_directory",
        description: "List contents of a directory",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the directory",
            },
            detailed: {
              type: "boolean",
              description: "Include detailed file information",
              default: false,
            },
          },
          required: ["path"],
        },
      },
      {
        name: "search_files",
        description: "Search for files by pattern in a directory",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Directory to search in",
            },
            pattern: {
              type: "string",
              description: "Filename pattern (supports wildcards like *.js)",
            },
            recursive: {
              type: "boolean",
              description: "Search subdirectories",
              default: false,
            },
          },
          required: ["directory", "pattern"],
        },
      },
      {
        name: "get_file_info",
        description: "Get detailed information about a file",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the file",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        description: "Write content to a file (creates or overwrites)",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path where to write the file",
            },
            content: {
              type: "string",
              description: "Content to write",
            },
          },
          required: ["path", "content"],
        },
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "read_file":
        return await handleReadFile(args);
      case "list_directory":
        return await handleListDirectory(args);
      case "search_files":
        return await handleSearchFiles(args);
      case "get_file_info":
        return await handleGetFileInfo(args);
      case "write_file":
        return await handleWriteFile(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Tool Handlers
 */

async function handleReadFile(args) {
  const filePath = validatePath(args.path);
  const content = await fs.readFile(filePath, "utf-8");

  return {
    content: [
      {
        type: "text",
        text: content,
      },
    ],
  };
}

async function handleListDirectory(args) {
  const dirPath = validatePath(args.path);
  const entries = await fs.readdir(dirPath);

  if (args.detailed) {
    const details = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry);
        const stats = await fs.stat(fullPath);

        return {
          name: entry,
          type: stats.isDirectory() ? "directory" : "file",
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(details, null, 2),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: entries.join("\n"),
      },
    ],
  };
}

async function handleSearchFiles(args) {
  const dirPath = validatePath(args.directory);
  const pattern = args.pattern;
  const recursive = args.recursive || false;

  const results = [];

  async function search(dir) {
    const entries = await fs.readdir(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory() && recursive) {
        await search(fullPath);
      } else if (stats.isFile()) {
        // Simple wildcard matching
        const regex = new RegExp(
          "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
        );

        if (regex.test(entry)) {
          results.push(fullPath);
        }
      }
    }
  }

  await search(dirPath);

  return {
    content: [
      {
        type: "text",
        text: `Found ${results.length} files:\n${results.join("\n")}`,
      },
    ],
  };
}

async function handleGetFileInfo(args) {
  const filePath = validatePath(args.path);
  const stats = await fs.stat(filePath);

  const info = {
    path: filePath,
    name: path.basename(filePath),
    type: stats.isDirectory() ? "directory" : "file",
    size: formatSize(stats.size),
    sizeBytes: stats.size,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    accessed: stats.atime.toISOString(),
    permissions: stats.mode.toString(8).slice(-3),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(info, null, 2),
      },
    ],
  };
}

async function handleWriteFile(args) {
  const filePath = validatePath(args.path);
  await fs.writeFile(filePath, args.content, "utf-8");

  return {
    content: [
      {
        type: "text",
        text: `Successfully wrote ${args.content.length} bytes to ${filePath}`,
      },
    ],
  };
}

/**
 * Utility: Determine MIME type from file extension
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".js": "application/javascript",
    ".json": "application/json",
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".py": "text/x-python",
    ".java": "text/x-java",
    ".cpp": "text/x-c++src",
    ".c": "text/x-c",
    ".xml": "application/xml",
    ".yaml": "application/x-yaml",
    ".yml": "application/x-yaml",
  };

  return mimeTypes[ext] || "text/plain";
}

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Filesystem MCP server running on stdio");
  console.error(`Allowed directories: ${ALLOWED_DIRECTORIES.join(", ")}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
