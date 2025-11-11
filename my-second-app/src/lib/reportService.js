// reportService.js - Service for managing report table automation
// Handles transfer of approved pengajuan_izin to report table

import { createClient } from '@supabase/supabase-js';

// Supabase client - environment variables only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('🚨 reportService: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Transfer approved pengajuan_izin to report table
 * Called when admin approves a leave request
 */
export async function transferApprovedToReport(pengajuanId) {
  try {
    console.log(`📋 Transferring approved pengajuan_izin ID: ${pengajuanId} to report table`);

    // 1. First check if the pengajuan exists with any status
    const { data: checkData, error: checkError } = await supabase
      .from('pengajuan_izin')
      .select('id, status, nis')
      .eq('id', pengajuanId)
      .single();

    console.log('🔍 Initial check result:', { checkData, checkError });

    if (checkError) {
      console.error('❌ Error checking pengajuan_izin existence:', {
        error: checkError,
        message: checkError?.message,
        code: checkError?.code,
        details: checkError?.details
      });
      return { success: false, error: `Failed to find pengajuan: ${checkError?.message || 'Unknown error'}` };
    }

    if (!checkData) {
      console.error('❌ Pengajuan not found:', pengajuanId);
      return { success: false, error: 'Pengajuan not found' };
    }

    if (checkData.status !== 'approved') {
      console.error('❌ Pengajuan not approved. Current status:', checkData.status);
      return { success: false, error: `Pengajuan status is '${checkData.status}', not 'approved'` };
    }

    // 2. Get the approved pengajuan_izin data with siswa relation
    const { data: pengajuanData, error: fetchError } = await supabase
      .from('pengajuan_izin')
      .select(`
        *,
        siswa!pengajuan_izin_siswa_id_fkey (
          nama,
          nis,
          nisn,
          kelas
        )
      `)
      .eq('id', pengajuanId)
      .eq('status', 'approved')
      .single();

    if (fetchError) {
      console.error('❌ Error fetching approved pengajuan_izin with relations:', {
        error: fetchError,
        message: fetchError?.message,
        code: fetchError?.code,
        details: fetchError?.details
      });
      return { success: false, error: `Failed to fetch pengajuan with relations: ${fetchError?.message || 'Unknown error'}` };
    }

    if (!pengajuanData) {
      console.error('❌ No pengajuan_izin data returned');
      return { success: false, error: 'Pengajuan data not found or not approved' };
    }

    console.log('📝 Pengajuan data retrieved:', {
      id: pengajuanData.id,
      status: pengajuanData.status,
      nis: pengajuanData.nis,
      hasSiswaRelation: !!pengajuanData.siswa,
      siswaData: pengajuanData.siswa
    });

    // 2. Get student data (either from relation or direct lookup)
    let siswaInfo = pengajuanData.siswa;
    
    if (!siswaInfo) {
      console.error('❌ Student data not found in relation, trying direct lookup with NIS:', pengajuanData.nis);
      
      // Try to get student data directly by NIS
      if (pengajuanData.nis) {
        const { data: directSiswaData, error: siswaError } = await supabase
          .from('siswa')
          .select('nama, nis, nisn, kelas')
          .eq('nis', pengajuanData.nis)
          .single();

        if (siswaError || !directSiswaData) {
          console.error('❌ Failed to get student data directly:', siswaError);
          return { success: false, error: `Student data not found for NIS: ${pengajuanData.nis}` };
        }

        console.log('✅ Retrieved student data directly:', directSiswaData);
        siswaInfo = directSiswaData;
      } else {
        return { success: false, error: 'No NIS found in pengajuan data' };
      }
    }

    // 3. Prepare report data
    const reportEntry = {
      nama: siswaInfo.nama,
      nis: siswaInfo.nis,
      nisn: siswaInfo.nisn || '',
      kelas: siswaInfo.kelas || '',
      izin: true, // Mark as approved leave
      tanggal_mulai: pengajuanData.tanggal_mulai || new Date().toISOString(),
      tanggal_selesai: pengajuanData.tanggal_selesai || pengajuanData.tanggal_mulai || new Date().toISOString(),
      alasan: pengajuanData.alasan || '',
      pengajuan_izin_id: pengajuanId, // Reference to original pengajuan
      created_at: new Date().toISOString()
    };

    console.log('📋 Report entry prepared:', reportEntry);

    // 4. Check if already exists in report table
    const { data: existingReport, error: existCheckError } = await supabase
      .from('report')
      .select('id')
      .eq('pengajuan_izin_id', pengajuanId)
      .maybeSingle();

    if (existCheckError) {
      console.error('❌ Error checking existing report:', existCheckError);
      return { success: false, error: existCheckError.message };
    }

    if (existingReport) {
      console.log(`⚠️ Report entry already exists for pengajuan_izin ID: ${pengajuanId}`);
      return { success: true, message: 'Report entry already exists', reportId: existingReport.id };
    }

    // 5. Insert into report table
    const { data: insertedData, error: insertError } = await supabase
      .from('report')
      .insert([reportEntry])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting into report table:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`✅ Successfully transferred to report table:`, insertedData);
    return { success: true, reportId: insertedData.id, data: insertedData };

  } catch (error) {
    console.error('❌ Unexpected error in transferApprovedToReport:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get report data for a specific class and date range
 */
export async function getReportData(kelas, startDate, endDate) {
  try {
    let query = supabase
      .from('report')
      .select('*')
      .eq('izin', true);

    if (kelas) {
      query = query.eq('kelas', kelas);
    }

    if (startDate) {
      query = query.gte('tanggal_mulai', startDate);
    }

    if (endDate) {
      query = query.lte('tanggal_mulai', endDate);
    }

    const { data, error } = await query.order('tanggal_mulai', { ascending: false });

    if (error) {
      console.error('❌ Error fetching report data:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    console.error('❌ Unexpected error in getReportData:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk transfer multiple approved pengajuan_izin to report table
 * Useful for initial data migration or batch processing
 */
export async function bulkTransferApproved() {
  try {
    console.log('📋 Starting bulk transfer of approved pengajuan_izin to report table');

    // Get all approved pengajuan_izin that haven't been transferred yet
    const { data: approvedPengajuan, error: fetchError } = await supabase
      .from('pengajuan_izin')
      .select(`
        *,
        siswa!pengajuan_izin_siswa_id_fkey (
          nama,
          nis,
          nisn,
          kelas
        )
      `)
      .eq('status', 'approved')
      .not('id', 'in', `(SELECT pengajuan_izin_id FROM report WHERE pengajuan_izin_id IS NOT NULL)`);

    if (fetchError) {
      console.error('❌ Error fetching approved pengajuan_izin:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!approvedPengajuan || approvedPengajuan.length === 0) {
      console.log('ℹ️ No approved pengajuan_izin to transfer');
      return { success: true, transferred: 0, message: 'No data to transfer' };
    }

    console.log(`📊 Found ${approvedPengajuan.length} approved pengajuan_izin to transfer`);

    // Transfer each approved pengajuan
    const results = [];
    for (const pengajuan of approvedPengajuan) {
      const result = await transferApprovedToReport(pengajuan.id);
      results.push({ pengajuanId: pengajuan.id, result });

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successful = results.filter(r => r.result.success).length;
    const failed = results.filter(r => !r.result.success).length;

    console.log(`✅ Bulk transfer completed: ${successful} successful, ${failed} failed`);
    return { 
      success: true, 
      transferred: successful, 
      failed: failed,
      results: results 
    };

  } catch (error) {
    console.error('❌ Unexpected error in bulkTransferApproved:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean up report table - remove entries that are no longer valid
 */
export async function cleanupReportTable() {
  try {
    console.log('🧹 Starting report table cleanup');

    // Remove report entries where the original pengajuan_izin no longer exists or is not approved
    const { data: deletedData, error } = await supabase
      .from('report')
      .delete()
      .not('pengajuan_izin_id', 'in', `(SELECT id FROM pengajuan_izin WHERE status = 'approved')`);

    if (error) {
      console.error('❌ Error during cleanup:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Cleanup completed. Removed ${deletedData?.length || 0} invalid entries`);
    return { success: true, removed: deletedData?.length || 0 };

  } catch (error) {
    console.error('❌ Unexpected error in cleanupReportTable:', error);
    return { success: false, error: error.message };
  }
}

export default {
  transferApprovedToReport,
  getReportData,
  bulkTransferApproved,
  cleanupReportTable
};