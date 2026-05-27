import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface ProjectData {
  id: string;
  project_name: string;
  description: string;
  client_name: string;
  budget: number;
  actual_cost: number;
  status: string;
  priority: string;
  start_date: number | null;
  expected_end_date: number | null;
}

interface PaymentData {
  item_description: string;
  amount: number;
  category: string;
  payment_date: number;
  payment_method: string;
  notes: string | null;
}

const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;
const formatDate = (timestamp: number | null) => {
  if (!timestamp) return 'Not set';
  return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const exportProjectReport = async (project: ProjectData, payments: PaymentData[]) => {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = project.budget - totalPaid;
  const percentage = (totalPaid / project.budget) * 100;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${project.project_name} - Project Report</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2C4A6E;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2C4A6E;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0 0;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #2C4A6E;
          border-left: 4px solid #2C4A6E;
          padding-left: 12px;
          margin-bottom: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        .info-value {
          color: #333;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-active { background: #34C75920; color: #34C759; }
        .status-proposal { background: #FF950020; color: #FF9500; }
        .status-completed { background: #2C4A6E20; color: #2C4A6E; }
        .status-hold { background: #FF3B3020; color: #FF3B30; }
        .financial-card {
          background: #F2F2F7;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .financial-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .progress-bar {
          background: #E5E5EA;
          border-radius: 10px;
          height: 8px;
          overflow: hidden;
          margin: 10px 0;
        }
        .progress-fill {
          background: #2C4A6E;
          height: 100%;
          width: ${percentage}%;
          border-radius: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background: #2C4A6E;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 12px;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #E5E5EA;
          font-size: 12px;
        }
        .total-row {
          font-weight: bold;
          background: #F2F2F7;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E5EA;
          font-size: 10px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${project.project_name}</h1>
        <p>Project Report • Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="section">
        <div class="section-title">Project Overview</div>
        <div class="info-grid">
          <div class="info-label">Client:</div>
          <div class="info-value">${project.client_name}</div>
          <div class="info-label">Status:</div>
          <div class="info-value">
            <span class="status-badge status-${project.status}">${project.status.toUpperCase()}</span>
          </div>
          <div class="info-label">Priority:</div>
          <div class="info-value">${project.priority.toUpperCase()}</div>
          <div class="info-label">Start Date:</div>
          <div class="info-value">${formatDate(project.start_date)}</div>
          <div class="info-label">Expected End:</div>
          <div class="info-value">${formatDate(project.expected_end_date)}</div>
          ${project.description ? `
          <div class="info-label">Description:</div>
          <div class="info-value">${project.description}</div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Financial Summary</div>
        <div class="financial-card">
          <div class="financial-row">
            <span>Total Budget:</span>
            <strong>${formatCurrency(project.budget)}</strong>
          </div>
          <div class="financial-row">
            <span>Total Spent:</span>
            <strong style="color: #34C759;">${formatCurrency(totalPaid)}</strong>
          </div>
          <div class="financial-row">
            <span>Remaining:</span>
            <strong style="color: ${remaining >= 0 ? '#333' : '#FF3B30'};">${formatCurrency(Math.abs(remaining))}${remaining < 0 ? ' (Overspent)' : ''}</strong>
          </div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">${percentage.toFixed(1)}% spent</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payment History</div>
        ${payments.length > 0 ? `
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${formatDate(p.payment_date)}</td>
                  <td>${p.item_description}</td>
                  <td>${p.category}</td>
                  <td style="color: #34C759;">${formatCurrency(p.amount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                <td><strong>${formatCurrency(totalPaid)}</strong></td>
              </tr>
            </tbody>
          </table>
        ` : '<p style="color: #999;">No payments recorded for this project.</p>'}
      </div>

      <div class="footer">
        Generated by Contractor Manager App • ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = uri;
      link.download = `${project.project_name}_report.pdf`;
      link.click();
    } else {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Save ${project.project_name} Report`,
        UTI: 'com.adobe.pdf',
      });
    }
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return false;
  }
};

export const exportFinancialReport = async (
  projects: ProjectData[],
  totalBudget: number,
  totalSpent: number
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Financial Report</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2C4A6E;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2C4A6E;
          margin: 0;
          font-size: 28px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #2C4A6E;
          border-left: 4px solid #2C4A6E;
          padding-left: 12px;
          margin-bottom: 15px;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 25px;
        }
        .card {
          background: #F2F2F7;
          padding: 15px;
          border-radius: 12px;
          text-align: center;
        }
        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: #2C4A6E;
        }
        .card-label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background: #2C4A6E;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 12px;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #E5E5EA;
          font-size: 12px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E5EA;
          font-size: 10px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Financial Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="section">
        <div class="section-title">Summary</div>
        <div class="summary-cards">
          <div class="card">
            <div class="card-value">${formatCurrency(totalBudget)}</div>
            <div class="card-label">Total Budget</div>
          </div>
          <div class="card">
            <div class="card-value">${formatCurrency(totalSpent)}</div>
            <div class="card-label">Total Spent</div>
          </div>
          <div class="card">
            <div class="card-value">${formatCurrency(totalBudget - totalSpent)}</div>
            <div class="card-label">Remaining</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Project Breakdown</div>
        <table>
          <thead>
            <tr><th>Project</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${projects.map(p => `
              <tr>
                <td>${p.project_name}</td>
                <td>${formatCurrency(p.budget)}</td>
                <td>${formatCurrency(p.actual_cost)}</td>
                <td>${formatCurrency(p.budget - p.actual_cost)}</td>
                <td>${p.status.toUpperCase()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        Generated by Contractor Manager App • ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = uri;
      link.download = `financial_report.pdf`;
      link.click();
    } else {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Financial Report',
        UTI: 'com.adobe.pdf',
      });
    }
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return false;
  }
};