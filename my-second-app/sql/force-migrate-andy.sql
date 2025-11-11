-- FORCE MIGRATE ANDY: Simple and direct
-- =====================================

-- Step 1: Check current state
SELECT 'BEFORE MIGRATION:' as status, COUNT(*) as report_count FROM public.report;

-- Step 2: Force migrate Andy's data
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

-- Step 3: Verify migration
SELECT 'AFTER MIGRATION:' as status, COUNT(*) as report_count FROM public.report;

-- Step 4: Show Andy's migrated data
SELECT 
    'ANDY DATA IN REPORT:' as result,
    nama,
    nis,
    kelas,
    tanggal_mulai,
    tanggal_selesai,
    alasan
FROM public.report 
WHERE alasan ILIKE '%malas%';

-- Step 5: Test XI SIJA 1 summary
WITH xi_sija_summary AS (
    SELECT 
        COUNT(DISTINCT s.nis) as total_students,
        COUNT(DISTINCT r.nis) as izin_students
    FROM public.siswa s
    LEFT JOIN public.report r ON s.nis = r.nis 
        AND r.kelas = 'XI SIJA 1'
        AND r.tanggal_mulai >= DATE_TRUNC('month', CURRENT_DATE)
        AND r.tanggal_mulai < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    WHERE s.kelas = 'XI SIJA 1'
)
SELECT 
    'XI SIJA 1 SUMMARY:' as result,
    total_students,
    izin_students,
    'Andy should now appear in report page' as note
FROM xi_sija_summary;