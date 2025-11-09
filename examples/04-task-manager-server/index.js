#!/usr/bin/env node

/**
 * MCP Task Manager Server
 *
 * A comprehensive example of a stateful MCP server.
 * This server demonstrates:
 * - State management (in-memory task storage)
 * - CRUD operations via tools
 * - Resources for task lists and individual tasks
 * - Prompts for common task management workflows
 * - Data persistence (JSON file)
 * - Resource subscriptions and updates
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TASKS_FILE = path.join(__dirname, "tasks.json");

// In-memory task storage
let tasks = [];
let nextId = 1;

/**
 * Task structure:
 * {
 *   id: number,
 *   title: string,
 *   description: string,
 *   status: 'todo' | 'in_progress' | 'done',
 *   priority: 'low' | 'medium' | 'high',
 *   tags: string[],
 *   createdAt: string (ISO date),
 *   updatedAt: string (ISO date),
 *   dueDate: string (ISO date) | null
 * }
 */

/**
 * Load tasks from file
 */
async function loadTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    tasks = parsed.tasks || [];
    nextId = parsed.nextId || 1;
    console.error(`Loaded ${tasks.length} tasks from ${TASKS_FILE}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("No existing tasks file, starting fresh");
      tasks = [];
      nextId = 1;
    } else {
      console.error(`Error loading tasks: ${error.message}`);
    }
  }
}

/**
 * Save tasks to file
 */
async function saveTasks() {
  try {
    const data = JSON.stringify({ tasks, nextId }, null, 2);
    await fs.writeFile(TASKS_FILE, data, "utf-8");
  } catch (error) {
    console.error(`Error saving tasks: ${error.message}`);
  }
}

/**
 * Create a new task
 */
function createTask(title, description = "", priority = "medium", tags = [], dueDate = null) {
  const task = {
    id: nextId++,
    title,
    description,
    status: "todo",
    priority,
    tags: tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate,
  };

  tasks.push(task);
  saveTasks();
  return task;
}

/**
 * Get task by ID
 */
function getTask(id) {
  return tasks.find((t) => t.id === id);
}

/**
 * Update task
 */
function updateTask(id, updates) {
  const task = getTask(id);
  if (!task) {
    throw new Error(`Task ${id} not found`);
  }

  Object.assign(task, updates, { updatedAt: new Date().toISOString() });
  saveTasks();
  return task;
}

/**
 * Delete task
 */
function deleteTask(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Task ${id} not found`);
  }

  tasks.splice(index, 1);
  saveTasks();
}

/**
 * Filter tasks
 */
function filterTasks(filters = {}) {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.tag && !task.tags.includes(filters.tag)) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !task.title.toLowerCase().includes(searchLower) &&
        !task.description.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Format task for display
 */
function formatTask(task) {
  const prioritySymbols = { low: "○", medium: "◐", high: "●" };
  const statusSymbols = { todo: "☐", in_progress: "◷", done: "✓" };

  let output = `${statusSymbols[task.status]} [${task.id}] ${task.title}`;
  output += `\n  Priority: ${prioritySymbols[task.priority]} ${task.priority}`;
  output += `\n  Status: ${task.status}`;

  if (task.description) {
    output += `\n  Description: ${task.description}`;
  }

  if (task.tags.length > 0) {
    output += `\n  Tags: ${task.tags.join(", ")}`;
  }

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const now = new Date();
    const isOverdue = due < now && task.status !== "done";
    output += `\n  Due: ${task.dueDate}${isOverdue ? " (OVERDUE)" : ""}`;
  }

  output += `\n  Created: ${task.createdAt}`;
  output += `\n  Updated: ${task.updatedAt}`;

  return output;
}

/**
 * Format task list
 */
function formatTaskList(taskList, title = "Tasks") {
  if (taskList.length === 0) {
    return `${title}: None`;
  }

  let output = `${title} (${taskList.length}):\n`;
  output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  for (const task of taskList) {
    output += formatTask(task) + "\n\n";
  }

  return output;
}

// Create the MCP server
const server = new Server(
  {
    name: "task-manager-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * List available resources
 */
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "tasks://all",
        name: "All Tasks",
        mimeType: "application/json",
        description: "Complete list of all tasks",
      },
      {
        uri: "tasks://todo",
        name: "Todo Tasks",
        mimeType: "application/json",
        description: "Tasks with status: todo",
      },
      {
        uri: "tasks://in_progress",
        name: "In Progress Tasks",
        mimeType: "application/json",
        description: "Tasks currently in progress",
      },
      {
        uri: "tasks://done",
        name: "Completed Tasks",
        mimeType: "application/json",
        description: "Completed tasks",
      },
      {
        uri: "tasks://high_priority",
        name: "High Priority Tasks",
        mimeType: "application/json",
        description: "High priority tasks",
      },
    ],
  };
});

/**
 * Read a resource
 */
server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;

  if (!uri.startsWith("tasks://")) {
    throw new Error(`Unsupported URI scheme: ${uri}`);
  }

  const resourceType = uri.slice(8);
  let taskList = [];

  switch (resourceType) {
    case "all":
      taskList = tasks;
      break;
    case "todo":
      taskList = filterTasks({ status: "todo" });
      break;
    case "in_progress":
      taskList = filterTasks({ status: "in_progress" });
      break;
    case "done":
      taskList = filterTasks({ status: "done" });
      break;
    case "high_priority":
      taskList = filterTasks({ priority: "high" });
      break;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(taskList, null, 2),
      },
    ],
  };
});

/**
 * List prompts
 */
server.setRequestHandler("prompts/list", async () => {
  return {
    prompts: [
      {
        name: "daily_review",
        description: "Review today's tasks and priorities",
      },
      {
        name: "weekly_planning",
        description: "Plan tasks for the upcoming week",
      },
      {
        name: "status_update",
        description: "Get a status update on all tasks",
      },
    ],
  };
});

