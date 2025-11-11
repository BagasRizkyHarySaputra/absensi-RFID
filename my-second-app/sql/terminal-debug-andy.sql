-- TERMINAL DEBUG: Check Andy migration status and test report logic
-- ================================================================

-- 1. Show Andy's data in pengajuan_izin
SELECT 
    'ANDY IN PENGAJUAN_IZIN:' as info,
    id,
    nis,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    status,
    created_at
FROM public.pengajuan_izin
WHERE alasan ILIKE '%malas%'
ORDER BY created_at DESC;

-- 2. Check if Andy exists in siswa table
SELECT 
    'ANDY IN SISWA TABLE:' as info,
    s.nama,
    s.nis,
    s.kelas
FROM public.siswa s
WHERE EXISTS (
    SELECT 1 FROM public.pengajuan_izin p 
    WHERE p.nis = s.nis 
    AND p.alasan ILIKE '%malas%'
);

-- 3. Check if Andy data migrated to report table
SELECT 
    'ANDY IN REPORT TABLE:' as info,
    r.nama,
    r.nis,
    r.kelas,
    r.tanggal_mulai,
    r.tanggal_selesai,
    r.alasan,
    r.pengajuan_izin_id
FROM public.report r
WHERE r.alasan ILIKE '%malas%'
OR r.pengajuan_izin_id IN (
    SELECT id FROM public.pengajuan_izin WHERE alasan ILIKE '%malas%'
);

-- 4. Force migrate Andy if not in report table
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

-- 5. Verify migration success
SELECT 
    'MIGRATION RESULT:' as info,
    COUNT(*) as records_inserted
FROM public.report
WHERE alasan ILIKE '%malas%';

-- 6. Test report logic for XI SIJA 1 (current month)
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
    'XI SIJA 1 REPORT SUMMARY:' as info,
    ts.count as total_students,
    hs.count as hadir_count,
    is_.count as izin_count,
    (ts.count - hs.count - is_.count) as alpha_count
FROM date_range dr, total_students ts, hadir_students hs, izin_students is_;

-- 7. Show all students in XI SIJA 1 with their status
SELECT 
    'STUDENT STATUS BREAKDOWN:' as info,
    s.nama,
    s.nis,
    CASE 
        WHEN k.nis IS NOT NULL THEN 'HADIR'
        WHEN r.nis IS NOT NULL THEN 'IZIN'
        ELSE 'ALPHA'
    END as status_this_month
FROM public.siswa s
LEFT JOIN (
    SELECT DISTINCT k.nis
    FROM public.kehadiran k
    WHERE k.kelas = 'XI SIJA 1'
    AND k.waktu_absen >= DATE_TRUNC('month', CURRENT_DATE)
    AND k.waktu_absen < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    AND LOWER(k.status) IN ('hadir', 'present')
) k ON s.nis = k.nis
LEFT JOIN (
    SELECT DISTINCT r.nis
    FROM public.report r
    WHERE r.kelas = 'XI SIJA 1'
    AND r.tanggal_mulai >= DATE_TRUNC('month', CURRENT_DATE)
    AND r.tanggal_mulai < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    AND r.izin = true
) r ON s.nis = r.nis
WHERE s.kelas = 'XI SIJA 1'
ORDER BY s.nama;

-- 8. Final check: Show Andy specifically
SELECT 
    'FINAL ANDY CHECK:' as info,
    s.nama,
    s.nis,
    s.kelas,
    r.tanggal_mulai,
    r.tanggal_selesai,
    r.alasan,
    'Should appear in report page now' as result
FROM public.siswa s
JOIN public.report r ON s.nis = r.nis
WHERE r.alasan ILIKE '%malas%';