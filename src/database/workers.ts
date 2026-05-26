import { db } from './connection';
import { Worker } from '@/types';

// Create workers table
export const initWorkersTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      trade TEXT NOT NULL,
      id_number TEXT,
      daily_wage REAL,
      rating INTEGER,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER
    );
  `);
};

// Worker operations
export const insertWorker = async (worker: Omit<Worker, 'created_at' | 'updated_at'>) => {
  const now = Math.floor(Date.now() / 1000);
  await db.runAsync(
    `INSERT INTO workers (id, full_name, phone_number, trade, id_number, daily_wage, rating, notes, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      worker.id, 
      worker.full_name, 
      worker.phone_number, 
      worker.trade, 
      worker.id_number ?? null, 
      worker.daily_wage ?? null, 
      worker.rating ?? null, 
      worker.notes ?? null, 
      now, 
      now
    ]
  );
};

export const getAllWorkers = async (): Promise<Worker[]> => {
  const result = await db.getAllAsync('SELECT * FROM workers ORDER BY full_name ASC');
  return result as unknown as Worker[];
};

export const getWorkerById = async (id: string): Promise<Worker | null> => {
  const result = await db.getFirstAsync('SELECT * FROM workers WHERE id = ?', [id]);
  return result as unknown as Worker | null;
};

export const updateWorker = async (id: string, worker: Partial<Worker>) => {
  const now = Math.floor(Date.now() / 1000);
  const fields = Object.keys(worker).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(f => {
    const value = worker[f as keyof Worker];
    return value ?? null;
  });
  
  if (fields.length === 0) return;
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  await db.runAsync(`UPDATE workers SET ${setClause}, updated_at = ? WHERE id = ?`, [...values, now, id]);
};

export const deleteWorker = async (id: string) => {
  await db.runAsync('DELETE FROM workers WHERE id = ?', [id]);
};

// Auto-initialize
initWorkersTable();