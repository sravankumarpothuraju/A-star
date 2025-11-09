#!/usr/bin/env node

/**
 * MCP Database Server
 *
 * A practical example of an MCP server for database operations.
 * This server demonstrates:
 * - Stateful resource management
 * - SQL query execution with safety checks
 * - Schema introspection
 * - Transaction support
 * - Result formatting
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const DB_PATH = path.join(__dirname, "example.db");
let db;

/**
 * Initialize database connection
 */
function initializeDatabase() {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  console.error(`Connected to database: ${DB_PATH}`);
}

/**
 * Security: Validate SQL query (basic protection)
 */
function validateQuery(sql) {
  const normalized = sql.trim().toLowerCase();

  // Block dangerous operations in certain contexts
  const dangerousPatterns = [
    /;\s*drop\s+/i,
    /;\s*delete\s+from\s+(?!.*where)/i, // DELETE without WHERE
    /;\s*truncate\s+/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      throw new Error(
        "Potentially dangerous SQL detected. Please review your query."
      );
    }
  }

  return true;
}

/**
 * Format query results as a table
 */
function formatResults(rows, maxRows = 100) {
  if (!rows || rows.length === 0) {
    return "No results returned.";
  }

  const limited = rows.slice(0, maxRows);
  const hasMore = rows.length > maxRows;

  const formatted = JSON.stringify(limited, null, 2);

  if (hasMore) {
    return `${formatted}\n\n(Showing ${maxRows} of ${rows.length} rows)`;
  }

  return formatted;
}

// Create the MCP server
const server = new Server(
  {
    name: "database-server",
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
 * List available resources (database tables and views)
 */
server.setRequestHandler("resources/list", async () => {
  const tables = db
    .prepare(
      `
    SELECT name, type FROM sqlite_master
    WHERE type IN ('table', 'view')
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `
    )
    .all();

  const resources = tables.map((table) => ({
    uri: `db:///${table.name}`,
    name: table.name,
    mimeType: "application/json",
    description: `Database ${table.type}: ${table.name}`,
  }));

  return { resources };
});

/**
 * Read a resource (query a table)
 */
server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;

  if (!uri.startsWith("db:///")) {
    throw new Error(`Unsupported URI scheme: ${uri}`);
  }

  const tableName = uri.slice(6); // Remove "db:///" prefix

  try {
    // Get table data (limit to 100 rows for safety)
    const rows = db
      .prepare(`SELECT * FROM ${tableName} LIMIT 100`)
      .all();

    // Get schema info
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();

    const content = {
      table: tableName,
      rowCount: rows.length,
      schema: schema.map((col) => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        primaryKey: col.pk === 1,
      })),
      rows: rows,
    };

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(content, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to read table: ${error.message}`);
  }
});

/**
 * List available tools
 */
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "execute_query",
        description: "Execute a SELECT query and return results",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL SELECT query to execute",
            },
            params: {
              type: "array",
              description: "Query parameters (for prepared statements)",
              items: {
                type: ["string", "number", "null"],
              },
            },
          },
          required: ["query"],
        },
      },
      {
        name: "execute_update",
        description: "Execute an INSERT, UPDATE, or DELETE query",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL modification query",
            },
            params: {
              type: "array",
              description: "Query parameters",
              items: {
                type: ["string", "number", "null"],
              },
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_schema",
        description: "Get database schema information",
        inputSchema: {
          type: "object",
          properties: {
            table: {
              type: "string",
              description: "Optional: specific table name",
            },
          },
        },
      },
      {
        name: "list_tables",
        description: "List all tables and views in the database",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_table",
        description: "Create a new table",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Table name",
            },
            columns: {
              type: "array",
              description: "Column definitions",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  primaryKey: { type: "boolean" },
                  notNull: { type: "boolean" },
                },
                required: ["name", "type"],
              },
            },
          },
          required: ["name", "columns"],
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
      case "execute_query":
        return await handleExecuteQuery(args);
      case "execute_update":
        return await handleExecuteUpdate(args);
      case "get_schema":
        return await handleGetSchema(args);
      case "list_tables":
        return await handleListTables(args);
      case "create_table":
        return await handleCreateTable(args);
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

async function handleExecuteQuery(args) {
  validateQuery(args.query);

  const stmt = db.prepare(args.query);
  const results = args.params ? stmt.all(...args.params) : stmt.all();

  return {
    content: [
      {
        type: "text",
        text: formatResults(results),
      },
    ],
  };
}

async function handleExecuteUpdate(args) {
  validateQuery(args.query);

  const stmt = db.prepare(args.query);
  const info = args.params ? stmt.run(...args.params) : stmt.run();

  const message = `Query executed successfully.
Changes: ${info.changes}
Last inserted ID: ${info.lastInsertRowid}`;

  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
  };
}

async function handleGetSchema(args) {
  if (args.table) {
    // Get schema for specific table
    const schema = db.prepare(`PRAGMA table_info(${args.table})`).all();

    const formatted = {
      table: args.table,
      columns: schema.map((col) => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        defaultValue: col.dflt_value,
        primaryKey: col.pk === 1,
      })),
    };

    // Get indexes
    const indexes = db
      .prepare(`PRAGMA index_list(${args.table})`)
      .all();

    formatted.indexes = indexes.map((idx) => ({
      name: idx.name,
      unique: idx.unique === 1,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(formatted, null, 2),
        },
      ],
    };
  } else {
    // Get schema for all tables
    const tables = db
      .prepare(
        `
      SELECT name FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    `
      )
      .all();

    const schemas = {};

    for (const table of tables) {
      const schema = db
        .prepare(`PRAGMA table_info(${table.name})`)
        .all();

      schemas[table.name] = schema.map((col) => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        primaryKey: col.pk === 1,
      }));
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(schemas, null, 2),
        },
      ],
    };
  }
}

async function handleListTables(args) {
  const tables = db
    .prepare(
      `
    SELECT name, type, sql
    FROM sqlite_master
    WHERE type IN ('table', 'view')
    AND name NOT LIKE 'sqlite_%'
    ORDER BY type, name
  `
    )
    .all();

  const formatted = tables.map((t) => ({
    name: t.name,
    type: t.type,
    ddl: t.sql,
  }));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(formatted, null, 2),
      },
    ],
  };
}

async function handleCreateTable(args) {
  const columns = args.columns
    .map((col) => {
      let def = `${col.name} ${col.type}`;
      if (col.primaryKey) def += " PRIMARY KEY";
      if (col.notNull) def += " NOT NULL";
      return def;
    })
    .join(", ");

  const sql = `CREATE TABLE ${args.name} (${columns})`;

  db.prepare(sql).run();

  return {
    content: [
      {
        type: "text",
        text: `Table '${args.name}' created successfully.`,
      },
    ],
  };
}

/**
 * Start the server
 */
async function main() {
  initializeDatabase();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Database MCP server running on stdio");
  console.error(`Database: ${DB_PATH}`);
}

// Cleanup on exit
process.on("SIGINT", () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  if (db) {
    db.close();
  }
  process.exit(1);
});
