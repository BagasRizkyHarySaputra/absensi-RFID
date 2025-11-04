# Database Structure Documentation

## Struktur Database Sistem Absensi RFID

### Tabel `siswa`
Tabel utama untuk menyimpan data siswa.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | ID unik siswa (auto increment) |
| nama | VARCHAR(100) | NOT NULL | Nama lengkap siswa |
| nis | VARCHAR(20) | UNIQUE, NOT NULL | Nomor Induk Siswa |
| nisn | VARCHAR(20) | UNIQUE, NOT NULL | Nomor Induk Siswa Nasional |
| kelas | VARCHAR(50) | NOT NULL | Kelas siswa (XI SIJA 1, dll) |
| password | VARCHAR(255) | NULL | Password hash untuk autentikasi |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Waktu pembuatan record |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Waktu update terakhir |

### Tabel `kehadiran`
Tabel untuk menyimpan data kehadiran siswa.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | ID unik kehadiran (auto increment) |
| siswa_id | INTEGER | REFERENCES siswa(id) | Foreign key ke tabel siswa |
| nama | VARCHAR(100) | NOT NULL | Nama siswa (denormalized) |
| nis | VARCHAR(20) | NOT NULL | NIS siswa (denormalized) |
| nisn | VARCHAR(20) | NOT NULL | NISN siswa (denormalized) |
| kelas | VARCHAR(50) | NOT NULL | Kelas siswa (denormalized) |
| password_input | VARCHAR(255) | NULL | Password yang diinput saat absen |
| status | VARCHAR(20) | DEFAULT 'pending' | Status kehadiran |
| alasan_ditolak | TEXT | NULL | Alasan jika status ditolak |
| waktu_absen | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Waktu absen |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Waktu pembuatan record |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Waktu update terakhir |

## Status Kehadiran

| Status | Description | Display Status |
|--------|-------------|----------------|
| hadir | Siswa hadir tepat waktu | Accepted |
| terlambat | Siswa hadir terlambat | Pending |
| tidak_hadir | Siswa tidak hadir | Rejected |
| izin | Siswa izin dengan keterangan | Pending |
| sakit | Siswa sakit dengan surat | Accepted |
| pending | Menunggu verifikasi | Pending |

## Relasi Database

```
siswa (1) -----> (N) kehadiran
  ^                    ^
  |                    |
  id              siswa_id
```

### Denormalisasi Data
Tabel `kehadiran` menggunakan denormalisasi untuk performa yang lebih baik:
- `nama`, `nis`, `nisn`, `kelas` disimpan langsung di tabel kehadiran
- Data tetap terhubung melalui `siswa_id` untuk integritas referensial

## Indexes untuk Performa

```sql
-- Indexes pada tabel siswa
CREATE INDEX idx_siswa_nis ON siswa(nis);
CREATE INDEX idx_siswa_nisn ON siswa(nisn);
CREATE INDEX idx_siswa_kelas ON siswa(kelas);

-- Indexes pada tabel kehadiran
CREATE INDEX idx_kehadiran_siswa_id ON kehadiran(siswa_id);
CREATE INDEX idx_kehadiran_waktu_absen ON kehadiran(waktu_absen);
CREATE INDEX idx_kehadiran_status ON kehadiran(status);
CREATE INDEX idx_kehadiran_kelas ON kehadiran(kelas);
```

## Triggers

### Auto Update Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_siswa_updated_at 
  BEFORE UPDATE ON siswa 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kehadiran_updated_at 
  BEFORE UPDATE ON kehadiran 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Query Examples

### Ambil kehadiran dengan data siswa
```sql
SELECT 
  k.*,
  s.password as siswa_password
FROM kehadiran k
LEFT JOIN siswa s ON k.siswa_id = s.id
WHERE k.kelas = 'XI SIJA 1'
ORDER BY k.waktu_absen DESC;
```

### Statistik kehadiran per kelas
```sql
SELECT 
  kelas,
  COUNT(*) as total_absen,
  COUNT(CASE WHEN status = 'hadir' THEN 1 END) as hadir,
  COUNT(CASE WHEN status = 'terlambat' THEN 1 END) as terlambat,
  COUNT(CASE WHEN status = 'tidak_hadir' THEN 1 END) as tidak_hadir
FROM kehadiran
GROUP BY kelas;
```

### Kehadiran siswa hari ini
```sql
SELECT *
FROM kehadiran
WHERE DATE(waktu_absen) = CURRENT_DATE
ORDER BY waktu_absen DESC;
```

## Migration Notes

Jika menggunakan struktur database yang berbeda sebelumnya, lakukan migration:

1. **Backup data existing** sebelum migration
2. **Buat tabel baru** sesuai struktur di atas
3. **Migrate data** dari struktur lama ke baru
4. **Update aplikasi** untuk menggunakan field names yang baru
5. **Test thoroughly** semua functionality

## Security Considerations

1. **Password Hashing**: Gunakan bcrypt atau argon2 untuk hash password
2. **Input Validation**: Validasi semua input sebelum masuk database
3. **SQL Injection Prevention**: Gunakan parameterized queries
4. **RLS (Row Level Security)**: Setup policies yang sesuai untuk production
5. **Rate Limiting**: Implementasi rate limiting untuk prevent abuse