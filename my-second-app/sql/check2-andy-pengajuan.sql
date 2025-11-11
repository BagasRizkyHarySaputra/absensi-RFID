-- BASIC CHECK: Andy's pengajuan data
-- ===================================

-- Query 2: Look for Andy's pengajuan specifically
SELECT 
    id,
    nis,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    status
FROM public.pengajuan_izin
WHERE alasan LIKE '%malas%' OR alasan LIKE '%Malas%'
ORDER BY created_at DESC;