import { supabase } from '../lib/supabase';

// Function to submit pengajuan (izin/sakit) to database
export const submitPengajuan = async (pengajuanData) => {
  try {
    // Check if supabase is available
    if (!supabase) {
      throw new Error('Database tidak tersedia');
    }

    // Validate required fields
    if (!pengajuanData.nis || !pengajuanData.tanggal_mulai || !pengajuanData.tanggal_selesai || !pengajuanData.alasan) {
      throw new Error('Data tidak lengkap. Pastikan semua field wajib telah diisi.');
    }

    // Format data for database
    const formattedData = {
      nis: pengajuanData.nis,
      tanggal_mulai: pengajuanData.tanggal_mulai,
      tanggal_selesai: pengajuanData.tanggal_selesai,
      alasan: pengajuanData.alasan,
      keterangan: pengajuanData.keterangan || null,
      file_pendukung: pengajuanData.file_pendukung || null,
      status: 'pending', // Default status
      tanggal_pengajuan: new Date().toISOString(),
      disetujui_oleh: null,
      tanggal_disetujui: null
    };

    // Insert to database
    const { data, error } = await supabase
      .from('pengajuan_izin')
      .insert([formattedData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      
      // Handle specific error cases
      if (error.message.includes('table') && error.message.includes('does not exist')) {
        throw new Error('Tabel pengajuan_izin belum dibuat. Silakan buat tabel terlebih dahulu di Supabase Dashboard.');
      } else if (error.message.includes('permission denied')) {
        throw new Error('Tidak memiliki permission untuk mengakses database. Periksa RLS policies.');
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    return {
      success: true,
      data: data[0],
      message: 'Pengajuan berhasil dikirim'
    };

  } catch (error) {
    console.error('Error submitting pengajuan:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat mengirim pengajuan'
    };
  }
};

// Function to get user's pengajuan history
export const getUserPengajuan = async (nis) => {
  try {
    // Check if supabase is available
    if (!supabase) {
      console.warn('Database tidak tersedia, menggunakan data mock');
      return {
        success: true,
        data: [] // Return empty array for demo
      };
    }

    const { data, error } = await supabase
      .from('pengajuan_izin')
      .select('*')
      .eq('nis', nis)
      .order('tanggal_pengajuan', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      
      // Handle specific error cases
      if (error.message.includes('table') && error.message.includes('does not exist')) {
        console.warn('Tabel pengajuan_izin belum ada, mengembalikan data kosong');
        return {
          success: true,
          data: []
        };
      } else {
        throw error;
      }
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Error fetching pengajuan:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat mengambil data pengajuan',
      data: []
    };
  }
};

// Function to update pengajuan status (for admin)
export const updatePengajuanStatus = async (id, status, adminNis) => {
  try {
    const updateData = {
      status: status,
      tanggal_disetujui: new Date().toISOString(),
      disetujui_oleh: adminNis
    };

    const { data, error } = await supabase
      .from('pengajuan_izin')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data[0],
      message: `Pengajuan berhasil ${status}`
    };

  } catch (error) {
    console.error('Error updating pengajuan status:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat mengupdate status pengajuan'
    };
  }
};

// Function to get all pengajuan (for admin)
export const getAllPengajuan = async () => {
  try {
    const { data, error } = await supabase
      .from('pengajuan_izin')
      .select(`
        *,
        siswa (
          nama,
          kelas
        )
      `)
      .order('tanggal_pengajuan', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Error fetching all pengajuan:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat mengambil data pengajuan',
      data: []
    };
  }
};

// Function to upload file (if needed)
export const uploadFile = async (file, fileName) => {
  try {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const uniqueFileName = `${fileName}_${timestamp}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('pengajuan-files')
      .upload(uniqueFileName, file);

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pengajuan-files')
      .getPublicUrl(uniqueFileName);

    return {
      success: true,
      fileName: uniqueFileName,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat mengupload file'
    };
  }
};