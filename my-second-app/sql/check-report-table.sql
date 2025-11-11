-- CHECK REPORT TABLE STATUS
-- ===========================
-- Script untuk memeriksa status tabel report yang baru dibuat
-- Copy dan paste ke Supabase SQL Editor untuk memeriksa hasilnya

-- ===========================
-- 1. CHECK TABLE EXISTENCE
-- ===========================

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report' AND table_schema = 'public') 
        THEN '✅ Table "report" exists'
        ELSE '❌ Table "report" not found'
    END AS table_status;

-- ===========================
-- 2. CHECK TABLE STRUCTURE
-- ===========================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'report' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================
-- 3. CHECK ROW LEVEL SECURITY STATUS
-- ===========================

SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END AS rls_status
FROM pg_tables 
WHERE tablename = 'report' AND schemaname = 'public';

-- ===========================
-- 4. CHECK RLS POLICIES
-- ===========================

SELECT 
    policyname AS policy_name,
    cmd AS command_type,
    permissive,
    roles,
    qual AS using_condition,
    with_check AS check_condition
FROM pg_policies 
WHERE tablename = 'report' AND schemaname = 'public'
ORDER BY policyname;

-- ===========================
-- 5. CHECK INDEXES
-- ===========================

SELECT 
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes 
WHERE tablename = 'report' AND schemaname = 'public'
ORDER BY indexname;

-- ===========================
-- 6. CHECK FOREIGN KEY CONSTRAINTS
-- ===========================

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'report'
    AND tc.table_schema = 'public';

-- ===========================
-- 7. CHECK TRIGGERS
-- ===========================

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'report' 
    AND event_object_schema = 'public';

-- ===========================
-- 8. CHECK PERMISSIONS
-- ===========================

SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'report' AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- ===========================
-- 9. COUNT RECORDS (should be 0 for new table)
-- ===========================

SELECT 
    COUNT(*) AS record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Table is empty (as expected for new table)'
        ELSE CONCAT('ℹ️ Table contains ', COUNT(*), ' records')
    END AS record_status
FROM public.report;

-- ===========================
-- 10. FINAL SUMMARY
-- ===========================

DO $$
DECLARE
    table_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check table existence
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report' AND table_schema = 'public') INTO table_exists;
    
    -- Check RLS status
    SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = 'report' AND schemaname = 'public';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'report' AND schemaname = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE tablename = 'report' AND schemaname = 'public';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers WHERE event_object_table = 'report' AND event_object_schema = 'public';
    
    RAISE NOTICE '=====================================';
    RAISE NOTICE '🎯 REPORT TABLE SUMMARY';
    RAISE NOTICE '=====================================';
    
    IF table_exists THEN
        RAISE NOTICE '✅ Table exists: YES';
    ELSE
        RAISE NOTICE '❌ Table exists: NO';
    END IF;
    
    IF rls_enabled THEN
        RAISE NOTICE '✅ RLS enabled: YES';
    ELSE
        RAISE NOTICE '❌ RLS enabled: NO';
    END IF;
    
    RAISE NOTICE 'ℹ️ RLS Policies: % created', policy_count;
    RAISE NOTICE 'ℹ️ Indexes: % created', index_count;
    RAISE NOTICE 'ℹ️ Triggers: % created', trigger_count;
    
    RAISE NOTICE '=====================================';
    
    IF table_exists AND rls_enabled AND policy_count >= 4 AND index_count >= 4 AND trigger_count >= 1 THEN
        RAISE NOTICE '🎉 TABLE SETUP IS COMPLETE AND READY!';
    ELSE
        RAISE NOTICE '⚠️ TABLE SETUP MAY BE INCOMPLETE';
    END IF;
    
    RAISE NOTICE '=====================================';
END $$;

-- Success message
SELECT '🔍 REPORT TABLE CHECK COMPLETED!' AS final_message;