// database.jsx - Database functions for Approvals page using pengajuan_izin table
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔑 Environment variables:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing'
});

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

console.log('🔑 Supabase Config:', { 
  url: supabaseUrl ? 'Set' : 'Missing', 
  key: supabaseAnonKey ? 'Set' : 'Missing' 
});

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

  // Get total count of pengajuan_izin for pagination
  getApprovalsCount: async (searchQuery = '') => {
    try {
      let query = supabase
        .from('pengajuan_izin')
        .select('*', { count: 'exact', head: true })

      if (searchQuery) {
        query = query.or(`
          alasan.ilike.%${searchQuery}%,
          keterangan.ilike.%${searchQuery}%,
          nis.ilike.%${searchQuery}%
        `)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error counting pengajuan_izin:', error)
        return { count: 0, error }
      }

      return { count, error: null }
    } catch (err) {
      console.error('Database error:', err)
      return { count: 0, error: err }
    }
  },

  // Approve a pengajuan_izin request
  approveRequest: async (pengajuanId, approvedBy = 'Admin') => {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .update({ 
          status: 'approved',
          disetujui_oleh: approvedBy,
          tanggal_disetujui: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pengajuanId)
        .select()

      if (error) {
        console.error('Error approving pengajuan_izin:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Database error:', err)
      return { data: null, error: err }
    }
  },

  // Reject a pengajuan_izin request
  rejectRequest: async (pengajuanId, rejectedBy = 'Admin') => {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .update({ 
          status: 'rejected',
          disetujui_oleh: rejectedBy,
          tanggal_disetujui: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pengajuanId)
        .select()

      if (error) {
        console.error('Error rejecting pengajuan_izin:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Database error:', err)
      return { data: null, error: err }
    }
  },

  // Cancel an approval (set back to pending)
  cancelApproval: async (pengajuanId) => {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .update({ 
          status: 'pending',
          disetujui_oleh: null,
          tanggal_disetujui: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pengajuanId)
        .select()

      if (error) {
        console.error('Error canceling pengajuan_izin:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Database error:', err)
      return { data: null, error: err }
    }
  },

  // Accept an approved request (final confirmation) - could be used for 'processed' status
  acceptApproval: async (pengajuanId, processedBy = 'Admin') => {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .update({ 
          status: 'processed',
          disetujui_oleh: processedBy,
          tanggal_disetujui: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pengajuanId)
        .select()

      if (error) {
        console.error('Error processing pengajuan_izin:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Database error:', err)
      return { data: null, error: err }
    }
  },

  // Get student info by NIS
  getStudentByNis: async (nis) => {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .eq('nis', nis)
        .single()

      if (error) {
        console.error('Error fetching student:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Database error:', err)
      return { data: null, error: err }
    }
  }
}

export default approvalDatabase
