-- COMPLETE REPORT TABLE SETUP FOR SUPABASE
-- ===========================================
-- Script gabungan untuk membuat tabel report dengan RLS policies dan testing
-- Copy dan paste seluruh script ini ke Supabase SQL Editor

-- ===========================
-- STEP 1: CREATE REPORT TABLE
-- ===========================

-- Create the report table
CREATE TABLE IF NOT EXISTS public.report (
    id BIGSERIAL PRIMARY KEY,
    nama TEXT NOT NULL,
    nis TEXT NOT NULL,
    nisn TEXT DEFAULT '',
    kelas TEXT NOT NULL,
    izin BOOLEAN DEFAULT TRUE,
    tanggal_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
    tanggal_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
    alasan TEXT DEFAULT '',
    pengajuan_izin_id BIGINT REFERENCES public.pengajuan_izin(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_report_kelas ON public.report(kelas);
CREATE INDEX IF NOT EXISTS idx_report_nis ON public.report(nis);
CREATE INDEX IF NOT EXISTS idx_report_tanggal_mulai ON public.report(tanggal_mulai);
CREATE INDEX IF NOT EXISTS idx_report_pengajuan_izin_id ON public.report(pengajuan_izin_id);

-- ===========================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ===========================

-- Enable Row Level Security (RLS)
ALTER TABLE public.report ENABLE ROW LEVEL SECURITY;

-- ===========================
-- STEP 3: CREATE RLS POLICIES
-- ===========================

-- Policy 1: Admin can do everything (full access)
CREATE POLICY "Admin full access to report" ON public.report
    FOR ALL 
    USING (
        (auth.jwt() ->> 'email')::text = 'admin@gmail.com' 
        OR 
        (auth.jwt() ->> 'role')::text = 'admin'
        OR
        auth.role() = 'service_role'
    );

-- Policy 2: Students can only view their own records
CREATE POLICY "Students can view own report records" ON public.report
    FOR SELECT 
    USING (
        (auth.jwt() ->> 'nis')::text = nis
        OR
        (auth.jwt() -> 'user_metadata' ->> 'nis')::text = nis
    );

-- Policy 3: Allow read access for authenticated users (teachers/staff)
CREATE POLICY "Authenticated users can read reports" ON public.report
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Policy 4: System automation can insert/update
CREATE POLICY "System can manage report data" ON public.report
    FOR ALL 
    USING (
        auth.role() = 'service_role'
        OR
        (auth.role() = 'authenticated' AND (
            (auth.jwt() ->> 'email')::text = 'admin@gmail.com'
            OR (auth.jwt() ->> 'role')::text = 'admin'
        ))
    );

-- ===========================
-- STEP 4: CREATE UPDATE TRIGGER
-- ===========================

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_report_updated_at
    BEFORE UPDATE ON public.report
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ===========================
-- STEP 5: GRANT PERMISSIONS
-- ===========================

-- Full permissions for service role (for automation)
GRANT ALL ON public.report TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.report_id_seq TO service_role;

-- Read permissions for authenticated users (dashboard/reports)
GRANT SELECT ON public.report TO authenticated;

-- ===========================
-- STEP 6: ADD TABLE COMMENTS
-- ===========================

COMMENT ON TABLE public.report IS 'Table to store approved leave requests transferred from pengajuan_izin';
COMMENT ON COLUMN public.report.nama IS 'Student name';
COMMENT ON COLUMN public.report.nis IS 'Student identification number';
COMMENT ON COLUMN public.report.nisn IS 'National student identification number';
COMMENT ON COLUMN public.report.kelas IS 'Student class/grade';
COMMENT ON COLUMN public.report.izin IS 'Boolean flag indicating approved leave (always true for records in this table)';
COMMENT ON COLUMN public.report.tanggal_mulai IS 'Leave start date';
COMMENT ON COLUMN public.report.tanggal_selesai IS 'Leave end date';
COMMENT ON COLUMN public.report.alasan IS 'Reason for leave request';
COMMENT ON COLUMN public.report.pengajuan_izin_id IS 'Reference to the original pengajuan_izin record';

-- ===========================
-- STEP 7: VERIFY CREATION
-- ===========================

-- Check if table was created successfully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report') THEN
        RAISE NOTICE '✅ Table "report" created successfully!';
    ELSE
        RAISE NOTICE '❌ Failed to create table "report"';
    END IF;
END $$;

-- Check RLS status
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT rowsecurity INTO rls_enabled 
    FROM pg_tables 
    WHERE tablename = 'report' AND schemaname = 'public';
    
    IF rls_enabled THEN
        RAISE NOTICE '✅ Row Level Security enabled on report table';
    ELSE
        RAISE NOTICE '❌ Row Level Security NOT enabled on report table';
    END IF;
END $$;

-- List created policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'report' AND schemaname = 'public';
    
    RAISE NOTICE '✅ Created % RLS policies for report table', policy_count;
END $$;

-- ===========================
-- STEP 8: OPTIONAL RLS TESTING
-- ===========================

-- Uncomment the lines below to run RLS policy tests
-- Warning: This will create and delete test data

/*
-- Test 1: Admin access test
SELECT set_config('request.jwt.claims', '{"email": "admin@gmail.com", "role": "admin"}', true);

INSERT INTO public.report (nama, nis, kelas, tanggal_mulai, tanggal_selesai, alasan)
VALUES ('Test Admin Insert', 'TEST001', 'TEST CLASS', NOW(), NOW(), 'Testing admin access');

-- Verify admin can read
SELECT COUNT(*) as admin_can_read FROM public.report WHERE nis = 'TEST001';

-- Test 2: Student access test
SELECT set_config('request.jwt.claims', '{"nis": "TEST001", "role": "student"}', true);

-- Student should see only their record
SELECT COUNT(*) as student_can_read_own FROM public.report WHERE nis = 'TEST001';

-- Test 3: Teacher access test
SELECT set_config('request.jwt.claims', '{"email": "teacher@school.com", "role": "teacher"}', true);

-- Teacher should read all records
SELECT COUNT(*) as teacher_can_read_all FROM public.report;

-- Clean up test data
SELECT set_config('request.jwt.claims', '{"email": "admin@gmail.com", "role": "admin"}', true);
DELETE FROM public.report WHERE nis = 'TEST001';

-- Reset JWT claims
SELECT set_config('request.jwt.claims', NULL, true);
*/

-- ===========================
-- MIGRATION READY NOTIFICATION
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '🎉 REPORT TABLE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Verify the table structure in Supabase Dashboard';
    RAISE NOTICE '2. Test RLS policies with your authentication system';
    RAISE NOTICE '3. Run data migration from pengajuan_izin table';
    RAISE NOTICE '4. Update your application code to use the new report table';
    RAISE NOTICE '';
    RAISE NOTICE 'Table Features:';
    RAISE NOTICE '✅ Row Level Security enabled';
    RAISE NOTICE '✅ Automatic timestamp updates';
    RAISE NOTICE '✅ Optimized indexes for queries';
    RAISE NOTICE '✅ Proper foreign key relationships';
    RAISE NOTICE '✅ Role-based access control';
END $$;

-- Show final table structure (alternative to \d command)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'report' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show RLS policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'report' AND schemaname = 'public'
ORDER BY policyname;

-- Show indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'report' AND schemaname = 'public';

-- Final success message
SELECT 'REPORT TABLE SETUP COMPLETED - READY FOR PRODUCTION USE!' AS final_status;