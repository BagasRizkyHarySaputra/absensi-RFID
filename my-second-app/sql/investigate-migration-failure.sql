-- INVESTIGATE MIGRATION AUTOMATION FAILURE
-- ==========================================

-- 1. CHECK IF MIGRATION SCRIPT EVER RUN
SELECT 'Migration Script Status:' as check_type;

-- Check if migration script was ever executed (should create records)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.report) THEN '✅ Migration script has been executed'
        ELSE '❌ Migration script NEVER executed'
    END as migration_status;

-- 2. CHECK AUTOMATION TRIGGER EXISTENCE
SELECT 'Trigger Status:' as check_type;

-- Check if trigger exists
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ Trigger exists'
        ELSE '❌ Trigger MISSING'
    END as trigger_status
FROM information_schema.triggers 
WHERE event_object_table = 'pengajuan_izin' 
AND trigger_name = 'trigger_auto_transfer_approved';

-- 3. CHECK TRIGGER FUNCTION EXISTENCE  
SELECT 'Function Status:' as check_type;

-- Check if trigger function exists
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IS NOT NULL THEN '✅ Function exists'
        ELSE '❌ Function MISSING'
    END as function_status
FROM information_schema.routines 
WHERE routine_name = 'auto_transfer_approved_pengajuan'
AND routine_schema = 'public';

-- 4. CHECK UNIQUE CONSTRAINT
SELECT 'Constraint Status:' as check_type;

-- Check if unique constraint exists on pengajuan_izin_id
SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name IS NOT NULL THEN '✅ Unique constraint exists'
        ELSE '❌ Unique constraint MISSING'
    END as constraint_status
FROM information_schema.table_constraints 
WHERE table_name = 'report' 
AND constraint_type = 'UNIQUE'
AND constraint_name = 'unique_pengajuan_izin_id';

-- 5. CHECK APPROVED PENGAJUAN THAT SHOULD BE MIGRATED
SELECT 'Missing Migrations:' as check_type;

-- Find all approved pengajuan_izin that are NOT in report table
SELECT 
    p.id as pengajuan_id,
    p.nis,
    p.tanggal_mulai,
    p.tanggal_selesai,
    p.alasan,
    p.status,
    p.tanggal_disetujui,
    s.nama,
    s.kelas,
    'NOT MIGRATED' as migration_status
FROM public.pengajuan_izin p
LEFT JOIN public.siswa s ON p.nis = s.nis
WHERE p.status = 'approved'
AND NOT EXISTS (
    SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id
)
ORDER BY p.tanggal_disetujui DESC;

-- 6. CHECK WHEN ANDY WAS APPROVED VS WHEN AUTOMATION WAS CREATED
SELECT 'Timeline Analysis:' as check_type;

-- Andy's approval timeline
SELECT 
    'Andy Approval:' as event_type,
    tanggal_disetujui as event_time,
    'Andy was approved at this time' as note
FROM public.pengajuan_izin 
WHERE alasan ILIKE '%malas%'
AND status = 'approved';

-- Report table creation timeline (approximately)
SELECT 
    'Report Table:' as event_type,
    created_at as event_time,
    'First record in report table (table creation time)' as note
FROM public.report 
ORDER BY created_at ASC 
LIMIT 1;

-- 7. DIAGNOSTIC SUMMARY
SELECT 'DIAGNOSTIC SUMMARY:' as summary_type;

WITH diagnostics AS (
    SELECT 
        (SELECT COUNT(*) FROM public.pengajuan_izin WHERE status = 'approved') as total_approved,
        (SELECT COUNT(*) FROM public.report) as total_migrated,
        (SELECT COUNT(*) FROM information_schema.triggers 
         WHERE event_object_table = 'pengajuan_izin' 
         AND trigger_name = 'trigger_auto_transfer_approved') as trigger_count,
        (SELECT COUNT(*) FROM information_schema.routines 
         WHERE routine_name = 'auto_transfer_approved_pengajuan') as function_count
)
SELECT 
    total_approved,
    total_migrated,
    (total_approved - total_migrated) as missing_migrations,
    trigger_count,
    function_count,
    CASE 
        WHEN trigger_count = 0 THEN '❌ NO TRIGGER - Automation never set up'
        WHEN function_count = 0 THEN '❌ NO FUNCTION - Trigger exists but function missing'
        WHEN total_migrated = 0 THEN '❌ NO INITIAL MIGRATION - Migration script never run'
        WHEN (total_approved - total_migrated) > 0 THEN '⚠️ PARTIAL MIGRATION - Some approvals happened before automation'
        ELSE '✅ ALL GOOD - Automation working correctly'
    END as diagnosis
FROM diagnostics;