-- TEST APPROVAL WITH RLS DEBUG
-- ==============================

-- 1. Check current RLS policies on pengajuan_izin table
SELECT 'PENGAJUAN_IZIN RLS STATUS:' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE tablename = 'pengajuan_izin';

-- 2. List all policies on pengajuan_izin
SELECT 'PENGAJUAN_IZIN POLICIES:' as info;

SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'pengajuan_izin' AND schemaname = 'public'
ORDER BY policyname;

-- 3. Check permissions on pengajuan_izin
SELECT 'PENGAJUAN_IZIN PERMISSIONS:' as info;

SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'pengajuan_izin' AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 4. Find a test pengajuan to approve
SELECT 'TEST DATA AVAILABLE:' as info;

SELECT 
    id,
    nis,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    status,
    created_at
FROM public.pengajuan_izin 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Try manual approval simulation (choose an ID from above)
-- Uncomment and replace ID below with actual pending ID

/*
-- Manual approval test - replace 'YOUR_PENGAJUAN_ID' with actual ID
UPDATE public.pengajuan_izin 
SET 
    status = 'approved',
    tanggal_disetujui = NOW(),
    disetujui_oleh = 'Manual Test'
WHERE id = YOUR_PENGAJUAN_ID;  -- Replace with actual ID

-- Check if approval worked
SELECT 
    'APPROVAL TEST RESULT:' as info,
    id,
    nis,
    alasan,
    status,
    tanggal_disetujui,
    disetujui_oleh
FROM public.pengajuan_izin 
WHERE id = YOUR_PENGAJUAN_ID;  -- Replace with actual ID

-- Check if auto-migration to report table worked
SELECT 
    'AUTO-MIGRATION RESULT:' as info,
    COUNT(*) as migrated_count
FROM public.report 
WHERE pengajuan_izin_id = YOUR_PENGAJUAN_ID;  -- Replace with actual ID
*/

-- 6. Check if there are any RLS policies blocking updates
SELECT 'RLS BLOCKING CHECK:' as info;

-- This should work if RLS is properly configured
SELECT 
    current_user as current_database_user,
    session_user as session_database_user,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- 7. Show recommended RLS policies for pengajuan_izin if missing
SELECT 'RECOMMENDED PENGAJUAN_IZIN POLICIES:' as info;

SELECT 
    'CREATE POLICY "admin_full_access_pengajuan" ON pengajuan_izin FOR ALL USING (auth.jwt() ->> ''email'' = ''admin@gmail.com'' OR auth.role() = ''service_role'');' as recommended_policy
UNION ALL
SELECT 
    'CREATE POLICY "authenticated_read_pengajuan" ON pengajuan_izin FOR SELECT USING (auth.role() = ''authenticated'');' as recommended_policy
UNION ALL
SELECT 
    'CREATE POLICY "student_own_pengajuan" ON pengajuan_izin FOR SELECT USING (auth.jwt() ->> ''nis'' = nis);' as recommended_policy;

SELECT 'RLS DEBUG COMPLETED - Check results above!' as result;