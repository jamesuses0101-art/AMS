-- AMS Multi-Tenant Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Super Admins table
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academies table
CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  bank_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academy Staff table
CREATE TABLE academy_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'teacher',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  guardian TEXT,
  phone TEXT,
  email TEXT,
  class TEXT,
  monthly_fee INTEGER DEFAULT 0,
  admission_date DATE,
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  teacher_name TEXT,
  monthly_fee INTEGER DEFAULT 0,
  schedule TEXT,
  status TEXT DEFAULT 'active'
);

-- Fees table
CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT,
  class TEXT,
  month TEXT,
  year INTEGER,
  amount INTEGER,
  paid_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT,
  class TEXT,
  amount INTEGER,
  month TEXT,
  year INTEGER,
  payment_date TIMESTAMP WITH TIME ZONE,
  method TEXT,
  transaction_id TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT,
  class TEXT,
  date DATE,
  status TEXT,
  notes TEXT
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT,
  category TEXT,
  amount INTEGER,
  expense_date DATE,
  notes TEXT
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Academy owners can manage their academy" ON academies
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Staff can view their academy" ON academies
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM academy_staff WHERE academy_id = academies.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their academy students" ON students
  FOR ALL USING (academy_id IN (
    SELECT academy_id FROM academy_staff WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their academy data" ON fees
  FOR ALL USING (academy_id IN (
    SELECT academy_id FROM academy_staff WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their academy payments" ON payments
  FOR ALL USING (academy_id IN (
    SELECT academy_id FROM academy_staff WHERE user_id = auth.uid()
  ));

-- Create first super admin (run after creating user)
-- INSERT INTO super_admins (user_id) VALUES ('your-user-uuid-here');
