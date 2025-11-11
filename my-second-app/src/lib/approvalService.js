// approvalService.js - Service for handling approval operations with Supabase
import { createClient } from '@supabase/supabase-js'
import { transferApprovedToReport } from './reportService.js'

// Create Supabase client using environment variables only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('🚨 approvalService: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Approval service functions
export const approvalService = {
  // Test database connection
  testConnection: async () => {
    try {
      console.log('🧪 Testing database connection...');
      console.log('🔗 Using URL:', supabaseUrl);
      console.log('🗃️ Attempting to query pengajuan_izin table...');
      
      // Try a simple select first
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .select('id')
        .limit(1);
      
      console.log('📊 Query result:', { data, error });
      
      if (error) {
        console.error('❌ Database connection failed:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        return false;
      }
      
      console.log('✅ Database connection successful, found records:', data?.length || 0);
      return true;
    } catch (err) {
      console.error('❌ Database connection error:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error stack:', err.stack);
      return false;
    }
  },

  // Get all pengajuan_izin with pagination and search
  getApprovals: async (page = 1, limit = 10, searchQuery = '') => {
    try {
      console.log('📋 Fetching approvals with params:', { page, limit, searchQuery })
      
      // Start with a simple query for pending requests
      let query = supabase
        .from('pengajuan_izin')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')  // Only show pending requests
        .order('tanggal_pengajuan', { ascending: false })

      // Add search filter if provided
      if (searchQuery && searchQuery.trim()) {
        console.log('🔍 Adding student name search for:', searchQuery);
        
        // First, search for students by name
        const { data: students, error: studentError } = await supabase
          .from('siswa')
          .select('nis')
          .ilike('nama', `%${searchQuery}%`);
        
        if (studentError) {
          console.error('❌ Error searching students:', studentError);
          // Fallback to direct search in pengajuan_izin
          query = query.or(`alasan.ilike.%${searchQuery}%,keterangan.ilike.%${searchQuery}%,nis.ilike.%${searchQuery}%`)
        } else if (students && students.length > 0) {
          // Get list of NIS from matching students
          const nisList = students.map(student => student.nis);
          console.log('✅ Found students with matching names:', nisList);
          
          // Search pengajuan_izin by NIS list or direct text search
          const nisFilter = nisList.map(nis => `nis.eq.${nis}`).join(',');
          query = query.or(`${nisFilter},alasan.ilike.%${searchQuery}%,keterangan.ilike.%${searchQuery}%`)
        } else {
          console.log('⚠️ No students found with name containing:', searchQuery);
          // Still search in alasan and keterangan as fallback, and direct NIS search
          query = query.or(`alasan.ilike.%${searchQuery}%,keterangan.ilike.%${searchQuery}%,nis.ilike.%${searchQuery}%`)
        }
      }

      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      console.log('🔍 Executing final query with pagination:', { from, to });
      const { data, error, count } = await query

      console.log('📊 Query executed:', { 
        dataLength: data?.length, 
        error: error?.message, 
        count,
        hasSearchQuery: !!searchQuery
      });

      if (error) {
        console.error('❌ Error fetching pengajuan_izin:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        console.error('❌ Search query was:', searchQuery)
        return { data: [], error, count: 0 }
      }

      console.log('✅ Successfully fetched pending data:', data?.length || 0, 'records')
      return { data, error: null, count }
    } catch (err) {
      console.error('❌ Database error:', err)
      return { data: [], error: err, count: 0 }
    }
  },

  // Get student data by NIS (fallback if siswa relation doesn't work)
  getStudentByNis: async (nis) => {
    try {
      console.log('🔍 Fetching student data for NIS:', nis);
      
      const { data, error } = await supabase
        .from('siswa')
        .select('nama, kelas')
        .eq('nis', nis)
        .limit(1);

      console.log('📋 Student query result:', { dataCount: data?.length, error, nis });

      if (error) {
        console.error('❌ Error fetching student:', error);
        console.warn(`⚠️ Student query failed for NIS: ${nis}, using fallback`);
        return { nama: `NIS: ${nis}`, kelas: 'Tidak Diketahui' };
      }

      if (!data || data.length === 0) {
        console.warn(`⚠️ No student found for NIS: ${nis} (maybe admin or invalid NIS)`);
        // Special handling for admin or non-student NIS
        const displayName = nis === 'admin' ? 'Administrator' : `NIS: ${nis}`;
        return { nama: displayName, kelas: 'Non-Siswa' };
      }

      console.log('✅ Student data found:', data[0]);
      return data[0];
    } catch (err) {
      console.error('❌ Exception in getStudentByNis:', err);
      return { nama: `NIS: ${nis}`, kelas: 'Error' };
    }
  },

  // Approve a request
  approveRequest: async (id) => {
    try {
      // First, approve the request in pengajuan_izin
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .update({ 
          status: 'approved',
          tanggal_disetujui: new Date().toISOString(),
          disetujui_oleh: 'Admin' // You might want to get this from auth context
        })
        .eq('id', id)
        .select()

      if (error) {
        console.error('❌ Error approving request in pengajuan_izin:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check if it's an RLS policy violation
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.error('🔒 RLS Policy Violation detected - check Row Level Security settings');
        }
        
        return { data, error };
      }

      console.log('✅ Request approved in pengajuan_izin:', data);

      // Then, automatically transfer to report table
      try {
        const transferResult = await transferApprovedToReport(id);
        if (!transferResult.success) {
          console.warn('⚠️ Failed to transfer to report table, but approval successful:', transferResult.error);
          // Don't fail the approval just because transfer failed
          // The data can be transferred later using bulk transfer
        } else {
          console.log('✅ Successfully transferred to report table:', transferResult);
        }
      } catch (transferError) {
        console.error('❌ Unexpected error during transfer to report table:', transferError);
        // Continue with approval success even if transfer fails
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error approving request:', err)
      return { data: null, error: err }
    }
  },

  // Reject a request
  rejectRequest: async (id) => {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .update({ 
          status: 'rejected',
          tanggal_disetujui: new Date().toISOString(),
          disetujui_oleh: 'Admin' // You might want to get this from auth context
        })
        .eq('id', id)
        .select()

      return { data, error }
    } catch (err) {
      console.error('Error rejecting request:', err)
      return { data: null, error: err }
    }
  },

  // Reset to pending (for approved requests)
  resetToPending: async (id) => {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .update({ 
          status: 'pending',
          tanggal_disetujui: null,
          disetujui_oleh: null
        })
        .eq('id', id)
        .select()

      return { data, error }
    } catch (err) {
      console.error('Error resetting to pending:', err)
      return { data: null, error: err }
    }
  }
}

export default approvalService