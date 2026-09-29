-- ==============================================================================
-- TEJAS ELEVATOR ENGINEERING - SUPABASE DATABASE SCHEMA & SECURITY HARDENING
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

-- 3. Row Level Security (RLS) Policies (Production Hardened)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amc_requests ENABLE ROW LEVEL SECURITY;

-- Allow public form submission (INSERT only)
DROP POLICY IF EXISTS "Allow public inserts to inquiries" ON public.inquiries;
CREATE POLICY "Allow public inserts to inquiries" 
ON public.inquiries 
FOR INSERT 
WITH CHECK (true);

-- Restrict SELECT to authenticated administrators only (protects client phone numbers & data)
DROP POLICY IF EXISTS "Allow public reads to inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow admin reads to inquiries" ON public.inquiries;
CREATE POLICY "Allow admin reads to inquiries" 
ON public.inquiries 
FOR SELECT 
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Restrict UPDATE and DELETE to authenticated administrators
DROP POLICY IF EXISTS "Allow admin updates to inquiries" ON public.inquiries;
CREATE POLICY "Allow admin updates to inquiries" 
ON public.inquiries 
FOR UPDATE 
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Allow admin deletes to inquiries" ON public.inquiries;
CREATE POLICY "Allow admin deletes to inquiries" 
ON public.inquiries 
FOR DELETE 
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- AMC Requests Policies
DROP POLICY IF EXISTS "Allow public inserts to amc_requests" ON public.amc_requests;
CREATE POLICY "Allow public inserts to amc_requests" 
ON public.amc_requests 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public reads to amc_requests" ON public.amc_requests;
DROP POLICY IF EXISTS "Allow admin reads to amc_requests" ON public.amc_requests;
CREATE POLICY "Allow admin reads to amc_requests" 
ON public.amc_requests 
FOR SELECT 
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Allow admin updates to amc_requests" ON public.amc_requests;
CREATE POLICY "Allow admin updates to amc_requests" 
ON public.amc_requests 
FOR UPDATE 
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Allow admin deletes to amc_requests" ON public.amc_requests;
CREATE POLICY "Allow admin deletes to amc_requests" 
ON public.amc_requests 
FOR DELETE 
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- NOTE: The Node.js backend uses SUPABASE_SERVICE_ROLE_KEY, which automatically bypasses RLS.
-- These policies ensure that even if the public anon key is exposed, visitors CANNOT read or steal customer inquiries.
