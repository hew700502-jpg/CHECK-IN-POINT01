import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Unit = {
  id: string;
  name: string;
  cleaning_fee: number;
  description: string;
  created_at: string;
};

export type CheckIn = {
  id: string;
  unit_id: string;
  guest_name: string;
  check_in_date: string;
  check_out_date: string | null;
  phone_number: string;
  remark: string;
  created_at: string;
  unit?: Unit;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  check_in_id: string;
  cleaning_fee: number;
  issued_date: string;
  month_year: string;
  notes: string;
  created_at: string;
  check_in?: CheckIn & { unit?: Unit };
};
