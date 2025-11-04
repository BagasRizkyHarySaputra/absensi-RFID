import { supabase } from './supabase';

// Function to create the pengajuan_izin table
export const createPengajuanTable = async () => {
  try {
    // SQL to create the pengajuan_izin table
    const createTableSQL = `
      -- Create pengajuan_izin table
      CREATE TABLE IF NOT EXISTS pengajuan_izin (
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_pengajuan_nis ON pengajuan_izin(nis);
      CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan_izin(status);
      CREATE INDEX IF NOT EXISTS idx_pengajuan_tanggal ON pengajuan_izin(tanggal_pengajuan);

      -- Create update timestamp function and trigger
      CREATE OR REPLACE FUNCTION update_pengajuan_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER IF NOT EXISTS trigger_update_pengajuan_timestamp
        BEFORE UPDATE ON pengajuan_izin
        FOR EACH ROW
        EXECUTE FUNCTION update_pengajuan_timestamp();
    `;

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });

    if (error) {
      console.error('Error creating table:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Tabel pengajuan_izin berhasil dibuat'
    };

  } catch (error) {
    console.error('Error creating pengajuan table:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Alternative: Check if table exists
export const checkTableExists = async () => {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'pengajuan_izin');

    if (error) {
      console.error('Error checking table:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
};