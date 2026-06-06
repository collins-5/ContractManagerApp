import { db } from './connection';
import { Payment } from '@/types';

// Create payments table
export const initPaymentsTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      payment_date INTEGER NOT NULL,
      category TEXT NOT NULL,
      item_description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL,
      amount REAL NOT NULL,
      payment_method TEXT,
      reference_number TEXT,
      notes TEXT,
      receipt_image_path TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);
};

// Payment operations
export const insertPayment = async (payment: Omit<Payment, 'created_at' | 'updated_at'>) => {
  const now = Math.floor(Date.now() / 1000);
  await db.runAsync(
    `INSERT INTO payments (
      id, project_id, payment_date, category, item_description,
      quantity, unit_price, amount, payment_method, reference_number,
      notes, receipt_image_path, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payment.id,
      payment.project_id,
      payment.payment_date,
      payment.category,
      payment.item_description,
      payment.quantity ?? 1,
      payment.unit_price ?? null,
      payment.amount,
      payment.payment_method ?? null,
      payment.reference_number ?? null,
      payment.notes ?? null,
      payment.receipt_image_path ?? null,
      now,
      now,
    ]
  );

  // Update project actual cost
  await updateProjectActualCost(payment.project_id);
};

export const getProjectPayments = async (projectId: string): Promise<Payment[]> => {
  const result = await db.getAllAsync(
    'SELECT * FROM payments WHERE project_id = ? ORDER BY payment_date DESC',
    [projectId]
  );
  return result as unknown as Payment[];
};

export const updateProjectActualCost = async (projectId: string) => {
  const result = await db.getFirstAsync(
    'SELECT SUM(amount) as total FROM payments WHERE project_id = ?',
    [projectId]
  );
  const total = (result as any)?.total || 0;
  await db.runAsync('UPDATE projects SET actual_cost = ? WHERE id = ?', [total, projectId]);
};

export const deletePayment = async (id: string, projectId: string) => {
  await db.runAsync('DELETE FROM payments WHERE id = ?', [id]);
  await updateProjectActualCost(projectId);
};

export const updatePayment = async (id: string, payment: Partial<Payment>) => {
  const now = Math.floor(Date.now() / 1000);

  const fields = Object.keys(payment).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(f => {
    const value = payment[f as keyof Payment];
    return value ?? null;
  });

  if (fields.length === 0) return;

  // If project_id changes, we must recalc both old and new projects
  const existing = await db.getFirstAsync('SELECT project_id FROM payments WHERE id = ?', [id]);
  const oldProjectId = (existing as any)?.project_id as string | undefined;
  const newProjectId = (payment.project_id as string | null) ?? oldProjectId;

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  await db.runAsync(`UPDATE payments SET ${setClause}, updated_at = ? WHERE id = ?`, [...values, now, id]);

  if (oldProjectId) await updateProjectActualCost(oldProjectId);
  if (newProjectId) await updateProjectActualCost(newProjectId);
};

export const getAllPayments = async (): Promise<Payment[]> => {
  const result = await db.getAllAsync(`
    SELECT p.*, pr.project_name 
    FROM payments p 
    JOIN projects pr ON p.project_id = pr.id 
    ORDER BY p.payment_date DESC
  `);
  return result as unknown as Payment[];
};

export const getPaymentById = async (id: string) => {
  const result = await db.getFirstAsync('SELECT * FROM payments WHERE id = ?', [id]);
  return result;
};

// Auto-initialize
initPaymentsTable();

