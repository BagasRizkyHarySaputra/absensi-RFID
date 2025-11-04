# Struktur Tabel pengajuan_izin

## Nama Tabel: pengajuan_izin

### Kolom-kolom:

| Nama Kolom | Tipe Data | Nullable | Default | Constraint |
|------------|-----------|----------|---------|------------|
| id | int8 | ✗ | AUTO | PRIMARY KEY |
| nis | varchar(20) | ✗ | - | - |
| tanggal_mulai | date | ✗ | - | - |
| tanggal_selesai | date | ✗ | - | - |
| alasan | text | ✗ | - | - |
| keterangan | text | ✓ | NULL | - |
| file_pendukung | text | ✓ | NULL | - |
| status | varchar(20) | ✓ | 'pending' | CHECK (status IN ('pending', 'approved', 'rejected')) |
| tanggal_pengajuan | timestamptz | ✓ | now() | - |
| disetujui_oleh | varchar(20) | ✓ | NULL | - |
| tanggal_disetujui | timestamptz | ✓ | NULL | - |
| created_at | timestamptz | ✓ | now() | - |
| updated_at | timestamptz | ✓ | now() | - |

### Langkah-langkah di Table Editor:

1. **New Table** → Nama: `pengajuan_izin`
2. **Add Column** untuk setiap kolom di atas
3. **Set Primary Key** pada kolom `id`
4. **Set Default Values** sesuai tabel
5. **Enable RLS** (Row Level Security) jika diperlukan
6. **Save Table**

### Indexes yang Perlu Ditambahkan:

Setelah tabel dibuat, jalankan SQL berikut di SQL Editor:

```sql
CREATE INDEX idx_pengajuan_nis ON pengajuan_izin(nis);
CREATE INDEX idx_pengajuan_status ON pengajuan_izin(status);
CREATE INDEX idx_pengajuan_tanggal ON pengajuan_izin(tanggal_pengajuan);
```