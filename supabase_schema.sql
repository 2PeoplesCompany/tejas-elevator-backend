-- ==============================================================================
-- TEJAS ELEVATOR ENGINEERING - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Inquiries Table (for Project Quotes & Lift Inquiries)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    lift_type TEXT DEFAULT 'Passenger Elevators',
    floors TEXT DEFAULT 'G + 3 Floors',
    building_type TEXT DEFAULT 'Residential',
    message TEXT,
    status TEXT DEFAULT 'new',
    assigned_to TEXT DEFAULT 'Rajiv Kumar Sethi',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AMC Requests Table (for Maintenance & Service Contracts)
CREATE TABLE IF NOT EXISTS public.amc_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    property_name TEXT NOT NULL,
    property_address TEXT,
    current_lifts_count INTEGER DEFAULT 1,
    plan_type TEXT DEFAULT 'Comprehensive AMC',
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Public Access / RLS Policies (Allows Backend to Read/Write)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amc_requests ENABLE ROW LEVEL SECURITY;

-- Allow insert from public (Frontend / API)
CREATE POLICY "Allow public inserts to inquiries" 
ON public.inquiries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public reads to inquiries" 
ON public.inquiries 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public inserts to amc_requests" 
ON public.amc_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public reads to amc_requests" 
ON public.amc_requests 
FOR SELECT 
USING (true);

-- (Optional) If you use SUPABASE_SERVICE_ROLE_KEY in backend/.env, 
-- service_role automatically has full admin bypass on all tables.
