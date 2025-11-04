-- Buat tabel pengajuan_izin
CREATE TABLE pengajuan_izin (
  id SERIAL PRIMARY KEY,
  nis VARCHAR(20) NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  alasan TEXT NOT NULL,
  keterangan TEXT,
  file_pendukung TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tanggal_pengajuan TIMESTAMP DEFAULT NOW(),
  disetujui_oleh VARCHAR(20),
  tanggal_disetujui TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Buat indexes untuk performa
CREATE INDEX idx_pengajuan_nis ON pengajuan_izin(nis);
CREATE INDEX idx_pengajuan_status ON pengajuan_izin(status);
CREATE INDEX idx_pengajuan_tanggal ON pengajuan_izin(tanggal_pengajuan);

-- Buat function untuk update timestamp
CREATE OR REPLACE FUNCTION update_pengajuan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger untuk auto-update timestamp
CREATE TRIGGER trigger_update_pengajuan_timestamp
  BEFORE UPDATE ON pengajuan_izin
  FOR EACH ROW
  EXECUTE FUNCTION update_pengajuan_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE pengajuan_izin ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk akses data (opsional - sesuaikan dengan kebutuhan)
-- Policy ini memungkinkan user hanya bisa akses data mereka sendiri
CREATE POLICY "Users can view own pengajuan" ON pengajuan_izin
  FOR SELECT USING (nis = current_setting('app.current_user_nis', true));

CREATE POLICY "Users can insert own pengajuan" ON pengajuan_izin
  FOR INSERT WITH CHECK (nis = current_setting('app.current_user_nis', true));

CREATE POLICY "Admins can view all pengajuan" ON pengajuan_izin
  FOR ALL USING (current_setting('app.user_role', true) = 'admin');