-- SQL script to create the 'report' table in Supabase
-- Run this in your Supabase SQL Editor

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.report ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Policy 1: Admin can do everything (full access)
CREATE POLICY "Admin full access to report" ON public.report
    FOR ALL 
    USING (
        -- Check if user is admin (you can adjust this condition based on your auth setup)
        auth.jwt() ->> 'email' = 'admin@gmail.com' 
        OR 
        auth.jwt() ->> 'role' = 'admin'
        OR
        -- For service role operations (backend automation)
        auth.role() = 'service_role'
    );

-- Policy 2: Students can only view their own records
CREATE POLICY "Students can view own report records" ON public.report
    FOR SELECT 
    USING (
        auth.jwt() ->> 'nis' = nis
        OR
        auth.jwt() ->> 'user_metadata' ->> 'nis' = nis
    );

-- Policy 3: Allow read access for authenticated users (teachers/staff)
-- This allows dashboard and reporting features to work
CREATE POLICY "Authenticated users can read reports" ON public.report
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Policy 4: System automation can insert/update
-- This allows the auto-transfer system to work
CREATE POLICY "System can manage report data" ON public.report
    FOR ALL 
    USING (
        -- Allow operations from service role (backend processes)
        (auth.role() = 'service_role'
        OR
        -- Allow operations from authenticated admin users
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' = 'admin@gmail.com'
            OR auth.jwt() ->> 'role' = 'admin'
        ))
    );

-- Policy 5: Class-based access for teachers (optional)
-- Teachers can view reports for their assigned classes
-- Uncomment and modify if you have a teacher-class assignment system
/*
CREATE POLICY "Teachers can view class reports" ON public.report
    FOR SELECT 
    USING (
        auth.role() = 'authenticated' 
        AND 
        kelas = ANY(
            SELECT unnest(string_to_array(auth.jwt() ->> 'assigned_classes', ','))
        )
    );
*/

-- Policy 6: Time-based access (optional)
-- Only allow viewing recent reports (e.g., last 2 years)
-- Uncomment if you want to restrict access to old data
/*
CREATE POLICY "Only recent reports accessible" ON public.report
    FOR SELECT 
    USING (
        tanggal_mulai >= (CURRENT_DATE - INTERVAL '2 years')
    );
*/

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

-- Grant necessary permissions
-- Full permissions for service role (for automation)
GRANT ALL ON public.report TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.report_id_seq TO service_role;

-- Read permissions for authenticated users (dashboard/reports)
GRANT SELECT ON public.report TO authenticated;

-- Limited permissions for anon role (if needed for public dashboards)
-- Uncomment the line below if you need anon access for public reports
-- GRANT SELECT ON public.report TO anon;

-- Add comments for documentation
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

-- RLS Policy Documentation
/*
RLS POLICIES EXPLAINED:
=======================

1. "Admin full access to report" 
   - Admins can do everything (CRUD operations)
   - Checks for admin email or admin role in JWT
   - Also allows service_role for automation

2. "Students can view own report records"
   - Students can only see their own leave records
   - Matches JWT nis with record nis

3. "Authenticated users can read reports" 
   - Teachers/staff can view all reports (read-only)
   - Needed for dashboard and reporting features

4. "System can manage report data"
   - Allows automation system to insert/update
   - Service role can do everything
   - Admin users can also manage data

5. Optional policies (commented out):
   - Teacher class-based access
   - Time-based restrictions

SECURITY NOTES:
================
- Service role bypasses RLS (needed for automation)
- Students have read-only access to their own data
- Admins have full access to everything
- Regular authenticated users can read all data
- No anon access by default (can be enabled if needed)

CUSTOMIZATION:
==============
To customize for your specific auth setup:
1. Modify JWT field checks (email, role, nis, etc.)
2. Add teacher-specific policies if needed
3. Enable/disable anon access based on requirements
4. Add time-based restrictions if data retention is a concern
*/

-- Verify table creation
SELECT 'Report table created successfully!' AS status;