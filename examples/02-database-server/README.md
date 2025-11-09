# Database MCP Server

A practical MCP server for SQLite database operations with schema introspection and query execution.

## Features

### Resources
- List database tables and views as resources
- Read table data with schema information
- Automatic schema extraction

### Tools
1. **execute_query** - Execute SELECT queries with parameters
2. **execute_update** - Execute INSERT/UPDATE/DELETE operations
3. **get_schema** - Get schema information for tables
4. **list_tables** - List all tables and views
5. **create_table** - Create new tables dynamically

## Installation

```bash
cd examples/02-database-server
npm install
```

## Initial Setup

Create the example database with sample data:

```bash
npm run init-db
```

This creates an `example.db` file with three tables:
- **users**: User accounts
- **posts**: Blog posts
- **comments**: Post comments

## Usage

### Running Standalone

```bash
npm start
```

### Connecting to Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "database": {
      "command": "node",
      "args": ["/absolute/path/to/examples/02-database-server/index.js"]
    }
  }
}
```

## Example Interactions

### Querying Data

```
User: Show me all users in the database
Claude: [Uses execute_query with "SELECT * FROM users"]
```

### Getting Schema

```
User: What's the schema of the posts table?
Claude: [Uses get_schema with table="posts"]
```

### Inserting Data

```
User: Add a new user named 'david' with email 'david@example.com'
Claude: [Uses execute_update with INSERT query]
```

### Complex Queries

```
User: Show me all posts with their authors
Claude: [Uses execute_query with JOIN]
```

## Security Features

- **Query Validation**: Basic checks for dangerous patterns
- **Prepared Statements**: Support for parameterized queries
- **Result Limiting**: Prevents overwhelming responses
- **Error Handling**: Safe error messages

## Sample Queries

Try these with Claude:

```sql
-- Get all users
SELECT * FROM users;

-- Get published posts with author names
SELECT posts.*, users.username
FROM posts
JOIN users ON posts.user_id = users.id
WHERE published = 1;

-- Get posts with comment counts
SELECT posts.title, COUNT(comments.id) as comment_count
FROM posts
LEFT JOIN comments ON posts.id = comments.post_id
GROUP BY posts.id;

-- Get recent comments with user and post info
SELECT
  comments.content,
  users.username,
  posts.title,
  comments.created_at
FROM comments
JOIN users ON comments.user_id = users.id
JOIN posts ON comments.post_id = posts.id
ORDER BY comments.created_at DESC
LIMIT 10;
```

## Database Schema

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| username | TEXT | NOT NULL, UNIQUE |
| email | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

### posts
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| user_id | INTEGER | FOREIGN KEY (users) |
| title | TEXT | NOT NULL |
| content | TEXT | |
| published | BOOLEAN | DEFAULT 0 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

### comments
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| post_id | INTEGER | FOREIGN KEY (posts) |
| user_id | INTEGER | FOREIGN KEY (users) |
| content | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

## Code Structure

```
index.js
├── Database Connection
├── Query Validation
├── Resource Handlers (tables as resources)
├── Tool Handlers
│   ├── execute_query
│   ├── execute_update
│   ├── get_schema
│   ├── list_tables
│   └── create_table
└── Utilities (formatting, validation)

init-database.js
└── Database initialization script
```

## Learning Points

1. **Stateful Resources**: Managing database connections
2. **SQL Safety**: Validating queries and using prepared statements
3. **Schema Introspection**: Using PRAGMA commands
4. **Result Formatting**: Presenting data clearly
5. **Transaction Handling**: Safe data modifications

## Extension Ideas

- Add transaction support (BEGIN/COMMIT/ROLLBACK)
- Implement query result caching
- Add database backup/restore tools
- Support for multiple databases
- Query history and analytics
- Add full-text search capabilities
- Implement data export (CSV, JSON)
- Add database migration tools

## Working with Your Own Database

To use your own SQLite database:

1. Edit `index.js` and change `DB_PATH`:

```javascript
const DB_PATH = "/path/to/your/database.db";
```

2. Restart the server
3. Use the MCP tools to explore and query your data

## Security Considerations

This example includes basic security measures but is intended for **learning and development only**:

- ⚠️ The query validation is basic - not production-ready
- ⚠️ Consider user permissions for production use
- ⚠️ Add rate limiting for query execution
- ⚠️ Implement audit logging
- ⚠️ Use read-only connections when possible

## Troubleshooting

**Database locked:**
- Close other connections to the database
- Check file permissions

**Query fails:**
- Verify SQL syntax
- Check table/column names exist
- Review error message for details

**Cannot create table:**
- Ensure table name doesn't exist
- Verify column types are valid SQLite types

## Next Steps

1. Initialize the sample database
2. Try the example queries
3. Explore the schema inspection tools
4. Connect your own database
5. Move on to the Weather API server to learn about external API integration
