-- SEQUENTIAL DEBUG: Run one by one
-- ==================================

-- 1. First check: pengajuan_izin table existence
SELECT 'CHECK 1: pengajuan_izin table' as check_name;
SELECT COUNT(*) as total_pengajuan FROM public.pengajuan_izin;

-- 2. Second check: approved pengajuan
SELECT 'CHECK 2: approved pengajuan' as check_name;  
SELECT COUNT(*) as approved_count FROM public.pengajuan_izin WHERE status = 'approved';

-- 3. Third check: Andy's specific data
SELECT 'CHECK 3: Andy data search' as check_name;
SELECT * FROM public.pengajuan_izin WHERE tanggal_mulai = '2025-11-10' LIMIT 5;

-- 4. Fourth check: report table  
SELECT 'CHECK 4: report table' as check_name;
SELECT COUNT(*) as report_count FROM public.report;

-- 5. Fifth check: XI SIJA 1 students
SELECT 'CHECK 5: XI SIJA 1 students' as check_name;
SELECT COUNT(*) as xi_sija_1_count FROM public.siswa WHERE kelas = 'XI SIJA 1';