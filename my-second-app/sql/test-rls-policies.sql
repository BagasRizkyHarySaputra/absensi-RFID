-- test-rls-policies.sql - Script untuk testing RLS policies pada tabel report

-- ===========================
-- RLS POLICY TESTING GUIDE
-- ===========================

-- 1. TEST AS ADMIN
-- Set JWT claims to simulate admin user
SELECT set_config('request.jwt.claims', '{"email": "admin@gmail.com", "role": "admin"}', true);

-- Admin should be able to do everything
INSERT INTO public.report (nama, nis, kelas, tanggal_mulai, tanggal_selesai, alasan)
VALUES ('Test Admin Insert', 'ADMIN001', 'TEST', NOW(), NOW(), 'Testing admin access');

SELECT * FROM public.report WHERE nis = 'ADMIN001';
-- Should return the record

-- Update test
UPDATE public.report SET alasan = 'Updated by admin' WHERE nis = 'ADMIN001';
-- Should succeed

-- Delete test  
DELETE FROM public.report WHERE nis = 'ADMIN001';
-- Should succeed

-- 2. TEST AS STUDENT
-- Set JWT claims to simulate student user
SELECT set_config('request.jwt.claims', '{"nis": "12345", "role": "student"}', true);

-- Insert test data as admin first (reset to admin)
SELECT set_config('request.jwt.claims', '{"email": "admin@gmail.com", "role": "admin"}', true);
INSERT INTO public.report (nama, nis, kelas, tanggal_mulai, tanggal_selesai, alasan)
VALUES 
  ('Student A', '12345', 'XI SIJA 1', NOW(), NOW(), 'Student A leave'),
  ('Student B', '67890', 'XI SIJA 2', NOW(), NOW(), 'Student B leave');

-- Switch back to student
SELECT set_config('request.jwt.claims', '{"nis": "12345", "role": "student"}', true);

-- Student should only see their own record
SELECT * FROM public.report;
-- Should only return record for nis = '12345'

-- Student should NOT be able to insert/update/delete
INSERT INTO public.report (nama, nis, kelas, tanggal_mulai, tanggal_selesai, alasan)
VALUES ('Test Student Insert', '12345', 'TEST', NOW(), NOW(), 'Should fail');
-- Should fail

UPDATE public.report SET alasan = 'Student trying to update' WHERE nis = '12345';
-- Should fail

-- 3. TEST AS AUTHENTICATED USER (TEACHER/STAFF)
-- Set JWT claims to simulate regular authenticated user
SELECT set_config('request.jwt.claims', '{"email": "teacher@school.com", "role": "teacher"}', true);

-- Teacher should be able to read all reports
SELECT * FROM public.report;
-- Should return all records

-- Teacher should NOT be able to insert/update/delete
INSERT INTO public.report (nama, nis, kelas, tanggal_mulai, tanggal_selesai, alasan)
VALUES ('Test Teacher Insert', 'TEACH001', 'TEST', NOW(), NOW(), 'Should fail');
-- Should fail

UPDATE public.report SET alasan = 'Teacher trying to update' WHERE nis = '12345';
-- Should fail

-- 4. TEST AS ANON USER
-- Clear JWT claims to simulate anonymous user
SELECT set_config('request.jwt.claims', NULL, true);

-- Anon should NOT be able to access (unless policy is enabled)
SELECT * FROM public.report;
-- Should fail (no access) or return nothing

-- 5. TEST SERVICE ROLE ACCESS
-- Service role should have full access (bypasses RLS)
-- This would typically be tested through your application code, not SQL

-- ===========================
-- CLEANUP TEST DATA
-- ===========================
-- Reset to admin to clean up
SELECT set_config('request.jwt.claims', '{"email": "admin@gmail.com", "role": "admin"}', true);
DELETE FROM public.report WHERE nis IN ('12345', '67890', 'ADMIN001', 'TEACH001');

-- ===========================
-- RLS STATUS CHECK
-- ===========================
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'report';

-- List all policies on report table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'report';

-- ===========================
-- TROUBLESHOOTING
-- ===========================
/*
If tests fail, check:

1. RLS is enabled:
   ALTER TABLE public.report ENABLE ROW LEVEL SECURITY;

2. Policies exist:
   SELECT * FROM pg_policies WHERE tablename = 'report';

3. JWT claims format matches your auth setup:
   - Check field names (email, role, nis, etc.)
   - Check JWT structure in your application

4. Permissions are granted:
   GRANT SELECT ON public.report TO authenticated;
   GRANT ALL ON public.report TO service_role;

5. Your application is setting JWT correctly:
   - Check Supabase client configuration
   - Verify auth token includes correct claims
*/

SELECT 'RLS testing script completed' AS status;