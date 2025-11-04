import { db } from './supabase'

// Database utilities and helper functions
export const dbUtils = {
  // Test database connection
  testConnection: async () => {
    try {
      const { data, error } = await db.query.select('users', 'id', {})
      if (error) {
        console.error('Database connection failed:', error)
        return { success: false, error }
      }
      console.log('Database connection successful')
      return { success: true, data }
    } catch (error) {
      console.error('Database connection error:', error)
      return { success: false, error }
    }
  },

  // Format date for database
  formatDate: (date = new Date()) => {
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  },

  // Format datetime for database
  formatDateTime: (date = new Date()) => {
    return date.toISOString() // Full ISO string
  },

  // Check if user exists
  userExists: async (email) => {
    try {
      const { data, error } = await db.query.select('users', 'id, email', { email })
      if (error) return { exists: false, error }
      return { exists: data && data.length > 0, data }
    } catch (error) {
      return { exists: false, error }
    }
  },

  // Get attendance statistics
  getAttendanceStats: async (userId = null, startDate = null, endDate = null) => {
    try {
      let conditions = {}
      
      if (userId) conditions.user_id = userId
      if (startDate) {
        // This would need custom query for date range
        // For now, we'll get all and filter in JavaScript
      }

      const { data, error } = await db.presensi.getAll()
      if (error) return { success: false, error }

      // Filter data based on conditions
      let filteredData = data || []
      
      if (userId) {
        filteredData = filteredData.filter(item => item.user_id === userId)
      }
      
      if (startDate && endDate) {
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.tanggal)
          return itemDate >= new Date(startDate) && itemDate <= new Date(endDate)
        })
      }

      // Calculate statistics
      const total = filteredData.length
      const hadir = filteredData.filter(item => item.status === 'hadir').length
      const tidak_hadir = filteredData.filter(item => item.status === 'tidak_hadir').length
      const terlambat = filteredData.filter(item => item.status === 'terlambat').length

      return {
        success: true,
        stats: {
          total,
          hadir,
          tidak_hadir,
          terlambat,
          percentage_hadir: total > 0 ? Math.round((hadir / total) * 100) : 0
        }
      }
    } catch (error) {
      return { success: false, error }
    }
  },

  // Create attendance record
  createAttendance: async (userId, status = 'hadir', kelas_id = null) => {
    try {
      const attendanceData = {
        user_id: userId,
        status,
        tanggal: dbUtils.formatDate(),
        waktu: dbUtils.formatDateTime(),
        kelas_id
      }

      const { data, error } = await db.presensi.create(attendanceData)
      if (error) return { success: false, error }

      return { success: true, data }
    } catch (error) {
      return { success: false, error }
    }
  },

  // Get today's attendance for a user
  getTodayAttendance: async (userId) => {
    try {
      const today = dbUtils.formatDate()
      const { data, error } = await db.presensi.getByDate(today)
      
      if (error) return { success: false, error }

      const userAttendance = data?.find(item => item.user_id === userId)
      return { 
        success: true, 
        hasAttendance: !!userAttendance,
        attendance: userAttendance 
      }
    } catch (error) {
      return { success: false, error }
    }
  },

  // Error handling helper
  handleError: (error, context = '') => {
    console.error(`Database error ${context}:`, error)
    
    // Common error messages
    const errorMessages = {
      'row-level security': 'Akses tidak diizinkan',
      'duplicate key': 'Data sudah ada',
      'foreign key': 'Data terkait tidak ditemukan',
      'not null': 'Data wajib diisi',
    }

    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message?.toLowerCase().includes(key)) {
        return message
      }
    }

    return error.message || 'Terjadi kesalahan pada database'
  }
}

export default dbUtils