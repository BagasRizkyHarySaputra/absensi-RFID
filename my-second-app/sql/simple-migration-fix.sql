-- SIMPLE FIX: Migration & Automation without Constraint Issues
-- ===========================================================

-- 1. MIGRATE ALL APPROVED PENGAJUAN_IZIN TO REPORT
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
    SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id
)
ON CONFLICT (pengajuan_izin_id) DO NOTHING;  -- Handle duplicates gracefully

-- 2. CREATE/UPDATE AUTOMATION FUNCTION WITH SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.auto_transfer_approved_pengajuan()
RETURNS TRIGGER 
SECURITY DEFINER  -- Run with creator permissions to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    student_record RECORD;
BEGIN
    -- Only process if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
        
        RAISE NOTICE 'Processing approval for pengajuan_izin ID: %', NEW.id;
        
        -- Get student data
        SELECT nama, nisn, kelas 
        INTO student_record
        FROM public.siswa 
        WHERE nis = NEW.nis;
        
        IF NOT FOUND THEN
            student_record.nama := 'Unknown Student';
            student_record.nisn := '';
            student_record.kelas := 'Unknown Class';
        END IF;
        
        -- Insert into report table with conflict handling
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
            student_record.nama,
            NEW.nis,
            COALESCE(student_record.nisn, ''),
            student_record.kelas,
            TRUE,
            NEW.tanggal_mulai,
            NEW.tanggal_selesai,
            NEW.alasan,
            NEW.id,
            NEW.created_at,
            NOW()
        )
        ON CONFLICT (pengajuan_izin_id) DO NOTHING;  -- Graceful duplicate handling
        
        RAISE NOTICE 'Auto-transferred pengajuan_izin ID % to report table', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. RECREATE TRIGGER
DROP TRIGGER IF EXISTS trigger_auto_transfer_approved ON public.pengajuan_izin;
CREATE TRIGGER trigger_auto_transfer_approved
    AFTER UPDATE ON public.pengajuan_izin
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_transfer_approved_pengajuan();

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.auto_transfer_approved_pengajuan() TO service_role;
GRANT ALL ON public.report TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.report TO authenticated;

-- 5. VERIFY RESULTS
DO $$
DECLARE
    total_approved INTEGER;
    total_migrated INTEGER;
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_approved FROM public.pengajuan_izin WHERE status = 'approved';
    SELECT COUNT(*) INTO total_migrated FROM public.report;
    
    SELECT COUNT(*) INTO missing_count
    FROM public.pengajuan_izin p
    WHERE p.status = 'approved'
    AND NOT EXISTS (SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id);
    
    RAISE NOTICE '=====================================';
    RAISE NOTICE '📊 SIMPLE FIX RESULTS';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Approved pengajuan_izin: %', total_approved;
    RAISE NOTICE 'Migrated to report: %', total_migrated;
    RAISE NOTICE 'Missing migrations: %', missing_count;
    RAISE NOTICE '=====================================';
    
    IF missing_count = 0 THEN
        RAISE NOTICE '🎉 SUCCESS: All approved pengajuan migrated!';
        RAISE NOTICE '✅ Andy should now appear in report page';
        RAISE NOTICE '✅ Automation active for future approvals';
    ELSE
        RAISE NOTICE '⚠️ Still % records not migrated', missing_count;
    END IF;
    
    RAISE NOTICE '=====================================';
END $$;

-- 6. SHOW ANDY DATA TO CONFIRM
SELECT 
    'ANDY IN REPORT TABLE:' as status,
    nama,
    nis,
    kelas,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    created_at
FROM public.report 
WHERE alasan ILIKE '%malas%'
ORDER BY created_at DESC;

-- 7. SHOW ALL MIGRATED DATA
SELECT 
    'TOTAL MIGRATED RECORDS:' as status,
    COUNT(*) as total_count
FROM public.report;

SELECT 'SIMPLE MIGRATION FIX COMPLETED!' as result;