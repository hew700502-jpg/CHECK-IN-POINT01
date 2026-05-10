/*
  # Homestay Check-In & Invoice System

  ## Overview
  Full check-in management system for a homestay with invoice generation for cleaning fees.

  ## New Tables

  ### units
  - id: Primary key
  - name: Unit name/number (e.g., "Unit A", "Room 101")
  - cleaning_fee: Default cleaning fee for this unit (can be overridden per invoice)
  - description: Optional description of the unit
  - created_at: Timestamp

  ### check_ins
  - id: Primary key
  - unit_id: Foreign key to units
  - guest_name: Name of the guest
  - check_in_date: Date of check-in
  - check_out_date: Date of check-out (nullable, for ongoing stays)
  - phone_number: Guest's phone number
  - remark: Notes/remarks for this check-in
  - created_at: Timestamp

  ### invoices
  - id: Primary key
  - invoice_number: Auto-generated invoice number
  - check_in_id: Foreign key to check_ins
  - cleaning_fee: Cleaning fee amount (can differ from unit default)
  - issued_date: Date invoice was issued
  - month_year: Month/year for grouping (YYYY-MM format)
  - notes: Additional invoice notes
  - created_at: Timestamp

  ## Security
  - RLS enabled on all tables
  - Public access policies for single-user/admin use (no auth required for this system)
*/

-- Units table
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cleaning_fee numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Check-ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  check_in_date date NOT NULL,
  check_out_date date,
  phone_number text DEFAULT '',
  remark text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  check_in_id uuid NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  cleaning_fee numeric(10,2) NOT NULL DEFAULT 0,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  month_year text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1000;

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Units policies (public access for single-operator system)
CREATE POLICY "Allow all on units for anon"
  ON units FOR SELECT TO anon USING (true);

CREATE POLICY "Allow insert on units for anon"
  ON units FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow update on units for anon"
  ON units FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete on units for anon"
  ON units FOR DELETE TO anon USING (true);

-- Check-ins policies
CREATE POLICY "Allow all on check_ins for anon"
  ON check_ins FOR SELECT TO anon USING (true);

CREATE POLICY "Allow insert on check_ins for anon"
  ON check_ins FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow update on check_ins for anon"
  ON check_ins FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete on check_ins for anon"
  ON check_ins FOR DELETE TO anon USING (true);

-- Invoices policies
CREATE POLICY "Allow all on invoices for anon"
  ON invoices FOR SELECT TO anon USING (true);

CREATE POLICY "Allow insert on invoices for anon"
  ON invoices FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow update on invoices for anon"
  ON invoices FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete on invoices for anon"
  ON invoices FOR DELETE TO anon USING (true);

-- Seed some default units
INSERT INTO units (name, cleaning_fee, description) VALUES
  ('Unit A', 50.00, 'Ground floor unit'),
  ('Unit B', 50.00, 'Ground floor unit'),
  ('Unit C', 60.00, 'First floor unit'),
  ('Unit D', 60.00, 'First floor unit')
ON CONFLICT DO NOTHING;
