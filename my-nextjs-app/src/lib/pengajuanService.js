import { supabase } from '../lib/supabase';

// Function to submit pengajuan (izin/sakit) to database
export const submitPengajuan = async (pengajuanData) => {
  try {
    // Check if supabase is available and configured
    if (!supabase) {
      console.log('Supabase client not available');
      throw new Error('Database tidak tersedia');
    }

    // Check if environment variables are configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase environment variables not configured:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      throw new Error('Supabase tidak dikonfigurasi - environment variables tidak ditemukan');
    }

    // Test database connection first
    console.log('Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('pengajuan_izin')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('Database connection test failed:', testError);
      throw new Error(`Database connection error: ${testError.message || 'Cannot connect to database'}`);
    }
    
    console.log('Database connection successful');

    // Log for debugging
    console.log('Submitting pengajuan with data:', pengajuanData);

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

    console.log('Attempting to insert data:', formattedData);

    // Insert to database
    const { data, error } = await supabase
      .from('pengajuan_izin')
      .insert([formattedData])
      .select();

    console.log('Insert result - data:', data);
    console.log('Insert result - error:', error);

    if (error) {
      console.error('Supabase error occurred:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error || {}));
      
      // Enhanced error logging
      const errorDetails = {
        message: error?.message || 'Unknown error',
        details: error?.details || null,
        hint: error?.hint || null,
        code: error?.code || null,
        status: error?.status || null,
        statusText: error?.statusText || null,
        fullError: JSON.stringify(error, null, 2)
      };
      
      console.error('Supabase error details:', errorDetails);
      
      // Handle specific error cases
      if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
        throw new Error('Tabel pengajuan_izin belum dibuat di database. Silakan buat tabel terlebih dahulu.');
      } else if (error?.code === 'PGRST116' || error?.code === '42P01') {
        throw new Error('Tabel pengajuan_izin tidak ditemukan di database. Silakan buat tabel di Supabase.');
      } else if (error?.message?.includes('permission denied') || error?.code === '42501') {
        throw new Error('RLS Policy Error: Tidak memiliki permission untuk INSERT. Nonaktifkan RLS atau buat policy yang tepat.');
      } else if (error?.code === 'PGRST301') {
        throw new Error('Database schema error. Periksa struktur tabel di Supabase.');
      } else if (error?.message?.includes('new row violates row-level security policy')) {
        throw new Error('RLS Policy Violation: Row Level Security memblokir operasi INSERT. Periksa RLS policies.');
      } else if (error?.message?.includes('JWT')) {
        throw new Error('Authentication error: Invalid JWT token. Periksa anon key di .env.local');
      } else if (!error?.message && Object.keys(error || {}).length === 0) {
        throw new Error('Database tidak dapat diakses - kemungkinan masalah RLS atau network');
      } else if (error?.message === '{}' || JSON.stringify(error) === '{}') {
        throw new Error('Database connection error - periksa RLS policies dan network connection');
      } else {
        const errorMsg = error?.message || error?.details || 'Unknown database error';
        throw new Error(`Database error: ${errorMsg}`);
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