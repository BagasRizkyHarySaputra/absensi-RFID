# Testing Dashboard dengan Integrasi Supabase

Folder ini berisi file testing untuk dashboard dengan integrasi database Supabase.

## File Testing:
- `test_dashboard.py` - Route testing untuk dashboard dengan data dari Supabase
- `test_dashboard.html` - Template HTML untuk testing
- `test_queries.py` - Testing query Supabase

## Struktur Database Supabase:

### Table: `siswa`
- id
- nama
- nis
- nisn
- kelas
- password

### Table: `kehadiran`
- id
- siswa_id (FK ke siswa)
- nama
- nis
- nisn
- kelas
- password_input
- waktu_absen
- status (hadir/ditolak)
- alasan_ditolak

## Cara Testing:
1. Pastikan .env sudah ada dengan SUPABASE_URL dan SUPABASE_KEY
2. Jalankan: `python testing/test_dashboard.py`
3. Buka browser: `http://localhost:5001`
