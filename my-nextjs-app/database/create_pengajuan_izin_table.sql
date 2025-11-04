-- Tabel untuk menyimpan pengajuan izin/sakit siswa
CREATE TABLE IF NOT EXISTS pengajuan_izin (
  id SERIAL PRIMARY KEY,
  nis VARCHAR(20) NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  alasan TEXT NOT NULL,
  keterangan TEXT,
  file_pendukung TEXT, -- URL file pendukung
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tanggal_pengajuan TIMESTAMP DEFAULT NOW(),
  disetujui_oleh VARCHAR(20), -- NIS admin yang menyetujui
  tanggal_disetujui TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_pengajuan_siswa 
    FOREIGN KEY (nis) REFERENCES siswa(nis) 
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_pengajuan_nis ON pengajuan_izin(nis);
CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan_izin(status);
CREATE INDEX IF NOT EXISTS idx_pengajuan_tanggal ON pengajuan_izin(tanggal_pengajuan);

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_pengajuan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pengajuan_timestamp
  BEFORE UPDATE ON pengajuan_izin
  FOR EACH ROW
  EXECUTE FUNCTION update_pengajuan_timestamp();

-- Sample data untuk testing (opsional)
-- INSERT INTO pengajuan_izin (nis, tanggal_mulai, tanggal_selesai, alasan, keterangan, status) VALUES
-- ('12345', '2025-11-04', '2025-11-05', 'Sakit demam', 'Perlu istirahat total', 'pending'),
-- ('12346', '2025-11-03', '2025-11-03', 'Keperluan keluarga', 'Menghadiri acara keluarga', 'approved');