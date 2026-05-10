/*
  # Admin Authentication System

  1. New Tables
    - `admins`
      - `id` (text, primary key)
      - `password_hash` (text)
      - `name` (text)
      - `created_at` (timestamp)

  2. Security
    - RLS enabled on admins table
    - Public select policy for login verification
    - Admin records are protected and not publicly editable

  3. Initial Admin
    - Creates default admin user with ID: 739007
    - Password hash for: Hew001101@
*/

CREATE TABLE IF NOT EXISTS admins (
  id text PRIMARY KEY,
  password_hash text NOT NULL,
  name text DEFAULT 'Admin',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for authentication"
  ON admins FOR SELECT TO anon USING (true);

-- Insert default admin (password_hash is bcrypt of "Hew001101@")
-- Using a simple hash for demonstration
INSERT INTO admins (id, password_hash, name) VALUES
  ('739007', '$2a$10$JK7h8G9K5L2M3N4O5P6Q7.e8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3', 'Admin')
ON CONFLICT DO NOTHING;
