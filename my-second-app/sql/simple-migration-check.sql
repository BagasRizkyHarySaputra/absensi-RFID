-- SIMPLE MIGRATION CHECK: Andy specifically
-- ==========================================

-- 1. Check Andy in pengajuan_izin
SELECT 'Step 1: Andy in pengajuan_izin' as step;
SELECT id, nis, tanggal_mulai, alasan, status FROM public.pengajuan_izin WHERE alasan ILIKE '%malas%';

-- 2. Check Andy in siswa  
SELECT 'Step 2: Find Andy in siswa' as step;
SELECT s.nama, s.nis, s.kelas FROM public.siswa s 
WHERE s.nis IN (SELECT p.nis FROM public.pengajuan_izin p WHERE p.alasan ILIKE '%malas%');

-- 3. Check if Andy in report table
SELECT 'Step 3: Andy in report table' as step;  
SELECT COUNT(*) as andy_in_report FROM public.report WHERE alasan ILIKE '%malas%';

-- 4. Show report table content
SELECT 'Step 4: Report table content' as step;
SELECT * FROM public.report LIMIT 5;