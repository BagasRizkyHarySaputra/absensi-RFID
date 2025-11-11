-- BASIC CHECK: Report table
-- ===========================

-- Query 4: Check report table content
SELECT 
    nama,
    nis,
    kelas,
    tanggal_mulai,
    tanggal_selesai,
    alasan
FROM public.report
ORDER BY created_at DESC;