import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { db } from '@/database/connection';

const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
const BACKUP_FILE_NAME = `contractor_backup_${new Date().toISOString().split('T')[0]}.json`;

// Ensure backup directory exists
export const ensureBackupDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }
};

// Export all data to JSON
export const exportBackup = async () => {
  try {
    await ensureBackupDir();
    
    // Fetch all data from database
    const clients = await db.getAllAsync('SELECT * FROM clients');
    const workers = await db.getAllAsync('SELECT * FROM workers');
    const engineers = await db.getAllAsync('SELECT * FROM engineers');
    const projects = await db.getAllAsync('SELECT * FROM projects');
    const payments = await db.getAllAsync('SELECT * FROM payments');
    
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        clients,
        workers,
        engineers,
        projects,
        payments,
      },
    };
    
    const backupString = JSON.stringify(backupData, null, 2);
    const backupPath = `${BACKUP_DIR}${BACKUP_FILE_NAME}`;
    
    await FileSystem.writeAsStringAsync(backupPath, backupString);
    
    // Share the file
    if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupPath, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup',
        UTI: 'public.json',
      });
    }
    
    return { success: true, path: backupPath };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error };
  }
};

// Import data from JSON backup
export const importBackup = async (uri: string) => {
  try {
    // Read the backup file
    const backupString = await FileSystem.readAsStringAsync(uri);
    const backupData = JSON.parse(backupString);
    
    if (!backupData.data || !backupData.version) {
      throw new Error('Invalid backup file format');
    }
    
    // Start transaction - clear existing data
    await db.execAsync('BEGIN TRANSACTION');
    
    try {
      // Clear existing tables
      await db.execAsync('DELETE FROM payments');
      await db.execAsync('DELETE FROM projects');
      await db.execAsync('DELETE FROM workers');
      await db.execAsync('DELETE FROM engineers');
      await db.execAsync('DELETE FROM clients');
      
      // Insert clients
      for (const client of backupData.data.clients) {
        await db.runAsync(
          `INSERT INTO clients (id, full_name, email, phone_number, address, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [client.id, client.full_name, client.email, client.phone_number, client.address, client.notes, client.created_at, client.updated_at]
        );
      }
      
      // Insert workers
      for (const worker of backupData.data.workers) {
        await db.runAsync(
          `INSERT INTO workers (id, full_name, phone_number, trade, id_number, daily_wage, rating, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [worker.id, worker.full_name, worker.phone_number, worker.trade, worker.id_number, worker.daily_wage, worker.rating, worker.notes, worker.created_at, worker.updated_at]
        );
      }
      
      // Insert engineers
      for (const engineer of backupData.data.engineers) {
        await db.runAsync(
          `INSERT INTO engineers (id, full_name, email, phone_number, specialty, hourly_rate, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [engineer.id, engineer.full_name, engineer.email, engineer.phone_number, engineer.specialty, engineer.hourly_rate, engineer.notes, engineer.created_at, engineer.updated_at]
        );
      }
      
      // Insert projects
      for (const project of backupData.data.projects) {
        await db.runAsync(
          `INSERT INTO projects (id, project_name, description, client_id, engineer_id, budget, actual_cost, status, priority, start_date, expected_end_date, actual_end_date, address, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [project.id, project.project_name, project.description, project.client_id, project.engineer_id, project.budget, project.actual_cost, project.status, project.priority, project.start_date, project.expected_end_date, project.actual_end_date, project.address, project.notes, project.created_at, project.updated_at]
        );
      }
      
      // Insert payments
      for (const payment of backupData.data.payments) {
        await db.runAsync(
          `INSERT INTO payments (id, project_id, payment_date, category, item_description, quantity, unit_price, amount, payment_method, reference_number, notes, receipt_image_path, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [payment.id, payment.project_id, payment.payment_date, payment.category, payment.item_description, payment.quantity, payment.unit_price, payment.amount, payment.payment_method, payment.reference_number, payment.notes, payment.receipt_image_path, payment.created_at, payment.updated_at]
        );
      }
      
      await db.execAsync('COMMIT');
      return { success: true };
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error };
  }
};

// Pick backup file to restore
export const pickBackupFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    
    if (result.canceled === false && result.assets && result.assets[0]) {
      return { success: true, uri: result.assets[0].uri };
    }
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('File pick failed:', error);
    return { success: false, error };
  }
};