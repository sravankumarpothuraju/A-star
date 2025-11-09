# Task Manager MCP Server

A comprehensive MCP server for task management, demonstrating stateful operations and data persistence.

## Features

### Resources
- **tasks://all** - All tasks
- **tasks://todo** - Todo tasks
- **tasks://in_progress** - Tasks in progress
- **tasks://done** - Completed tasks
- **tasks://high_priority** - High priority tasks

### Tools
1. **create_task** - Create a new task with title, description, priority, tags, and due date
2. **list_tasks** - List tasks with filters (status, priority, tag, search)
3. **get_task** - Get details of a specific task
4. **update_task** - Update any task field
5. **delete_task** - Delete a task
6. **complete_task** - Mark a task as complete
7. **get_statistics** - View task statistics and overview

### Prompts
1. **daily_review** - Review today's tasks and priorities
2. **weekly_planning** - Plan tasks for the upcoming week
3. **status_update** - Get a comprehensive status update

## Installation

```bash
cd examples/04-task-manager-server
npm install
```

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
    "tasks": {
      "command": "node",
      "args": ["/absolute/path/to/examples/04-task-manager-server/index.js"]
    }
  }
}
```

## Example Interactions

### Creating Tasks

```
User: Create a task to finish the MCP tutorial with high priority
Claude: [Uses create_task tool]

User: Add a task to review code, tag it as 'code-review', due tomorrow
Claude: [Uses create_task with tags and dueDate]
```

### Listing Tasks

```
User: Show me all my high priority tasks
Claude: [Uses list_tasks with priority filter]

User: What tasks are in progress?
Claude: [Uses list_tasks with status="in_progress"]

User: Find tasks related to 'documentation'
Claude: [Uses list_tasks with search="documentation"]
```

### Updating Tasks

```
User: Move task 5 to in progress
Claude: [Uses update_task with status="in_progress"]

User: Change task 3 to high priority
Claude: [Uses update_task with priority="high"]
```

### Completing Tasks

```
User: Mark task 7 as complete
Claude: [Uses complete_task]
```

### Getting Statistics

```
User: How am I doing with my tasks?
Claude: [Uses get_statistics]

Response:
Task Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Tasks: 15

Status Breakdown:
  ☐ Todo: 8
  ◷ In Progress: 3
  ✓ Done: 4

Priority Breakdown:
  ○ Low: 5
  ◐ Medium: 7
  ● High: 3

⚠️  Overdue: 2

Completion Rate: 27%
```

### Using Prompts

```
User: I need to plan my week
Claude: [Uses daily_review or weekly_planning prompt]
```

## Task Structure

Each task contains:

```javascript
{
  id: number,              // Auto-generated
  title: string,           // Task title
  description: string,     // Detailed description
  status: string,          // 'todo', 'in_progress', or 'done'
  priority: string,        // 'low', 'medium', or 'high'
  tags: string[],         // For organization
  createdAt: string,      // ISO timestamp
  updatedAt: string,      // ISO timestamp
  dueDate: string | null  // ISO date
}
```

## Data Persistence

Tasks are automatically saved to `tasks.json` in the server directory:
- Saves after every modification
- Loads on server start
- Survives restarts

## Code Structure

```
index.js
├── Configuration & State
├── Data Persistence
│   ├── loadTasks
│   └── saveTasks
├── Task Operations
│   ├── createTask
│   ├── getTask
│   ├── updateTask
│   ├── deleteTask
│   └── filterTasks
├── Formatting
│   ├── formatTask
│   └── formatTaskList
└── MCP Handlers
    ├── Resources
    ├── Tools
    └── Prompts
```

## Learning Points

1. **State Management**: Maintaining task state across requests
2. **Persistence**: Saving/loading data from files
3. **CRUD Operations**: Complete create, read, update, delete cycle
4. **Filtering**: Complex query operations
5. **Resources**: Different views of the same data
6. **Prompts**: Pre-built workflows for common tasks
7. **Data Formatting**: User-friendly output

## Extension Ideas

1. **Enhanced Features**:
   - Recurring tasks
   - Sub-tasks / task dependencies
   - Task assignments (for teams)
   - Time tracking
   - Task history/audit log
   - Attachments and notes

2. **Better Persistence**:
   - SQLite database
   - Cloud sync
   - Backup/restore functionality
   - Import/export (CSV, JSON, Markdown)

3. **Integrations**:
   - Calendar integration
   - Email notifications
   - Slack/Discord notifications
   - GitHub issues sync
   - Jira integration

4. **Analytics**:
   - Task completion trends
   - Time to completion metrics
   - Productivity reports
   - Tag usage statistics

5. **User Interface**:
   - Web dashboard
   - Mobile app
   - CLI tool
   - Desktop notifications

## Workflow Examples

### Getting Started

```
1. User: "Create a task to set up MCP server"
   -> Creates task 1

2. User: "Add a task to write documentation, high priority"
   -> Creates task 2 with high priority

3. User: "Show all my tasks"
   -> Lists tasks 1 and 2

4. User: "Start working on task 1"
   -> Updates task 1 to in_progress

5. User: "I finished task 1"
   -> Marks task 1 as done

6. User: "How many tasks do I have left?"
   -> Shows statistics
```

### Daily Workflow

```
Morning:
- "What are my tasks for today?"
- "Show high priority tasks"
- "Start task X"

During Day:
- "Add task to review pull request"
- "Update task Y description"
- "Complete task Z"

Evening:
- "What did I complete today?"
- "Show my task statistics"
- "Plan tomorrow's tasks"
```

## Testing

Try these commands once connected:

1. Create some tasks:
   - "Create a task to learn MCP"
   - "Add a high priority task to deploy app"
   - "Create a task to write tests, tag it 'testing'"

2. List and filter:
   - "Show all my tasks"
   - "What's high priority?"
   - "Show tasks in progress"

3. Update tasks:
   - "Move task 1 to in progress"
   - "Mark task 2 as complete"
   - "Change task 3 to low priority"

4. Get insights:
   - "Show my statistics"
   - "How am I doing?"
   - "What's overdue?"

## Security & Privacy

- Tasks stored locally in JSON file
- No external network calls
- No authentication (single user)
- File permissions follow system defaults

For multi-user scenarios, consider:
- User authentication
- Access control
- Encrypted storage
- Audit logging

## Troubleshooting

**Tasks not persisting:**
- Check write permissions on tasks.json
- Verify server has write access to directory

**Can't update task:**
- Verify task ID exists
- Check task ID is a number

**File corruption:**
- Backup tasks.json regularly
- Server validates JSON on load

## Integration Ideas

Combine with other MCP servers:

1. **With File System Server**:
   - Link tasks to project files
   - Track file-related todos

2. **With Database Server**:
   - Store tasks in database
   - Complex queries and reporting

3. **With Weather Server**:
   - Plan outdoor tasks by weather
   - Reschedule based on forecast

## Next Steps

1. Create your first tasks
2. Try different filters and views
3. Use prompts for planning
4. Review statistics
5. Extend with your own features!

## Additional Resources

- [Getting Things Done (GTD)](https://gettingthingsdone.com/)
- [Task Management Best Practices](https://asana.com/resources/task-management)
- JSON file handling in Node.js
