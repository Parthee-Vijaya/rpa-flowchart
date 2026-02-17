import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "flowcharts.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      process_owner TEXT,
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      file_type TEXT NOT NULL,
      slide_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// --- Projects ---

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  process_owner: string | null;
  nodes: string;
  edges: string;
  created_at: string;
  updated_at: string;
}

export function createProject(project: {
  id: string;
  name: string;
  description?: string;
  processOwner?: string;
}) {
  getDb()
    .prepare(
      "INSERT INTO projects (id, name, description, process_owner) VALUES (?, ?, ?, ?)"
    )
    .run(project.id, project.name, project.description || null, project.processOwner || null);
  return getProjectById(project.id)!;
}

export function getProjectById(id: string): ProjectRow | undefined {
  return getDb()
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(id) as ProjectRow | undefined;
}

export function getAllProjects(): ProjectRow[] {
  return getDb()
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
    .all() as ProjectRow[];
}

export function updateProjectFlowchart(
  id: string,
  nodes: string,
  edges: string
) {
  getDb()
    .prepare(
      "UPDATE projects SET nodes = ?, edges = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .run(nodes, edges, id);
}

export function updateProjectName(id: string, name: string, description?: string) {
  getDb()
    .prepare(
      "UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .run(name, description || null, id);
}

export function deleteProject(id: string) {
  getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
}

// --- Uploaded Files ---

export function saveUploadedFile(file: {
  id: string;
  projectId: string;
  originalName: string;
  url: string;
  fileType: string;
  slideNumber?: number;
}) {
  getDb()
    .prepare(
      "INSERT INTO uploaded_files (id, project_id, original_name, url, file_type, slide_number) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      file.id,
      file.projectId,
      file.originalName,
      file.url,
      file.fileType,
      file.slideNumber || null
    );
}

export function getProjectFiles(projectId: string) {
  return getDb()
    .prepare("SELECT * FROM uploaded_files WHERE project_id = ? ORDER BY slide_number, created_at")
    .all(projectId);
}

// --- Settings ---

export function getSetting(key: string): string | undefined {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    )
    .run(key, value, value);
}
