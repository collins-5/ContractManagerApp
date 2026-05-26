import { db } from './connection';
import { Engineer } from '@/types';

// Create engineers table
export const initEngineersTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS engineers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT,
      phone_number TEXT NOT NULL,
      specialty TEXT,
      hourly_rate REAL,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER
    );
  `);
};

// Engineer operations
export const insertEngineer = async (engineer: Omit<Engineer, 'created_at' | 'updated_at'>) => {
  const now = Math.floor(Date.now() / 1000);
  await db.runAsync(
    `INSERT INTO engineers (id, full_name, email, phone_number, specialty, hourly_rate, notes, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [engineer.id, engineer.full_name, engineer.email, engineer.phone_number, engineer.specialty, engineer.hourly_rate, engineer.notes, now, now]
  );
};

export const getAllEngineers = async (): Promise<Engineer[]> => {
  const result = await db.getAllAsync('SELECT * FROM engineers ORDER BY full_name ASC');
  return result as unknown as Engineer[];
};

export const getEngineerById = async (id: string): Promise<Engineer | null> => {
  const result = await db.getFirstAsync('SELECT * FROM engineers WHERE id = ?', [id]);
  return result as unknown as Engineer | null;
};

// Auto-initialize
initEngineersTable();