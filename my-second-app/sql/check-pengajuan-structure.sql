-- CHECK PENGAJUAN_IZIN TABLE STRUCTURE
-- =====================================
-- Script untuk mengecek struktur tabel pengajuan_izin

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pengajuan_izin' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data with correct columns
SELECT 
    id,
    nis,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    status,
    created_at
FROM public.pengajuan_izin
LIMIT 5;

-- Check approved records
SELECT 
    COUNT(*) as total_approved,
    COUNT(DISTINCT nis) as unique_students
FROM public.pengajuan_izin
WHERE status = 'approved';

-- Check if siswa table has matching records for approved pengajuan
SELECT 
    p.nis,
    s.nama,
    s.nisn,
    s.kelas,
    CASE 
        WHEN s.nis IS NOT NULL THEN '✅ Found in siswa'
        ELSE '❌ NOT FOUND in siswa'
    END as siswa_status
FROM public.pengajuan_izin p
LEFT JOIN public.siswa s ON p.nis = s.nis
WHERE p.status = 'approved'
LIMIT 10;

SELECT 'PENGAJUAN_IZIN STRUCTURE CHECK COMPLETED!' as status;