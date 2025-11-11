-- MIGRATION SCRIPT: Transfer approved pengajuan_izin to report table
-- ===================================================================
-- Script untuk memindahkan data pengajuan izin yang sudah disetujui ke tabel report
-- Run this after creating the report table

-- ===========================
-- STEP 1: CHECK CURRENT STATE
-- ===========================

-- Check pengajuan_izin table
SELECT 
    'pengajuan_izin' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_records,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_records,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_records
FROM public.pengajuan_izin;

-- Check report table (should be empty)
SELECT 
    'report' as table_name,
    COUNT(*) as total_records
FROM public.report;

-- ===========================
-- STEP 2: MIGRATION EXECUTION
-- ===========================

-- Insert approved pengajuan_izin into report table
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
    COALESCE(s.nama, 'Unknown Student') as nama,  -- Get nama from siswa table
    p.nis,
    COALESCE(s.nisn, '') as nisn,  -- Get NISN from siswa table
    COALESCE(s.kelas, 'Unknown Class') as kelas,  -- Get kelas from siswa table
    TRUE as izin,  -- Always true for approved leaves
    p.tanggal_mulai,
    p.tanggal_selesai,
    p.alasan,
    p.id as pengajuan_izin_id,
    p.created_at,
    NOW() as updated_at
FROM public.pengajuan_izin p
LEFT JOIN public.siswa s ON p.nis = s.nis  -- Join to get nama, nisn, and kelas
WHERE p.status = 'approved'
AND NOT EXISTS (
    -- Avoid duplicates if migration is run multiple times
    SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id
);

-- ===========================
-- STEP 3: VERIFY MIGRATION
-- ===========================

-- Check migration results
DO $$
DECLARE
    approved_count INTEGER;
    migrated_count INTEGER;
    missing_count INTEGER;
BEGIN
    -- Count approved pengajuan_izin
    SELECT COUNT(*) INTO approved_count
    FROM public.pengajuan_izin 
    WHERE status = 'approved';
    
    -- Count records in report table
    SELECT COUNT(*) INTO migrated_count
    FROM public.report;
    
    -- Count missing migrations
    SELECT COUNT(*) INTO missing_count
    FROM public.pengajuan_izin p
    WHERE p.status = 'approved'
    AND NOT EXISTS (
        SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id
    );
    
    RAISE NOTICE '=====================================';
    RAISE NOTICE '📊 MIGRATION RESULTS';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Approved pengajuan_izin: %', approved_count;
    RAISE NOTICE 'Records in report table: %', migrated_count;
    RAISE NOTICE 'Missing migrations: %', missing_count;
    
    IF missing_count = 0 AND migrated_count > 0 THEN
        RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
    ELSIF approved_count = 0 THEN
        RAISE NOTICE 'ℹ️ No approved pengajuan_izin found to migrate';
    ELSIF missing_count > 0 THEN
        RAISE NOTICE '⚠️ Some records were not migrated. Check logs above.';
    ELSE
        RAISE NOTICE '❌ Migration may have failed. Please check the data.';
    END IF;
    
    RAISE NOTICE '=====================================';
END $$;

-- Show sample migrated data
SELECT 
    r.id,
    r.nama,
    r.nis,
    r.kelas,
    r.tanggal_mulai,
    r.tanggal_selesai,
    r.alasan,
    r.pengajuan_izin_id,
    p.status as original_status
FROM public.report r
JOIN public.pengajuan_izin p ON r.pengajuan_izin_id = p.id
ORDER BY r.created_at DESC
LIMIT 10;

-- ===========================
-- STEP 4: SETUP AUTOMATION TRIGGER
-- ===========================

-- Create function to automatically transfer new approved pengajuan_izin
CREATE OR REPLACE FUNCTION public.auto_transfer_approved_pengajuan()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Insert into report table
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
            COALESCE(s.nama, 'Unknown Student') as nama,  -- Get nama from siswa table
            NEW.nis,
            COALESCE(s.nisn, '') as nisn,
            COALESCE(s.kelas, 'Unknown Class') as kelas,  -- Get kelas from siswa table
            TRUE as izin,
            NEW.tanggal_mulai,
            NEW.tanggal_selesai,
            NEW.alasan,
            NEW.id,
            NEW.created_at,
            NOW()
        FROM public.siswa s
        WHERE s.nis = NEW.nis;
        
        -- If student not found in siswa table, insert with default values
        IF NOT FOUND THEN
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
                'Unknown Student',  -- Default nama if student not found
                NEW.nis,
                '',  -- Empty NISN if student not found
                'Unknown Class',  -- Default kelas if student not found
                TRUE,
                NEW.tanggal_mulai,
                NEW.tanggal_selesai,
                NEW.alasan,
                NEW.id,
                NEW.created_at,
                NOW()
            );
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_transfer_approved ON public.pengajuan_izin;
CREATE TRIGGER trigger_auto_transfer_approved
    AFTER UPDATE ON public.pengajuan_izin
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_transfer_approved_pengajuan();

-- ===========================
-- STEP 5: ADD UNIQUE CONSTRAINT
-- ===========================

-- Add unique constraint to prevent duplicate pengajuan_izin_id
ALTER TABLE public.report 
ADD CONSTRAINT unique_pengajuan_izin_id 
UNIQUE (pengajuan_izin_id);

-- ===========================
-- FINAL STATUS
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '🎉 MIGRATION AND AUTOMATION SETUP COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '✅ Migrated approved pengajuan_izin to report table';
    RAISE NOTICE '✅ Created automatic transfer trigger for future approvals';
    RAISE NOTICE '✅ Added unique constraint to prevent duplicates';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test the new report logic in your application';
    RAISE NOTICE '2. Verify that new approvals automatically appear in report table';
    RAISE NOTICE '3. Update your application code to use the new 3-source logic';
END $$;

SELECT 'MIGRATION COMPLETED - REPORT TABLE READY FOR USE!' AS final_status;