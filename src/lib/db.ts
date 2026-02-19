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

    CREATE TABLE IF NOT EXISTS video_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      progress INTEGER NOT NULL DEFAULT 0,
      current_step TEXT,
      error TEXT,
      transcript_text TEXT,
      visual_text TEXT,
      combined_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// --- Video Jobs ---

export interface VideoJobRow {
  id: string;
  project_id: string;
  original_name: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  current_step: string | null;
  error: string | null;
  transcript_text: string | null;
  visual_text: string | null;
  combined_text: string | null;
  created_at: string;
  updated_at: string;
}

export function createVideoJob(job: {
  id: string;
  projectId: string;
  originalName: string;
}) {
  getDb()
    .prepare(
      `INSERT INTO video_jobs (id, project_id, original_name, status, progress, current_step)
       VALUES (?, ?, ?, 'queued', 0, 'Venter i ko')`
    )
    .run(job.id, job.projectId, job.originalName);
}

export function updateVideoJobProgress(
  id: string,
  update: {
    status?: VideoJobRow["status"];
    progress?: number;
    currentStep?: string;
    error?: string | null;
  }
) {
  getDb()
    .prepare(
      `UPDATE video_jobs
       SET status = COALESCE(?, status),
           progress = COALESCE(?, progress),
           current_step = COALESCE(?, current_step),
           error = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(
      update.status ?? null,
      update.progress ?? null,
      update.currentStep ?? null,
      update.error ?? null,
      id
    );
}

export function completeVideoJob(
  id: string,
  payload: {
    transcriptText: string;
    visualText: string;
    combinedText: string;
  }
) {
  getDb()
    .prepare(
      `UPDATE video_jobs
       SET status = 'completed',
           progress = 100,
           current_step = 'Faerdig',
           error = NULL,
           transcript_text = ?,
           visual_text = ?,
           combined_text = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(payload.transcriptText, payload.visualText, payload.combinedText, id);
}

export function failVideoJob(id: string, errorMessage: string) {
  getDb()
    .prepare(
      `UPDATE video_jobs
       SET status = 'failed',
           progress = 100,
           current_step = 'Fejlet',
           error = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(errorMessage, id);
}

export function getVideoJobById(id: string): VideoJobRow | undefined {
  return getDb()
    .prepare("SELECT * FROM video_jobs WHERE id = ?")
    .get(id) as VideoJobRow | undefined;
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
