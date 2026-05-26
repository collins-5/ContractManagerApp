// Import database connection
import './connection';
import { db } from './connection';

// Import all table initializations and operations
export * from './clients.ts';
export * from './workers.ts';
export * from './engineers.ts';
export * from './projects.ts';
export * from './payments.ts';


// Add to your database.ts
export const getDashboardStats = async () => {
  const active = await db.getFirstAsync('SELECT COUNT(*) as count FROM projects WHERE status = "active"');
  const proposal = await db.getFirstAsync('SELECT COUNT(*) as count FROM projects WHERE status = "proposal"');
  const completed = await db.getFirstAsync('SELECT COUNT(*) as count FROM projects WHERE status = "completed"');
  const onHold = await db.getFirstAsync('SELECT COUNT(*) as count FROM projects WHERE status = "on_hold"');
  const totalBudget = await db.getFirstAsync('SELECT SUM(budget) as total FROM projects');
  const totalSpent = await db.getFirstAsync('SELECT SUM(actual_cost) as total FROM projects');
  
  return {
    activeProjects: (active as any)?.count || 0,
    proposalProjects: (proposal as any)?.count || 0,
    completedProjects: (completed as any)?.count || 0,
    onHoldProjects: (onHold as any)?.count || 0,
    totalBudget: (totalBudget as any)?.total || 0,
    totalSpent: (totalSpent as any)?.total || 0,
  };
};

export const getRecentPayments = async (limit: number = 5) => {
  const result = await db.getAllAsync(
    `SELECT p.*, pr.project_name 
     FROM payments p 
     JOIN projects pr ON p.project_id = pr.id 
     ORDER BY p.payment_date DESC 
     LIMIT ?`,
    [limit]
  );
  return result;
};

export const initDatabase = async () => {
  console.log('Database initialized successfully');
};