export interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  address: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface Worker {
  id: string;
  full_name: string;
  phone_number: string;
  trade: string;
  id_number: string | null;
  daily_wage: number | null;
  rating: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface Engineer {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  specialty: string | null;
  hourly_rate: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface Project {
  id: string;
  project_name: string;
  description: string;
  
  client_id: string;
  engineer_id: string | null;
  budget: number;
  actual_cost: number;
  status: 'proposal' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: number | null;
  expected_end_date: number | null;
  actual_end_date: number | null;
  address: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface Payment {
  id: string;
  project_id: string;
  payment_date: number;
  category: 'material' | 'labor' | 'transport' | 'permit' | 'equipment' | 'misc';
  item_description: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number;
  payment_method: 'cash' | 'mpesa' | 'bank_transfer' | 'cheque' | null;
  reference_number: string | null;
  notes: string | null;
  receipt_image_path: string | null;
  created_at: number;
  updated_at: number;
}