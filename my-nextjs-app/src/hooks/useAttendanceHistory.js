import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';

// Custom hook specifically for attendance history with advanced features
export const useAttendanceHistory = (filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAttendanceHistory = async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build query with joins to get user and class information
      let query = db.supabase
        .from('presensi')
        .select(`
          *,
          users (
            id,
            name,
            nis,
            email,
            role
          ),
          kelas (
            id,
            nama_kelas,
            tingkat,
            jurusan
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.kelasId) {
        query = query.eq('kelas_id', filters.kelasId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('tanggal', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('tanggal', filters.endDate);
      }

      if (filters.search) {
        // Search in user name or NIS
        query = query.or(`users.name.ilike.%${filters.search}%,users.nis.ilike.%${filters.search}%`);
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
      const transformedData = result?.map(transformAttendanceData) || [];

      setData(transformedData);
      setTotalCount(count || 0);
      return { data: transformedData, count };

    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError(err.message || 'Failed to fetch attendance data');
      
      // Fallback to mock data if database is not available
      if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
        console.warn('Database tables not found, using mock data');
        const mockData = generateMockData(options.pageSize || 10);
        setData(mockData);
        setTotalCount(mockData.length);
        return { data: mockData, count: mockData.length };
      }
      
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  };

  // Transform raw data to display format
  const transformAttendanceData = (item) => {
    return {
      id: item.id,
      date: formatDate(item.tanggal),
      time: formatTime(item.waktu),
      presence: getPresenceText(item.status),
      nis: item.users?.nis || 'N/A',
      name: item.users?.name || 'Unknown',
      className: item.kelas?.nama_kelas || 'N/A',
      status: getDisplayStatus(item.status),
      info: getInfoFromStatus(item.status),
      rawData: item
    };
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const time = new Date(timeString);
    return time.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getPresenceText = (status) => {
    const presenceMap = {
      'hadir': 'Presensi Masuk',
      'keluar': 'Presensi Keluar',
      'terlambat': 'Presensi Masuk (Terlambat)',
      'tidak_hadir': 'Tidak Hadir',
      'izin': 'Izin',
      'sakit': 'Sakit'
    };
    return presenceMap[status] || 'Presensi Masuk';
  };

  const getDisplayStatus = (status) => {
    const statusMap = {
      'hadir': 'Accepted',
      'keluar': 'Accepted',
      'terlambat': 'Pending',
      'tidak_hadir': 'Rejected',
      'izin': 'Pending',
      'sakit': 'Accepted'
    };
    return statusMap[status] || 'Accepted';
  };

  const getInfoFromStatus = (status) => {
    const infoMap = {
      'hadir': 'Successful',
      'keluar': 'Successful',
      'terlambat': 'Under Review',
      'tidak_hadir': 'Rejected',
      'izin': 'Under Review',
      'sakit': 'Successful'
    };
    return infoMap[status] || 'Successful';
  };

  // Get statistics
  const getStatistics = () => {
    if (!data.length) return null;

    const stats = data.reduce((acc, item) => {
      const status = item.rawData.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const total = data.length;
    return {
      total,
      hadir: stats.hadir || 0,
      terlambat: stats.terlambat || 0,
      tidak_hadir: stats.tidak_hadir || 0,
      izin: stats.izin || 0,
      sakit: stats.sakit || 0,
      keluar: stats.keluar || 0,
      attendanceRate: total > 0 ? Math.round(((stats.hadir || 0) / total) * 100) : 0
    };
  };

  // Export data functionality
  const exportToCSV = () => {
    if (!data.length) return;

    const headers = ['Date', 'Time', 'Presence', 'NIS', 'Name', 'Class', 'Status', 'Information'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        row.time,
        `"${row.presence}"`,
        row.nis,
        `"${row.name}"`,
        `"${row.className}"`,
        row.status,
        row.info
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate mock data for fallback
  const generateMockData = (count = 10) => {
    const names = ["Chu Yue", "Raihan Putra", "Salsa Nabila", "Dewi Lestari", "Gilang Pratama"];
    const classes = ["XI SIJA 1", "XI SIJA 2", "XI SIJA 3"];
    const statuses = ['hadir', 'terlambat', 'tidak_hadir'];
    
    return Array.from({ length: count }, (_, i) => {
      const status = statuses[i % statuses.length];
      return {
        id: `mock-${i}`,
        date: formatDate(new Date()),
        time: formatTime(new Date()),
        presence: getPresenceText(status),
        nis: String(244110000 + (i % 999)).padEnd(9, "0"),
        name: names[i % names.length],
        className: classes[i % classes.length],
        status: getDisplayStatus(status),
        info: getInfoFromStatus(status),
        rawData: {
          id: `mock-${i}`,
          status,
          tanggal: new Date().toISOString().split('T')[0],
          waktu: new Date().toISOString(),
          users: { name: names[i % names.length], nis: String(244110000 + (i % 999)) },
          kelas: { nama_kelas: classes[i % classes.length] }
        }
      };
    });
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [filters]);

  return {
    data,
    loading,
    error,
    totalCount,
    statistics: getStatistics(),
    refetch: fetchAttendanceHistory,
    exportToCSV
  };
};

export default useAttendanceHistory;