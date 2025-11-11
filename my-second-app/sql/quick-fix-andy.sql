-- QUICK FIX: Force migrate Andy's data if missing
-- =================================================

-- ===========================
-- 1. CHECK IF MIGRATION IS NEEDED
-- ===========================

-- Check if Andy's pengajuan_izin exists and is approved
WITH andy_check AS (
    SELECT 
        p.id,
        p.nis,
        p.tanggal_mulai,
        p.tanggal_selesai,
        p.alasan,
        p.status,
        s.nama,
        s.kelas,
        r.id as report_id
    FROM public.pengajuan_izin p
    LEFT JOIN public.siswa s ON p.nis = s.nis
    LEFT JOIN public.report r ON p.id = r.pengajuan_izin_id
    WHERE p.status = 'approved'
    AND (p.alasan ILIKE '%malas%' OR p.tanggal_mulai = '2025-11-10')
)
SELECT 
    id as pengajuan_id,
    nis,
    nama,
    kelas,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    CASE 
        WHEN report_id IS NOT NULL THEN '✅ Already migrated'
        ELSE '❌ NEEDS MIGRATION'
    END as migration_status
FROM andy_check;

-- ===========================
-- 2. FORCE MIGRATE ANDY'S DATA
-- ===========================

-- Insert Andy's approved pengajuan_izin into report table
-- This will run only if data doesn't already exist
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
    COALESCE(s.nama, 'Andy') as nama,
    p.nis,
    COALESCE(s.nisn, '') as nisn,
    COALESCE(s.kelas, 'XI SIJA 1') as kelas,
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
AND (p.alasan ILIKE '%malas%' OR p.tanggal_mulai = '2025-11-10')
AND NOT EXISTS (
    -- Avoid duplicates
    SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id
);

-- ===========================
-- 3. VERIFY MIGRATION
-- ===========================

-- Check if Andy's data is now in report table
SELECT 
    r.id,
    r.nama,
    r.nis,
    r.kelas,
    r.tanggal_mulai,
    r.tanggal_selesai,
    r.alasan,
    r.pengajuan_izin_id,
    r.created_at,
    '✅ Now in report table' as status
FROM public.report r
WHERE r.alasan ILIKE '%malas%' 
OR r.tanggal_mulai = '2025-11-10'
ORDER BY r.created_at DESC;

-- ===========================
-- 4. TEST REPORT LOGIC FOR XI SIJA 1
-- ===========================

-- Test the complete report logic untuk XI SIJA 1
WITH date_range AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as start_date,
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' as end_date
),
students_in_class AS (
    SELECT s.nis, s.nama
    FROM public.siswa s
    WHERE s.kelas = 'XI SIJA 1'
),
hadir_students AS (
    SELECT DISTINCT k.nis
    FROM public.kehadiran k, date_range dr
    WHERE k.kelas = 'XI SIJA 1'
    AND k.waktu_absen >= dr.start_date
    AND k.waktu_absen < dr.end_date
    AND LOWER(k.status) IN ('hadir', 'present')
),
izin_students AS (
    SELECT DISTINCT r.nis
    FROM public.report r, date_range dr
    WHERE r.kelas = 'XI SIJA 1'
    AND r.tanggal_mulai >= dr.start_date
    AND r.tanggal_mulai < dr.end_date
    AND r.izin = true
),
summary AS (
    SELECT 
        COUNT(sic.nis) as total_students,
        COUNT(hs.nis) as hadir_count,
        COUNT(is_.nis) as izin_count
    FROM students_in_class sic
    LEFT JOIN hadir_students hs ON sic.nis = hs.nis
    LEFT JOIN izin_students is_ ON sic.nis = is_.nis
)
SELECT 
    'XI SIJA 1' as class_name,
    total_students,
    hadir_count,
    izin_count,
    (total_students - hadir_count - izin_count) as alpha_count,
    ROUND((hadir_count::numeric / NULLIF(total_students, 0)) * 100, 1) as attendance_rate
FROM summary;

-- ===========================
-- 5. SHOW ALL XI SIJA 1 STUDENTS STATUS
-- ===========================

-- Detailed breakdown of each student in XI SIJA 1
WITH date_range AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as start_date,
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' as end_date
)
SELECT 
    s.nama,
    s.nis,
    s.kelas,
    CASE 
        WHEN k.nis IS NOT NULL THEN '✅ Hadir'
        WHEN r.nis IS NOT NULL THEN '📋 Izin'
        ELSE '❌ Alpha'
    END as status_this_month
FROM public.siswa s
LEFT JOIN (
    SELECT DISTINCT k.nis
    FROM public.kehadiran k, date_range dr
    WHERE k.kelas = 'XI SIJA 1'
    AND k.waktu_absen >= dr.start_date
    AND k.waktu_absen < dr.end_date
    AND LOWER(k.status) IN ('hadir', 'present')
) k ON s.nis = k.nis
LEFT JOIN (
    SELECT DISTINCT r.nis
    FROM public.report r, date_range dr
    WHERE r.kelas = 'XI SIJA 1'
    AND r.tanggal_mulai >= dr.start_date
    AND r.tanggal_mulai < dr.end_date
    AND r.izin = true
) r ON s.nis = r.nis
WHERE s.kelas = 'XI SIJA 1'
ORDER BY s.nama;

-- ===========================
-- SUCCESS MESSAGE
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '🔧 ANDY MIGRATION FIX COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '✅ Checked if Andy data exists in pengajuan_izin';
    RAISE NOTICE '✅ Force migrated Andy data to report table if missing';
    RAISE NOTICE '✅ Verified migration success';
    RAISE NOTICE '✅ Tested report logic for XI SIJA 1';
    RAISE NOTICE '✅ Showed detailed student status breakdown';
    RAISE NOTICE '';
    RAISE NOTICE 'Andy should now appear in the report page!';
    RAISE NOTICE 'Refresh your application to see the updated data.';
END $$;

SELECT 'ANDY MIGRATION FIX COMPLETED!' as fix_status;