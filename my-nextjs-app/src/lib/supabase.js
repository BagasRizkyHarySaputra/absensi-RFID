import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database helper functions
export const db = {
  // Auth functions
  auth: {
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    },

    signUp: async (email, password, userData = {}) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      return { data, error }
    },

    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      return { error }
    },

    getCurrentUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    },
  },

  // Users table functions
  users: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
      return { data, error }
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (userData) => {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
      return { data, error }
    },

    update: async (id, userData) => {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
      return { data, error }
    },

    delete: async (id) => {
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
      return { data, error }
    },
  },

  // Presensi/Attendance table functions
  presensi: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('presensi')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    },

    getByUserId: async (userId) => {
      const { data, error } = await supabase
        .from('presensi')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },

    getByDate: async (date) => {
      const { data, error } = await supabase
        .from('presensi')
        .select('*')
        .eq('tanggal', date)
        .order('created_at', { ascending: false })
      return { data, error }
    },

    create: async (presensiData) => {
      const { data, error } = await supabase
        .from('presensi')
        .insert([presensiData])
        .select()
      return { data, error }
    },

    update: async (id, presensiData) => {
      const { data, error } = await supabase
        .from('presensi')
        .update(presensiData)
        .eq('id', id)
        .select()
      return { data, error }
    },

    delete: async (id) => {
      const { data, error } = await supabase
        .from('presensi')
        .delete()
        .eq('id', id)
      return { data, error }
    },
  },

  // Kelas table functions
  kelas: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('kelas')
        .select('*')
        .order('nama_kelas', { ascending: true })
      return { data, error }
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('kelas')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    create: async (kelasData) => {
      const { data, error } = await supabase
        .from('kelas')
        .insert([kelasData])
        .select()
      return { data, error }
    },

    update: async (id, kelasData) => {
      const { data, error } = await supabase
        .from('kelas')
        .update(kelasData)
        .eq('id', id)
        .select()
      return { data, error }
    },

    delete: async (id) => {
      const { data, error } = await supabase
        .from('kelas')
        .delete()
        .eq('id', id)
      return { data, error }
    },
  },

  // Generic database functions
  query: {
    // Raw SQL query (if needed)
    rpc: async (functionName, params = {}) => {
      const { data, error } = await supabase
        .rpc(functionName, params)
      return { data, error }
    },

    // Custom select with joins
    select: async (table, columns = '*', conditions = {}) => {
      let query = supabase.from(table).select(columns)
      
      // Apply conditions
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data, error } = await query
      return { data, error }
    },
  },
}

// Export default Supabase client for advanced usage
export default supabase