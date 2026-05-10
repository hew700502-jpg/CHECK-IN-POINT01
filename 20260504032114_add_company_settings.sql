/*
  # Company Settings for Invoices

  1. New Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `bank_name` (text)
      - `account_holder` (text)
      - `account_number` (text)
      - `invoice_remark` (text)
      - `updated_at` (timestamp)

  2. Security
    - RLS enabled on company_settings table
    - Public access for anon users to read and update (single admin user system)

  3. Initial Data
    - Creates a default company settings record
*/

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text DEFAULT 'CHECK IN POINT RESOURCES',
  bank_name text DEFAULT '',
  account_holder text DEFAULT '',
  account_number text DEFAULT '',
  invoice_remark text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on company_settings for anon"
  ON company_settings FOR SELECT TO anon USING (true);

CREATE POLICY "Allow update on company_settings for anon"
  ON company_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO company_settings (company_name, bank_name, account_holder, account_number, invoice_remark)
VALUES (
  'CHECK IN POINT RESOURCES',
  '',
  '',
  '',
  ''
)
ON CONFLICT DO NOTHING;
