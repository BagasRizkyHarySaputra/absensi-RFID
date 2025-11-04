import { supabase } from '../lib/supabase';

// ===== DATA COLLECTION FUNCTIONS =====

/**
 * Fetch attendance data with user and class information
 * @param {Object} options - Query options
 * @param {number} options.page - Page number for pagination
 * @param {number} options.pageSize - Number of items per page
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {Object} filters - Filter options
 * @returns {Promise} - Promise with data and count
 */
export const fetchAttendanceData = async (options = {}, filters = {}) => {
  try {
    // Check if Supabase client is available
    if (!supabase) {
      console.warn('Supabase client not configured, using mock data');
      const mockData = generateMockAttendanceData(options.pageSize || 10);
      return { 
        success: false,
        data: mockData, 
        count: mockData.length,
        error: 'Using mock data - database not configured'
      };
    }

    // Build query dengan join ke tabel siswa
    let query = supabase
      .from('kehadiran')
      .select(`
        *,
        siswa:siswa_id (
          id,
          nama,
          nis,
          nisn,
          kelas,
          password
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.siswaId) {
      query = query.eq('siswa_id', filters.siswaId);
    }

    if (filters.kelas) {
      query = query.eq('kelas', filters.kelas);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('waktu_absen', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('waktu_absen', filters.endDate);
    }

    if (filters.search) {
      // Search in nama atau NIS
      query = query.or(`nama.ilike.%${filters.search}%,nis.ilike.%${filters.search}%`);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (options.page && options.pageSize) {
      const start = (options.page - 1) * options.pageSize;
      const end = start + options.pageSize - 1;
      query = query.range(start, end);
    }

    const { data: result, error: fetchError, count } = await query;

    if (fetchError) {
      throw fetchError;
    }

    // Transform data for display
    const transformedData = result?.map(transformAttendanceItem) || [];

    return { 
      success: true,
      data: transformedData, 
      count: count || 0,
      error: null
    };

  } catch (error) {
    console.error('Error fetching attendance data:', error);
    
    // Return mock data if database is not available
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      console.warn('Database tables not found, using mock data');
      const mockData = generateMockAttendanceData(options.pageSize || 10);
      return { 
        success: false,
        data: mockData, 
        count: mockData.length,
        error: 'Using mock data - database not configured'
      };
    }
    
    return { 
      success: false,
      data: [], 
      count: 0,
      error: error.message || 'Failed to fetch attendance data'
    };
  }
};

/**
 * Transform raw attendance data to display format
 * @param {Object} item - Raw data from database
 * @returns {Object} - Transformed data for display
 */
export const transformAttendanceItem = (item) => {
  return {
    id: item.id,
    date: formatDate(item.waktu_absen),
    time: formatTime(item.waktu_absen),
    presence: getPresenceText(item.status),
    nis: item.nis || item.siswa?.nis || 'N/A',
    nisn: item.nisn || item.siswa?.nisn || 'N/A',
    name: item.nama || item.siswa?.nama || 'Unknown',
    className: item.kelas || item.siswa?.kelas || 'N/A',
    status: getDisplayStatus(item.status),
    info: item.alasan_ditolak || getInfoFromStatus(item.status),
    rawData: item
  };
};

/**
 * Get attendance statistics from data
 * @param {Array} data - Attendance data array
 * @returns {Object} - Statistics object
 */
export const getAttendanceStatistics = (data) => {
  if (!data || !data.length) {
    return {
      total: 0,
      hadir: 0,
      terlambat: 0,
      tidak_hadir: 0,
      izin: 0,
      sakit: 0,
      keluar: 0,
      attendanceRate: 0
    };
  }

  const stats = data.reduce((acc, item) => {
    const status = item.rawData?.status || item.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const total = data.length;
  const hadir = stats.hadir || 0;
  const attendanceRate = total > 0 ? Math.round((hadir / total) * 100) : 0;

  return {
    total,
    hadir,
    terlambat: stats.terlambat || 0,
    tidak_hadir: stats.tidak_hadir || 0,
    izin: stats.izin || 0,
    sakit: stats.sakit || 0,
    keluar: stats.keluar || 0,
    attendanceRate
  };
};

/**
 * Export attendance data to CSV format
 * @param {Array} data - Attendance data array
 * @param {string} filename - Optional filename
 */
export const exportAttendanceToCSV = (data, filename) => {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }

  const headers = ['Date', 'Time', 'Presence', 'NIS', 'NISN', 'Name', 'Class', 'Status', 'Information'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.date,
      row.time,
      `"${row.presence}"`,
      row.nis,
      row.nisn,
      `"${row.name}"`,
      `"${row.className}"`,
      row.status,
      `"${row.info}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `attendance_history_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ===== HELPER FUNCTIONS =====

/**
 * Format date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format time string for display
 * @param {string} timeString - ISO time string
 * @returns {string} - Formatted time
 */
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const time = new Date(timeString);
  return time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Get presence text from status
 * @param {string} status - Database status
 * @returns {string} - Display text
 */
export const getPresenceText = (status) => {
  const presenceMap = {
    'hadir': 'Presensi Masuk',
    'tidak_hadir': 'Tidak Hadir',
    'terlambat': 'Presensi Masuk (Terlambat)',
    'izin': 'Izin',
    'sakit': 'Sakit',
    'pending': 'Menunggu Verifikasi'
  };
  return presenceMap[status] || 'Presensi Masuk';
};

/**
 * Get display status from database status
 * @param {string} status - Database status
 * @returns {string} - Display status
 */
export const getDisplayStatus = (status) => {
  const statusMap = {
    'hadir': 'Accepted',
    'tidak_hadir': 'Rejected',
    'terlambat': 'Pending',
    'izin': 'Pending',
    'sakit': 'Accepted',
    'pending': 'Pending'
  };
  return statusMap[status] || 'Pending';
};

/**
 * Get info text from status
 * @param {string} status - Database status
 * @returns {string} - Info text
 */
export const getInfoFromStatus = (status) => {
  const infoMap = {
    'hadir': 'Berhasil Hadir',
    'tidak_hadir': 'Tidak Hadir',
    'terlambat': 'Perlu Review',
    'izin': 'Perlu Review',
    'sakit': 'Dengan Keterangan',
    'pending': 'Menunggu Verifikasi'
  };
  return infoMap[status] || 'Berhasil';
};

/**
 * Generate mock attendance data for testing
 * @param {number} count - Number of records to generate
 * @returns {Array} - Mock data array
 */
export const generateMockAttendanceData = (count = 10) => {
  const names = ["Chu Yue", "Raihan Putra", "Salsa Nabila", "Dewi Lestari", "Gilang Pratama"];
  const classes = ["XI SIJA 1", "XI SIJA 2", "XI SIJA 3"];
  const statuses = ['hadir', 'terlambat', 'tidak_hadir', 'izin', 'sakit'];
  
  return Array.from({ length: count }, (_, i) => {
    const status = statuses[i % statuses.length];
    const date = new Date();
    date.setDate(date.getDate() - (i % 30)); // Spread over last 30 days
    
    return {
      id: `mock-${i}`,
      date: formatDate(date.toISOString()),
      time: formatTime(date.toISOString()),
      presence: getPresenceText(status),
      nis: String(244110000 + (i % 999)),
      nisn: String(1234567890 + (i % 999)),
      name: names[i % names.length],
      className: classes[i % classes.length],
      status: getDisplayStatus(status),
      info: getInfoFromStatus(status),
      rawData: {
        id: `mock-${i}`,
        siswa_id: `student-${i}`,
        nama: names[i % names.length],
        nis: String(244110000 + (i % 999)),
        nisn: String(1234567890 + (i % 999)),
        kelas: classes[i % classes.length],
        password_input: null,
        status,
        alasan_ditolak: status === 'tidak_hadir' ? 'Tidak ada keterangan' : null,
        waktu_absen: date.toISOString(),
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
        siswa: { 
          nama: names[i % names.length], 
          nis: String(244110000 + (i % 999)),
          nisn: String(1234567890 + (i % 999)),
          kelas: classes[i % classes.length]
        }
      }
    };
  });
};

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate attendance data structure
 * @param {Array} data - Data to validate
 * @returns {boolean} - True if valid
 */
export const validateAttendanceData = (data) => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => 
    item.id && 
    item.date && 
    item.time && 
    item.name && 
    item.status
  );
};

/**
 * Clean and sanitize attendance data
 * @param {Array} data - Raw data
 * @returns {Array} - Cleaned data
 */
export const sanitizeAttendanceData = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.filter(item => item && item.id).map(item => ({
    ...item,
    name: (item.name || '').trim(),
    nis: (item.nis || '').trim(),
    className: (item.className || '').trim(),
    date: item.date || 'N/A',
    time: item.time || 'N/A'
  }));
};
