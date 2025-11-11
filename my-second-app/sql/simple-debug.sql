-- SIMPLE DEBUG: Step-by-step check for Andy
-- ==========================================

-- Step 1: Check pengajuan_izin table
SELECT 
    '=== STEP 1: PENGAJUAN_IZIN TABLE ===' as step,
    COUNT(*) as total_records
FROM public.pengajuan_izin;

-- Step 2: Look for Andy's data in pengajuan_izin
SELECT 
    '=== STEP 2: ANDY DATA IN PENGAJUAN_IZIN ===' as step,
    id,
    nis,
    tanggal_mulai,
    tanggal_selesai,
    alasan,
    status
FROM public.pengajuan_izin
WHERE alasan ILIKE '%malas%'
LIMIT 5;

-- Step 3: Check all approved records
SELECT 
    '=== STEP 3: ALL APPROVED RECORDS ===' as step,
    COUNT(*) as approved_count
FROM public.pengajuan_izin
WHERE status = 'approved';

-- Step 4: Check siswa table for XI SIJA 1
SELECT 
    '=== STEP 4: SISWA IN XI SIJA 1 ===' as step,
    nama,
    nis,
    kelas
FROM public.siswa
WHERE kelas = 'XI SIJA 1'
LIMIT 10;

-- Step 5: Check report table content
SELECT 
    '=== STEP 5: REPORT TABLE CONTENT ===' as step,
    COUNT(*) as total_records
FROM public.report;

-- Step 6: Show report table data if any
SELECT 
    '=== STEP 6: REPORT TABLE DATA ===' as step,
    nama,
    nis,
    kelas,
    tanggal_mulai,
    alasan
FROM public.report
LIMIT 10;