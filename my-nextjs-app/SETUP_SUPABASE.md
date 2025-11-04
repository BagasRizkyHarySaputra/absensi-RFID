# Setup Supabase untuk Sistem Absensi RFID

## 📋 Langkah-langkah Setup

### 1. Buat Project Supabase
1. Kunjungi [https://app.supabase.com/](https://app.supabase.com/)
2. Login atau daftar akun baru
3. Klik "New Project"
4. Pilih Organization
5. Isi nama project: `absensi-rfid`
6. Isi password database yang kuat
7. Pilih region terdekat (Singapore untuk Indonesia)
8. Klik "Create new project"

### 2. Dapatkan API Keys dan URL

#### Cara mendapatkan credentials:
1. Di dashboard project Supabase
2. Klik **Settings** (gear icon) di sidebar kiri
3. Klik **API** di menu settings
4. Copy nilai berikut:

```
Project URL: https://[project-ref].supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Setup Environment Variables

#### Buat file `.env.local` di root project:
```bash
# File: my-nextjs-app/.env.local

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **PENTING**: 
- Ganti `your-project-ref` dengan project reference Anda
- Ganti anon key dengan key yang sebenarnya
- Jangan commit file `.env.local` ke git
- File `.env.local` sudah ada di `.gitignore`

### 4. Buat Database Schema

#### SQL untuk membuat tabel sesuai struktur yang ada:

```sql
-- 1. Tabel siswa
CREATE TABLE siswa (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  nis VARCHAR(20) UNIQUE NOT NULL,
  nisn VARCHAR(20) UNIQUE NOT NULL,
  kelas VARCHAR(50) NOT NULL,
  password VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel kehadiran
CREATE TABLE kehadiran (
  id SERIAL PRIMARY KEY,
  siswa_id INTEGER REFERENCES siswa(id) ON DELETE CASCADE,
  nama VARCHAR(100) NOT NULL,
  nis VARCHAR(20) NOT NULL,
  nisn VARCHAR(20) NOT NULL,
  kelas VARCHAR(50) NOT NULL,
  password_input VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  alasan_ditolak TEXT,
  waktu_absen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX idx_kehadiran_siswa_id ON kehadiran(siswa_id);
CREATE INDEX idx_kehadiran_waktu_absen ON kehadiran(waktu_absen);
CREATE INDEX idx_kehadiran_status ON kehadiran(status);
CREATE INDEX idx_kehadiran_kelas ON kehadiran(kelas);
CREATE INDEX idx_siswa_nis ON siswa(nis);
CREATE INDEX idx_siswa_nisn ON siswa(nisn);
CREATE INDEX idx_siswa_kelas ON siswa(kelas);

-- 4. Create trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_siswa_updated_at BEFORE UPDATE ON siswa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kehadiran_updated_at BEFORE UPDATE ON kehadiran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Cara menjalankan SQL:
1. Di dashboard Supabase, klik **SQL Editor**
2. Copy paste SQL di atas
3. Klik **Run** untuk menjalankan

### 5. Insert Sample Data (Opsional)

```sql
-- Insert sample siswa
INSERT INTO siswa (nama, nis, nisn, kelas, password) VALUES
('Ahmad Pratama', '244110001', '1234567891', 'XI SIJA 1', 'password123'),
('Siti Nurhaliza', '244110002', '1234567892', 'XI SIJA 1', 'password123'),
('Budi Santoso', '244110003', '1234567893', 'XI SIJA 2', 'password123'),
('Rina Kusuma', '244110004', '1234567894', 'XI SIJA 2', 'password123'),
('Joko Widodo', '244110005', '1234567895', 'XI SIJA 3', 'password123');

-- Insert sample kehadiran
INSERT INTO kehadiran (siswa_id, nama, nis, nisn, kelas, status, waktu_absen)
SELECT 
  s.id,
  s.nama,
  s.nis,
  s.nisn,
  s.kelas,
  'hadir',
  NOW() - INTERVAL '1 day'
FROM siswa s WHERE s.nis = '244110001';

INSERT INTO kehadiran (siswa_id, nama, nis, nisn, kelas, status, alasan_ditolak, waktu_absen)
SELECT 
  s.id,
  s.nama,
  s.nis,
  s.nisn,
  s.kelas,
  'tidak_hadir',
  'Tidak ada keterangan',
  NOW() - INTERVAL '2 days'
FROM siswa s WHERE s.nis = '244110002';
```

### 6. Setup Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kehadiran ENABLE ROW LEVEL SECURITY;

-- Policies untuk read access (untuk demo)
CREATE POLICY "Allow public read access" ON siswa FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON kehadiran FOR SELECT USING (true);

-- Insert policies (bisa dibatasi kemudian)
CREATE POLICY "Allow public insert" ON kehadiran FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON siswa FOR INSERT WITH CHECK (true);

-- Update policies (bisa dibatasi kemudian)
CREATE POLICY "Allow public update" ON kehadiran FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON siswa FOR UPDATE USING (true);
```

## 🔧 Troubleshooting

### Error: Export supabaseClient doesn't exist
✅ **Sudah Diperbaiki**: Import sudah diubah dari `supabaseClient` ke `supabase`

### Environment Variables tidak terbaca
- Restart development server: `npm run dev`
- Pastikan file `.env.local` di root folder `my-nextjs-app/`
- Pastikan nama variable dimulai dengan `NEXT_PUBLIC_`

### Database connection error
- Periksa URL dan API key di `.env.local`
- Pastikan project Supabase sudah aktif
- Periksa network connection

## 📝 Next Steps

1. ✅ Buat project Supabase
2. ✅ Setup environment variables
3. ✅ Buat database schema
4. ✅ Test connection dengan aplikasi
5. 🔄 Integrate dengan RFID reader (next phase)

## 🔐 Security Notes

- **anon/public key**: Aman untuk client-side, sudah ter-enkripsi
- **service_role key**: JANGAN gunakan di client-side
- **Database password**: Simpan dengan aman
- **RLS**: Aktifkan Row Level Security untuk production