/**
 * Get a prompt
 */
server.setRequestHandler("prompts/get", async (request) => {
  const { name } = request.params;

  if (name === "daily_review") {
    const todayTasks = filterTasks({ status: "todo" });
    const inProgress = filterTasks({ status: "in_progress" });

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please review my tasks for today. I have ${todayTasks.length} tasks to do and ${inProgress.length} in progress. Help me prioritize what to focus on.`,
          },
        },
      ],
    };
  }

  if (name === "weekly_planning") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Help me plan my tasks for the upcoming week. Review my current tasks, suggest priorities, and help me identify what needs attention.",
          },
        },
      ],
    };
  }

  if (name === "status_update") {
    const stats = {
      total: tasks.length,
      todo: filterTasks({ status: "todo" }).length,
      in_progress: filterTasks({ status: "in_progress" }).length,
      done: filterTasks({ status: "done" }).length,
      high_priority: filterTasks({ priority: "high" }).length,
    };

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Give me a status update. I have ${stats.total} total tasks: ${stats.todo} to do, ${stats.in_progress} in progress, ${stats.done} completed. ${stats.high_priority} are high priority. What should I focus on?`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

/**
 * List tools
 */
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "create_task",
        description: "Create a new task",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Detailed description" },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Task priority",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags for organization",
            },
            dueDate: { type: "string", description: "Due date (ISO format)" },
          },
          required: ["title"],
        },
      },
      {
        name: "list_tasks",
        description: "List tasks with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["todo", "in_progress", "done"],
              description: "Filter by status",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "Filter by priority",
            },
            tag: { type: "string", description: "Filter by tag" },
            search: { type: "string", description: "Search in title/description" },
          },
        },
      },
      {
        name: "get_task",
        description: "Get details of a specific task",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "Task ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "update_task",
        description: "Update task fields",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "Task ID" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["todo", "in_progress", "done"] },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            tags: { type: "array", items: { type: "string" } },
            dueDate: { type: "string" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_task",
        description: "Delete a task",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "Task ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "complete_task",
        description: "Mark a task as complete",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "Task ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "get_statistics",
        description: "Get task statistics and overview",
        inputSchema: {
          type: "object",
          properties: {},
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
      case "create_task":
        return await handleCreateTask(args);
      case "list_tasks":
        return await handleListTasks(args);
      case "get_task":
        return await handleGetTask(args);
      case "update_task":
        return await handleUpdateTask(args);
      case "delete_task":
        return await handleDeleteTask(args);
      case "complete_task":
        return await handleCompleteTask(args);
      case "get_statistics":
        return await handleGetStatistics(args);
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

async function handleCreateTask(args) {
  const task = createTask(
    args.title,
    args.description,
    args.priority,
    args.tags,
    args.dueDate
  );

  return {
    content: [
      {
        type: "text",
        text: `Task created successfully!\n\n${formatTask(task)}`,
      },
    ],
  };
}

async function handleListTasks(args) {
  const filtered = filterTasks(args);
  return {
    content: [
      {
        type: "text",
        text: formatTaskList(filtered, "Filtered Tasks"),
      },
    ],
  };
}

async function handleGetTask(args) {
  const task = getTask(args.id);
  if (!task) {
    throw new Error(`Task ${args.id} not found`);
  }

  return {
    content: [
      {
        type: "text",
        text: formatTask(task),
      },
    ],
  };
}

async function handleUpdateTask(args) {
  const { id, ...updates } = args;
  const task = updateTask(id, updates);

  return {
    content: [
      {
        type: "text",
        text: `Task updated successfully!\n\n${formatTask(task)}`,
      },
    ],
  };
}

async function handleDeleteTask(args) {
  deleteTask(args.id);

  return {
    content: [
      {
        type: "text",
        text: `Task ${args.id} deleted successfully.`,
      },
    ],
  };
}

async function handleCompleteTask(args) {
  const task = updateTask(args.id, { status: "done" });

  return {
    content: [
      {
        type: "text",
        text: `Task completed! 🎉\n\n${formatTask(task)}`,
      },
    ],
  };
}

async function handleGetStatistics(args) {
  const stats = {
    total: tasks.length,
    byStatus: {
      todo: filterTasks({ status: "todo" }).length,
      in_progress: filterTasks({ status: "in_progress" }).length,
      done: filterTasks({ status: "done" }).length,
    },
    byPriority: {
      low: filterTasks({ priority: "low" }).length,
      medium: filterTasks({ priority: "medium" }).length,
      high: filterTasks({ priority: "high" }).length,
    },
    overdue: tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "done"
    ).length,
  };

  const output = `Task Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Tasks: ${stats.total}

Status Breakdown:
  ☐ Todo: ${stats.byStatus.todo}
  ◷ In Progress: ${stats.byStatus.in_progress}
  ✓ Done: ${stats.byStatus.done}

Priority Breakdown:
  ○ Low: ${stats.byPriority.low}
  ◐ Medium: ${stats.byPriority.medium}
  ● High: ${stats.byPriority.high}

⚠️  Overdue: ${stats.overdue}

Completion Rate: ${stats.total > 0 ? Math.round((stats.byStatus.done / stats.total) * 100) : 0}%`;

  return {
    content: [
      {
        type: "text",
        text: output,
      },
    ],
  };
}

/**
 * Start the server
 */
async function main() {
  await loadTasks();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Task Manager MCP server running on stdio");
  console.error(`Tasks stored in: ${TASKS_FILE}`);
  console.error(`Current task count: ${tasks.length}`);
}

// Save on exit
process.on("SIGINT", async () => {
  await saveTasks();
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
