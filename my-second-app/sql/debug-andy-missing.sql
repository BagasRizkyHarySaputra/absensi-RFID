-- DEBUG: Mengapa Andy XI SIJA 1 tidak muncul di report page
-- ================================================================

-- ===========================
-- 1. CHECK PENGAJUAN_IZIN TABLE FOR ANDY
-- ===========================

-- Cari data Andy di pengajuan_izin
SELECT 
    id,
    nis,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    status,
    tanggal_pengajuan,
    tanggal_disetujui,
    created_at,
    updated_at
FROM public.pengajuan_izin
WHERE alasan ILIKE '%malas%'
OR tanggal_mulai = '2025-11-10'
OR tanggal_selesai = '2025-11-10'
ORDER BY created_at DESC;

-- ===========================
-- 2. CHECK SISWA TABLE FOR ANDY
-- ===========================

-- Cari Andy di siswa table
SELECT 
    id,
    nama,
    nis,
    nisn,
    kelas,
    created_at
FROM public.siswa
WHERE nama ILIKE '%andy%'
OR kelas = 'XI SIJA 1'
ORDER BY nama;

-- ===========================  
-- 3. CHECK REPORT TABLE
-- ===========================

-- Cek apakah Andy sudah ada di report table
SELECT 
    id,
    nama,
    nis,
    nisn,
    kelas,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    pengajuan_izin_id,
    created_at
FROM public.report
WHERE nama ILIKE '%andy%'
OR kelas = 'XI SIJA 1'
OR alasan ILIKE '%malas%'
ORDER BY created_at DESC;

-- ===========================
-- 4. CHECK MIGRATION STATUS
-- ===========================

-- Cek apakah ada approved pengajuan yang belum di-migrate
WITH approved_pengajuan AS (
    SELECT 
        p.id,
        p.nis,
        p.tanggal_mulai,
        p.tanggal_selesai,
        p.alasan,
        p.status,
        s.nama,
        s.kelas
    FROM public.pengajuan_izin p
    LEFT JOIN public.siswa s ON p.nis = s.nis
    WHERE p.status = 'approved'
),
migrated_pengajuan AS (
    SELECT DISTINCT pengajuan_izin_id
    FROM public.report
    WHERE pengajuan_izin_id IS NOT NULL
)
SELECT 
    ap.id as pengajuan_id,
    ap.nis,
    ap.nama,
    ap.kelas,
    ap.tanggal_mulai,
    ap.tanggal_selesai,
    ap.alasan,
    CASE 
        WHEN mp.pengajuan_izin_id IS NOT NULL THEN '✅ Migrated'
        ELSE '❌ NOT Migrated'
    END as migration_status
FROM approved_pengajuan ap
LEFT JOIN migrated_pengajuan mp ON ap.id = mp.pengajuan_izin_id
WHERE ap.alasan ILIKE '%malas%' 
OR ap.kelas = 'XI SIJA 1'
OR ap.nama ILIKE '%andy%'
ORDER BY ap.tanggal_mulai DESC;

-- ===========================
-- 5. MANUAL MIGRATION FOR ANDY (if needed)
-- ===========================

-- Jika Andy belum di-migrate, migrate secara manual
-- Uncomment the INSERT below setelah memverifikasi data di step sebelumnya

/*
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
AND p.alasan ILIKE '%malas%'
AND NOT EXISTS (
    SELECT 1 FROM public.report r WHERE r.pengajuan_izin_id = p.id
);
*/

-- ===========================
-- 6. CHECK DATE RANGE ISSUE
-- ===========================

-- Cek apakah masalah ada di date range filtering
-- Data Andy: 10/11/2025 - 10/11/2025

-- Check current month range
WITH current_month AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as start_date,
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' as end_date
)
SELECT 
    'Current Month Range' as range_type,
    start_date,
    end_date,
    '2025-11-10'::date as andy_date,
    CASE 
        WHEN '2025-11-10'::date >= start_date::date 
         AND '2025-11-10'::date < end_date::date 
        THEN '✅ Andy date is in range'
        ELSE '❌ Andy date is NOT in range'
    END as date_check
FROM current_month;

-- ===========================
-- 7. TEST NEW REPORT LOGIC FOR XI SIJA 1
-- ===========================

-- Test getAttendanceSummary logic untuk XI SIJA 1
WITH date_range AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as start_date,
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' as end_date
),
total_students AS (
    SELECT COUNT(*) as count
    FROM public.siswa
    WHERE kelas = 'XI SIJA 1'
),
hadir_students AS (
    SELECT COUNT(DISTINCT k.nis) as count
    FROM public.kehadiran k, date_range dr
    WHERE k.kelas = 'XI SIJA 1'
    AND k.waktu_absen >= dr.start_date
    AND k.waktu_absen < dr.end_date
    AND LOWER(k.status) IN ('hadir', 'present')
),
izin_students AS (
    SELECT COUNT(DISTINCT r.nis) as count
    FROM public.report r, date_range dr
    WHERE r.kelas = 'XI SIJA 1'
    AND r.tanggal_mulai >= dr.start_date
    AND r.tanggal_mulai < dr.end_date
    AND r.izin = true
)
SELECT 
    'XI SIJA 1' as class_name,
    dr.start_date::date,
    dr.end_date::date,
    ts.count as total_students,
    hs.count as hadir_count,
    is_.count as izin_count,
    (ts.count - hs.count - is_.count) as alpha_count
FROM date_range dr, total_students ts, hadir_students hs, izin_students is_;

-- ===========================
-- 8. DETAILED IZIN DATA FOR XI SIJA 1
-- ===========================

-- Show all izin records for XI SIJA 1 in current month
SELECT 
    r.nama,
    r.nis,
    r.kelas,
    r.tanggal_mulai,
    r.tanggal_selesai,
    r.alasan,
    r.pengajuan_izin_id,
    r.created_at
FROM public.report r
WHERE r.kelas = 'XI SIJA 1'
AND r.tanggal_mulai >= DATE_TRUNC('month', CURRENT_DATE)
AND r.tanggal_mulai < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY r.tanggal_mulai DESC;

-- ===========================
-- SUMMARY
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '🔍 ANDY DEBUG ANALYSIS COMPLETED';
    RAISE NOTICE '';
    RAISE NOTICE 'Check the results above to identify the issue:';
    RAISE NOTICE '1. Is Andy data in pengajuan_izin table?';
    RAISE NOTICE '2. Is Andy data in siswa table?';
    RAISE NOTICE '3. Has Andy data been migrated to report table?';
    RAISE NOTICE '4. Is the date range correct for current month?';
    RAISE NOTICE '5. Are there any data consistency issues?';
    RAISE NOTICE '';
    RAISE NOTICE 'If migration is needed, uncomment the INSERT statement above.';
END $$;

SELECT 'ANDY DEBUG ANALYSIS COMPLETED!' as debug_status;