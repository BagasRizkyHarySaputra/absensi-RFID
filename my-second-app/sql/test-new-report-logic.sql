-- TEST NEW REPORT LOGIC
-- ========================
-- Script untuk menguji logic baru dengan 3 sumber data

-- ===========================
-- 1. CHECK DATA AVAILABILITY
-- ===========================

-- Check siswa data
SELECT 
    'siswa' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT kelas) as unique_classes
FROM public.siswa;

-- Check kehadiran data (hadir source)
SELECT 
    'kehadiran' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT kelas) as unique_classes,
    MIN(waktu_absen) as earliest_date,
    MAX(waktu_absen) as latest_date
FROM public.kehadiran;

-- Check report data (izin source)
SELECT 
    'report' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT kelas) as unique_classes,
    MIN(tanggal_mulai) as earliest_date,
    MAX(tanggal_selesai) as latest_date
FROM public.report;

-- ===========================
-- 2. SAMPLE DATA PER CLASS
-- ===========================

-- Show sample data distribution
WITH class_stats AS (
    SELECT 
        s.kelas,
        COUNT(s.nis) as total_students,
        COUNT(k.nis) as hadir_entries,
        COUNT(r.nis) as izin_entries
    FROM public.siswa s
    LEFT JOIN public.kehadiran k ON s.nis = k.nis AND s.kelas = k.kelas
        AND k.waktu_absen >= DATE_TRUNC('month', CURRENT_DATE)
        AND k.waktu_absen < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    LEFT JOIN public.report r ON s.nis = r.nis AND s.kelas = r.kelas
        AND r.tanggal_mulai >= DATE_TRUNC('month', CURRENT_DATE)
        AND r.tanggal_mulai < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    GROUP BY s.kelas
    ORDER BY s.kelas
)
SELECT 
    kelas,
    total_students,
    hadir_entries,
    izin_entries,
    (total_students - COALESCE(hadir_entries, 0) - COALESCE(izin_entries, 0)) as calculated_alpha
FROM class_stats;

-- ===========================
-- 3. TEST SPECIFIC CLASS
-- ===========================

-- Test logic for a specific class (replace 'XI SIJA 1' with your class)
WITH test_class AS (
    SELECT 'XI SIJA 1' as target_class
),
date_range AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as start_date,
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' as end_date
),
total_students AS (
    SELECT COUNT(*) as count
    FROM public.siswa s, test_class tc
    WHERE s.kelas = tc.target_class
),
hadir_students AS (
    SELECT COUNT(DISTINCT k.nis) as count
    FROM public.kehadiran k, test_class tc, date_range dr
    WHERE k.kelas = tc.target_class
    AND k.waktu_absen >= dr.start_date
    AND k.waktu_absen < dr.end_date
    AND LOWER(k.status) IN ('hadir', 'present')
),
izin_students AS (
    SELECT COUNT(DISTINCT r.nis) as count
    FROM public.report r, test_class tc, date_range dr
    WHERE r.kelas = tc.target_class
    AND r.tanggal_mulai >= dr.start_date
    AND r.tanggal_mulai < dr.end_date
    AND r.izin = true
)
SELECT 
    tc.target_class as class_name,
    dr.start_date::date,
    dr.end_date::date,
    ts.count as total_students,
    hs.count as hadir_count,
    is_.count as izin_count,
    (ts.count - hs.count - is_.count) as alpha_count
FROM test_class tc, date_range dr, total_students ts, hadir_students hs, izin_students is_;

-- ===========================
-- 4. CHECK FOR DATA OVERLAPS
-- ===========================

-- Check if same student appears in both hadir and izin on same day
WITH potential_conflicts AS (
    SELECT 
        k.nis,
        k.kelas,
        k.waktu_absen::date as hadir_date,
        r.tanggal_mulai::date as izin_start,
        r.tanggal_selesai::date as izin_end
    FROM public.kehadiran k
    JOIN public.report r ON k.nis = r.nis AND k.kelas = r.kelas
    WHERE k.waktu_absen::date BETWEEN r.tanggal_mulai::date AND r.tanggal_selesai::date
)
SELECT 
    COUNT(*) as conflict_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No conflicts found'
        ELSE '⚠️ Data conflicts detected'
    END as status
FROM potential_conflicts;

-- Show conflicts if any
SELECT 
    nis,
    kelas,
    hadir_date,
    izin_start,
    izin_end,
    'Student marked both hadir and izin on same period' as issue
FROM (
    SELECT 
        k.nis,
        k.kelas,
        k.waktu_absen::date as hadir_date,
        r.tanggal_mulai::date as izin_start,
        r.tanggal_selesai::date as izin_end
    FROM public.kehadiran k
    JOIN public.report r ON k.nis = r.nis AND k.kelas = r.kelas
    WHERE k.waktu_absen::date BETWEEN r.tanggal_mulai::date AND r.tanggal_selesai::date
) conflicts
LIMIT 10;

-- ===========================
-- 5. MONTHLY SUMMARY ALL CLASSES
-- ===========================

-- Generate summary for all classes (current month)
WITH monthly_summary AS (
    SELECT 
        s.kelas,
        COUNT(DISTINCT s.nis) as total_students,
        
        -- Count hadir (unique students who attended)
        COUNT(DISTINCT CASE 
            WHEN k.waktu_absen >= DATE_TRUNC('month', CURRENT_DATE)
            AND k.waktu_absen < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            AND LOWER(k.status) IN ('hadir', 'present')
            THEN k.nis 
        END) as hadir_students,
        
        -- Count izin (unique students with approved leave)
        COUNT(DISTINCT CASE 
            WHEN r.tanggal_mulai >= DATE_TRUNC('month', CURRENT_DATE)
            AND r.tanggal_mulai < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            AND r.izin = true
            THEN r.nis 
        END) as izin_students
        
    FROM public.siswa s
    LEFT JOIN public.kehadiran k ON s.nis = k.nis AND s.kelas = k.kelas
    LEFT JOIN public.report r ON s.nis = r.nis AND s.kelas = r.kelas
    GROUP BY s.kelas
    ORDER BY s.kelas
)
SELECT 
    kelas,
    total_students,
    hadir_students as hadir,
    izin_students as izin,
    (total_students - hadir_students - izin_students) as alpha,
    ROUND(
        (hadir_students::numeric / NULLIF(total_students, 0)) * 100, 1
    ) as attendance_rate_pct
FROM monthly_summary;

-- ===========================
-- FINAL STATUS
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '🧪 NEW REPORT LOGIC TEST COMPLETED';
    RAISE NOTICE '';
    RAISE NOTICE 'Logic Summary:';
    RAISE NOTICE '1. Hadir = Count from kehadiran table (status = hadir/present)';
    RAISE NOTICE '2. Izin = Count from report table (approved leaves)';
    RAISE NOTICE '3. Alpha = Total students - Hadir - Izin';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the results above to ensure logic is working correctly.';
    RAISE NOTICE 'If you see conflicts, you may need to adjust your data entry process.';
END $$;

SELECT 'NEW REPORT LOGIC TEST COMPLETED!' AS test_status;