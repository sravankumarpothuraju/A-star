#!/usr/bin/env node

/**
 * Initialize example SQLite database
 * Creates sample tables with data for testing the MCP server
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "example.db");

console.log("Creating example database...");

const db = new Database(DB_PATH);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
`);

// Insert sample data
const insertUser = db.prepare(
  "INSERT INTO users (username, email) VALUES (?, ?)"
);
const insertPost = db.prepare(
  "INSERT INTO posts (user_id, title, content, published) VALUES (?, ?, ?, ?)"
);
const insertComment = db.prepare(
  "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)"
);

// Sample users
insertUser.run("alice", "alice@example.com");
insertUser.run("bob", "bob@example.com");
insertUser.run("charlie", "charlie@example.com");

// Sample posts
insertPost.run(
  1,
  "Getting Started with MCP",
  "Model Context Protocol is amazing!",
  1
);
insertPost.run(
  1,
  "Building Your First Server",
  "Here's how to build an MCP server...",
  1
);
insertPost.run(2, "Database Best Practices", "When working with databases...", 1);
insertPost.run(3, "Draft Post", "This is not published yet", 0);

// Sample comments
insertComment.run(1, 2, "Great article!");
insertComment.run(1, 3, "Thanks for sharing");
insertComment.run(2, 3, "Very helpful tutorial");
insertComment.run(3, 1, "Excellent tips");

console.log("Database initialized successfully!");
console.log(`Location: ${DB_PATH}`);
console.log("\nTables created:");
console.log("- users (3 records)");
console.log("- posts (4 records)");
console.log("- comments (4 records)");

// Show some stats
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
const postCount = db.prepare("SELECT COUNT(*) as count FROM posts").get();
const commentCount = db.prepare("SELECT COUNT(*) as count FROM comments").get();

console.log("\nDatabase stats:");
console.log(`- ${userCount.count} users`);
console.log(`- ${postCount.count} posts`);
console.log(`- ${commentCount.count} comments`);

db.close();
