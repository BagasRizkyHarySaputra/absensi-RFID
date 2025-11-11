-- BASIC CHECK: One query at a time
-- ==================================

-- Query 1: Check if table exists and has data
SELECT 'pengajuan_izin' as table_name, COUNT(*) as records FROM public.pengajuan_izin;
