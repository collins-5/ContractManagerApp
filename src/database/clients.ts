import { db } from './connection';
import { Client } from '@/types';

// Create clients table
export const initClientsTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT,
      phone_number TEXT NOT NULL,
      address TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER
    );
  `);
};

// Client operations
export const insertClient = async (client: Omit<Client, 'created_at' | 'updated_at'>) => {
  const now = Math.floor(Date.now() / 1000);
  await db.runAsync(
    `INSERT INTO clients (id, full_name, email, phone_number, address, notes, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client.id, 
      client.full_name, 
      client.email ?? null, 
      client.phone_number, 
      client.address ?? null, 
      client.notes ?? null, 
      now, 
      now
    ]
  );
};

export const getAllClients = async (): Promise<Client[]> => {
  const result = await db.getAllAsync('SELECT * FROM clients ORDER BY full_name ASC');
  return result as unknown as Client[];
};

export const getClientById = async (id: string): Promise<Client | null> => {
  const result = await db.getFirstAsync('SELECT * FROM clients WHERE id = ?', [id]);
  return result as unknown as Client | null;
};

export const updateClient = async (id: string, client: Partial<Client>) => {
  const now = Math.floor(Date.now() / 1000);
  const fields = Object.keys(client).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(f => {
    const value = client[f as keyof Client];
    return value ?? null;
  });
  
  if (fields.length === 0) return;
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  await db.runAsync(`UPDATE clients SET ${setClause}, updated_at = ? WHERE id = ?`, [...values, now, id]);
};

export const deleteClient = async (id: string) => {
  await db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
};

// Auto-initialize
initClientsTable();