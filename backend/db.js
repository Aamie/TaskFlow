const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'taskmanager.db');

let db;

// Save DB to disk
function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Auto-save every 5 seconds if there are changes
let dirty = false;
setInterval(() => {
  if (dirty) { saveDb(); dirty = false; }
}, 5000);

// Init DB synchronously-ish using a wrapper
function initDb() {
  return initSqlJs().then((SQL) => {
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
        created_at DATETIME DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        project_id INTEGER NOT NULL,
        assigned_to INTEGER,
        created_by INTEGER NOT NULL,
        due_date DATE,
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    saveDb();
    console.log('Database initialized:', DB_PATH);
    return db;
  });
}

// Wrapper to mimic better-sqlite3's synchronous API
const dbWrapper = {
  // Run a statement (INSERT, UPDATE, DELETE, CREATE)
  run(sql, ...params) {
    const flatParams = params.flat();
    db.run(sql, flatParams);
    dirty = true;
    // Get last insert rowid
    const result = db.exec('SELECT last_insert_rowid() as id');
    const lastInsertRowid = result[0]?.values[0]?.[0] || 0;
    return { lastInsertRowid, changes: db.getRowsModified() };
  },

  // Get single row
  get(sql, ...params) {
    const flatParams = params.flat();
    const result = db.exec(sql, flatParams);
    if (!result[0]) return undefined;
    const { columns, values } = result[0];
    if (!values[0]) return undefined;
    const row = {};
    columns.forEach((col, i) => { row[col] = values[0][i]; });
    return row;
  },

  // Get all rows
  all(sql, ...params) {
    const flatParams = params.flat();
    const result = db.exec(sql, flatParams);
    if (!result[0]) return [];
    const { columns, values } = result[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  },

  // Prepare (returns object with run/get/all bound to sql)
  prepare(sql) {
    return {
      run: (...params) => dbWrapper.run(sql, ...params),
      get: (...params) => dbWrapper.get(sql, ...params),
      all: (...params) => dbWrapper.all(sql, ...params),
    };
  },

  exec(sql) {
    db.run(sql);
    dirty = true;
  },

  pragma() {} // no-op, not needed for sql.js
};

module.exports = { initDb, db: dbWrapper };
