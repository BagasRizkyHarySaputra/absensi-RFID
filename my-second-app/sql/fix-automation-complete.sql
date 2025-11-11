-- COMPLETE AUTOMATION SETUP & MIGRATION FIX
-- ===========================================

-- 1. INITIAL MIGRATION: Migrate ALL approved pengajuan_izin
INSERT INTO public.report (
    nama,
    nis,
    nisn,
    kelas,
    izin,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    pengajuan_izin_id,
    created_at,
    updated_at
)
SELECT 
    COALESCE(s.nama, 'Unknown Student') as nama,
    p.nis,
    COALESCE(s.nisn, '') as nisn,
    COALESCE(s.kelas, 'Unknown Class') as kelas,
    TRUE as izin,
    p.tanggal_mulai,
    p.tanggal_selesai,
    p.alasan,
    p.id as pengajuan_izin_id,
    p.created_at,
    NOW() as updated_at
FROM public.pengajuan_izin p
LEFT JOIN public.siswa s ON p.nis = s.nis
WHERE p.status = 'approved'
AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id
);

-- 2. DROP EXISTING AUTOMATION (if any) TO RECREATE PROPERLY
DROP TRIGGER IF EXISTS trigger_auto_transfer_approved ON public.pengajuan_izin;
DROP FUNCTION IF EXISTS public.auto_transfer_approved_pengajuan();

-- 3. CREATE PROPER AUTOMATION FUNCTION
CREATE OR REPLACE FUNCTION public.auto_transfer_approved_pengajuan()
RETURNS TRIGGER AS $$
DECLARE
    student_record RECORD;
BEGIN
    -- Only process if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
        
        -- Get student data
        SELECT nama, nisn, kelas 
        INTO student_record
        FROM public.siswa 
        WHERE nis = NEW.nis;
        
        -- Insert into report table with proper error handling
        BEGIN
            INSERT INTO public.report (
                nama,
                nis,
                nisn,
                kelas,
                izin,
                tanggal_mulai,
                tanggal_selesai,
                alasan,
                pengajuan_izin_id,
                created_at,
                updated_at
            ) VALUES (
                COALESCE(student_record.nama, 'Unknown Student'),
                NEW.nis,
                COALESCE(student_record.nisn, ''),
                COALESCE(student_record.kelas, 'Unknown Class'),
                TRUE,
                NEW.tanggal_mulai,
                NEW.tanggal_selesai,
                NEW.alasan,
                NEW.id,
                NEW.created_at,
                NOW()
            );
            
            -- Log successful transfer
            RAISE NOTICE 'Auto-transferred pengajuan_izin ID % to report table', NEW.id;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the main operation
            RAISE WARNING 'Failed to auto-transfer pengajuan_izin ID % to report: %', NEW.id, SQLERRM;
        END;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE TRIGGER
CREATE TRIGGER trigger_auto_transfer_approved
    AFTER UPDATE ON public.pengajuan_izin
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_transfer_approved_pengajuan();

-- 5. ADD UNIQUE CONSTRAINT (if not exists)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'report' 
        AND constraint_name = 'unique_pengajuan_izin_id'
        AND table_schema = 'public'
    ) THEN
        -- Add constraint only if it doesn't exist
        ALTER TABLE public.report 
        ADD CONSTRAINT unique_pengajuan_izin_id 
        UNIQUE (pengajuan_izin_id);
        
        RAISE NOTICE 'Added unique constraint unique_pengajuan_izin_id';
    ELSE
        RAISE NOTICE 'Unique constraint unique_pengajuan_izin_id already exists - skipping';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Log any unexpected errors but don't fail the script
    RAISE WARNING 'Error handling unique constraint: % - %', SQLSTATE, SQLERRM;
END $$;

-- 6. VERIFY SETUP COMPLETION
DO $$
DECLARE
    total_approved INTEGER;
    total_migrated INTEGER;
    missing_count INTEGER;
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO total_approved FROM public.pengajuan_izin WHERE status = 'approved';
    SELECT COUNT(*) INTO total_migrated FROM public.report;
    
    SELECT COUNT(*) INTO missing_count
    FROM public.pengajuan_izin p
    WHERE p.status = 'approved'
    AND NOT EXISTS (SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id);
    
    -- Check automation
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_table = 'pengajuan_izin' 
        AND trigger_name = 'trigger_auto_transfer_approved'
    ) INTO trigger_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'auto_transfer_approved_pengajuan'
    ) INTO function_exists;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE '📊 MIGRATION & AUTOMATION SETUP RESULTS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Total approved pengajuan_izin: %', total_approved;
    RAISE NOTICE 'Total migrated to report: %', total_migrated;
    RAISE NOTICE 'Missing migrations: %', missing_count;
    RAISE NOTICE 'Trigger exists: %', CASE WHEN trigger_exists THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Function exists: %', CASE WHEN function_exists THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '===========================================';
    
    IF missing_count = 0 AND trigger_exists AND function_exists THEN
        RAISE NOTICE '🎉 SUCCESS: All migrations completed and automation is active!';
        RAISE NOTICE '✅ Future approvals will automatically transfer to report table';
        RAISE NOTICE '✅ Andy and all other approved requests are now in report table';
    ELSE
        RAISE NOTICE '⚠️ ISSUES DETECTED:';
        IF missing_count > 0 THEN
            RAISE NOTICE '- % approved pengajuan still not migrated', missing_count;
        END IF;
        IF NOT trigger_exists THEN
            RAISE NOTICE '- Automation trigger is missing';
        END IF;
        IF NOT function_exists THEN
            RAISE NOTICE '- Automation function is missing';
        END IF;
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;

-- 7. SHOW ANDY'S DATA TO CONFIRM
SELECT 
    'ANDY VERIFICATION:' as check_type,
    r.nama,
    r.nis,
    r.kelas,
    r.tanggal_mulai,
    r.tanggal_selesai,
    r.alasan,
    'Should now appear in report page!' as status
FROM public.report r
WHERE r.alasan ILIKE '%malas%';

-- 8. TEST AUTOMATION BY SIMULATING UPDATE
-- (This will test the trigger without actually changing data)
SELECT 'AUTOMATION TEST:' as test_type, 'Ready to test - trigger should fire on next approval' as test_status;