-- BASIC CHECK: Siswa table
-- ==========================

-- Query 3: Check siswa table for XI SIJA 1
SELECT 
    nama,
    nis,
    kelas
FROM public.siswa
WHERE kelas = 'XI SIJA 1'
ORDER BY nama;