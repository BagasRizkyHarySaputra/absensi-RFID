// database-backup.jsx - Backup with environment variables only
import { createClient } from '@supabase/supabase-js'

// Use environment variables only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('� database-backup: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database functions for Approvals using pengajuan_izin table
export const approvalDatabase = {
  // Test database connection
  testConnection: async () => {
    try {
      console.log('🧪 Testing database connection...');
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .select('count()', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Database connection failed:', error);
        return false;
      }
      
      console.log('✅ Database connection successful');
      return true;
    } catch (err) {
      console.error('❌ Database connection error:', err);
      return false;
    }
  },

  // Get all pengajuan_izin with pagination and search
  getApprovals: async (page = 1, limit = 10, searchQuery = '') => {
    try {
      console.log('Fetching approvals with params:', { page, limit, searchQuery })
      
      let query = supabase
        .from('pengajuan_izin')
        .select('*', { count: 'exact' })
        .order('tanggal_pengajuan', { ascending: false })

      // Add search filter if provided
      if (searchQuery) {
        query = query.or(`
          alasan.ilike.%${searchQuery}%,
          keterangan.ilike.%${searchQuery}%,
          nis.ilike.%${searchQuery}%
        `)
      }

      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching pengajuan_izin:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return { data: [], error, count: 0 }
      }

      console.log('Successfully fetched data:', data?.length || 0, 'records')
      return { data, error: null, count }
    } catch (err) {
      console.error('Database error:', err)
      return { data: [], error: err, count: 0 }
    }
  },

  // Get student data by NIS
  getStudentByNis: async (nis) => {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('nama, kelas')
        .eq('nis', nis)
        .single()

      if (error) {
        console.error('Error fetching student:', error)
        return { nama: nis, kelas: 'Unknown' } // Fallback
      }

      return data
    } catch (err) {
      console.error('Error in getStudentByNis:', err)
      return { nama: nis, kelas: 'Unknown' } // Fallback
    }
  },

  // Approve a request
  approveRequest: async (id) => {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .update({ 
          status: 'approved',
          tanggal_disetujui: new Date().toISOString(),
          disetujui_oleh: 'Admin' // You might want to get this from auth context
        })
        .eq('id', id)
        .select()

      return { data, error }
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
  }
}

export default approvalDatabase