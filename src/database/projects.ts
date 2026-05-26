import { db } from './connection';
import { Project } from '@/types';

// Create projects table
export const initProjectsTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      description TEXT,
      client_id TEXT NOT NULL,
      engineer_id TEXT,
      budget REAL DEFAULT 0,
      actual_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'proposal',
      priority TEXT DEFAULT 'medium',
      start_date INTEGER,
      expected_end_date INTEGER,
      actual_end_date INTEGER,
      address TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
      FOREIGN KEY (engineer_id) REFERENCES engineers(id) ON DELETE SET NULL
    );
  `);
};

// Project operations
export const insertProject = async (project: Omit<Project, 'created_at' | 'updated_at' | 'actual_cost'>) => {
  const now = Math.floor(Date.now() / 1000);
  await db.runAsync(
    `INSERT INTO projects (
      id, project_name, description, client_id, engineer_id,
      budget, actual_cost, status, priority, start_date,
      expected_end_date, address, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project.id, project.project_name, project.description, project.client_id,
      project.engineer_id, project.budget, project.status, project.priority,
      project.start_date, project.expected_end_date, project.address,
      project.notes, now, now
    ]
  );
};

export const getAllProjects = async (): Promise<Project[]> => {
  const result = await db.getAllAsync('SELECT * FROM projects ORDER BY created_at DESC');
  return result as unknown as Project[];
};

export const getProjectsByStatus = async (status: string): Promise<Project[]> => {
  const result = await db.getAllAsync('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC', [status]);
  return result as unknown as Project[];
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const result = await db.getFirstAsync('SELECT * FROM projects WHERE id = ?', [id]);
  return result as unknown as Project | null;
};

export const updateProjectStatus = async (id: string, status: string) => {
  const now = Math.floor(Date.now() / 1000);
  await db.runAsync('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
};

// Auto-initialize
initProjectsTable();