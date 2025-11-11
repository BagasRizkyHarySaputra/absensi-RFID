// kehadiranService.js - Service for handling kehadiran data with Supabase
import { createClient } from '@supabase/supabase-js'

// Create Supabase client using environment variables only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('🚨 kehadiranService: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Kehadiran service functions
export const kehadiranService = {
  // Test database connection
  testConnection: async () => {
    try {
      console.log('🧪 Testing kehadiran database connection...');
      const { data, error, status, statusText } = await supabase
        .from('kehadiran')
        .select('id')
        .limit(1);

      // If supabase returns an error object or non-200 status
      if (error) {
        // Attempt to serialize full error for better debugging (handles empty {})
        let serialized = 'Unknown error';
        try { serialized = JSON.stringify(error); } catch {}
        console.error('❌ Kehadiran connection failed:', error);
        console.error('🔍 Serialized error:', serialized);
        console.error('🔢 Status info:', { status, statusText });

        // Common guidance
        console.warn('📎 Possible causes: table name mismatch, RLS policy blocking anon key, network/credentials issue.');
        return false;
      }

      console.log('✅ Kehadiran connection successful');
      return true;
    } catch (err) {
      let serialized = 'Unknown runtime error';
      try { serialized = JSON.stringify(err); } catch {}
      console.error('❌ Kehadiran connection unexpected error:', err);
      console.error('🔍 Serialized unexpected error:', serialized);
      return false;
    }
  },

  // Get all kehadiran with pagination and search
  getKehadiran: async (page = 1, limit = 12, searchQuery = '') => {
    try {
      console.log('📋 Fetching kehadiran with params:', { page, limit, searchQuery })
      
      // Base query to get kehadiran data - select all fields for complete data
      let query = supabase
        .from('kehadiran')
        .select('*', { count: 'exact' })
        .order('waktu_absen', { ascending: false })

      // Add search filter if provided - search by student name, NIS, or class
      if (searchQuery && searchQuery.trim()) {
        console.log('🔍 Adding search filter for:', searchQuery);
        query = query.or(`nama.ilike.%${searchQuery}%,nis.ilike.%${searchQuery}%,kelas.ilike.%${searchQuery}%`)
      }

      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      console.log('🔍 Executing kehadiran query with pagination:', { from, to });
      const { data, error, count } = await query

      console.log('📊 Kehadiran query executed:', { 
        dataLength: data?.length, 
        error: error?.message, 
        count,
        hasSearchQuery: !!searchQuery
      });

      if (error) {
        console.error('❌ Error fetching kehadiran:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        
        // Handle empty error object
        const errorMessage = error.message || error.details || 'Database query failed';
        return { data: [], error: { message: errorMessage }, count: 0 }
      }

      console.log('✅ Successfully fetched kehadiran data:', data?.length || 0, 'records')
      return { data, error: null, count }
    } catch (err) {
      console.error('❌ Kehadiran database error:', err)
      return { data: [], error: err, count: 0 }
    }
  },

  // Get kehadiran for today only
  getTodayKehadiran: async (page = 1, limit = 12, searchQuery = '') => {
    try {
      console.log('📋 Fetching today kehadiran with params:', { page, limit, searchQuery })
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Base query to get today's kehadiran data
      let query = supabase
        .from('kehadiran')
        .select('*', { count: 'exact' })
        .gte('waktu_absen', today.toISOString())
        .lt('waktu_absen', tomorrow.toISOString())
        .order('waktu_absen', { ascending: false })

      // Add search filter if provided
      if (searchQuery && searchQuery.trim()) {
        console.log('🔍 Adding search filter for today data:', searchQuery);
        query = query.or(`nama.ilike.%${searchQuery}%,nis.ilike.%${searchQuery}%,kelas.ilike.%${searchQuery}%`)
      }

      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      console.log('🔍 Executing today kehadiran query:', { from, to, today: today.toISOString() });
      const { data, error, count } = await query

      console.log('📊 Today kehadiran query executed:', { 
        dataLength: data?.length, 
        error: error?.message, 
        count
      });

      if (error) {
        console.error('❌ Error fetching today kehadiran:', error)
        return { data: [], error, count: 0 }
      }

      console.log('✅ Successfully fetched today kehadiran data:', data?.length || 0, 'records')
      return { data, error: null, count }
    } catch (err) {
      console.error('❌ Today kehadiran database error:', err)
      return { data: [], error: err, count: 0 }
    }
  }
}

export default kehadiranService