import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook untuk mengelola data kehadiran
 * Disesuaikan dengan struktur database:
 * - Tabel kehadiran: id, siswa_id, nama, nis, nisn, kelas, password_input, status, alasan_ditolak, waktu_absen, created_at, updated_at
 * - Tabel siswa: id, nama, nis, nisn, kelas, created_at, updated_at, password
 */
export const useKehadiran = (filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch data kehadiran dengan join ke tabel siswa
  const fetchKehadiran = async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Query dengan join ke tabel siswa
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
        query = query.or(`nama.ilike.%${filters.search}%,nis.ilike.%${filters.search}%,nisn.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'waktu_absen';
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

      setData(result || []);
      setTotalCount(count || 0);
      return { data: result || [], count: count || 0 };

    } catch (err) {
      console.error('Error fetching kehadiran:', err);
      setError(err.message || 'Failed to fetch kehadiran data');
      
      // Fallback ke mock data jika database tidak tersedia
      if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
        console.warn('Database tables not found, using mock data');
        const mockData = generateMockKehadiran(options.pageSize || 10);
        setData(mockData);
        setTotalCount(mockData.length);
        return { data: mockData, count: mockData.length };
      }
      
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data untuk fallback
  const generateMockKehadiran = (count = 10) => {
    const names = ["Ahmad Pratama", "Siti Nurhaliza", "Budi Santoso", "Rina Kusuma", "Joko Widodo"];
    const classes = ["XI SIJA 1", "XI SIJA 2", "XI SIJA 3"];
    const statuses = ['hadir', 'terlambat', 'tidak_hadir', 'izin', 'sakit', 'pending'];
    
    return Array.from({ length: count }, (_, i) => {
      const status = statuses[i % statuses.length];
      const date = new Date();
      date.setDate(date.getDate() - (i % 30));
      
      return {
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
          id: `student-${i}`,
          nama: names[i % names.length],
          nis: String(244110000 + (i % 999)),
          nisn: String(1234567890 + (i % 999)),
          kelas: classes[i % classes.length],
          password: 'hashed_password'
        }
      };
    });
  };

  // Get statistics dari data
  const getStatistics = () => {
    if (!data.length) return null;

    const stats = data.reduce((acc, item) => {
      const status = item.status;
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
      pending: stats.pending || 0,
      attendanceRate
    };
  };

  useEffect(() => {
    fetchKehadiran();
  }, [filters]);

  return {
    data,
    loading,
    error,
    totalCount,
    statistics: getStatistics(),
    refetch: fetchKehadiran
  };
};

/**
 * Custom hook untuk mengelola data siswa
 */
export const useSiswa = () => {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSiswa = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('siswa')
        .select('*')
        .order('nama', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setSiswa(data || []);
    } catch (err) {
      console.error('Error fetching siswa:', err);
      setError(err.message || 'Failed to fetch siswa data');
      
      // Fallback ke mock data
      const mockSiswa = [
        { id: 1, nama: 'Ahmad Pratama', nis: '244110001', nisn: '1234567891', kelas: 'XI SIJA 1' },
        { id: 2, nama: 'Siti Nurhaliza', nis: '244110002', nisn: '1234567892', kelas: 'XI SIJA 1' },
        { id: 3, nama: 'Budi Santoso', nis: '244110003', nisn: '1234567893', kelas: 'XI SIJA 2' }
      ];
      setSiswa(mockSiswa);
    } finally {
      setLoading(false);
    }
  };

  const createSiswa = async (siswaData) => {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .insert(siswaData)
        .select();

      if (error) throw error;

      await fetchSiswa(); // Refresh data
      return { success: true, data };
    } catch (err) {
      console.error('Error creating siswa:', err);
      return { success: false, error: err.message };
    }
  };

  const updateSiswa = async (id, siswaData) => {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .update(siswaData)
        .eq('id', id)
        .select();

      if (error) throw error;

      await fetchSiswa(); // Refresh data
      return { success: true, data };
    } catch (err) {
      console.error('Error updating siswa:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteSiswa = async (id) => {
    try {
      const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSiswa(); // Refresh data
      return { success: true };
    } catch (err) {
      console.error('Error deleting siswa:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchSiswa();
  }, []);

  return {
    siswa,
    loading,
    error,
    refetch: fetchSiswa,
    createSiswa,
    updateSiswa,
    deleteSiswa
  };
};

/**
 * Custom hook untuk create kehadiran
 */
export const useCreateKehadiran = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createKehadiran = async (kehadiranData) => {
    setLoading(true);
    setError(null);

    try {
      // Ambil data siswa berdasarkan NIS
      const { data: siswaData, error: siswaError } = await supabase
        .from('siswa')
        .select('*')
        .eq('nis', kehadiranData.nis)
        .single();

      if (siswaError || !siswaData) {
        throw new Error('Siswa tidak ditemukan');
      }

      // Insert kehadiran
      const { data, error } = await supabase
        .from('kehadiran')
        .insert({
          siswa_id: siswaData.id,
          nama: siswaData.nama,
          nis: siswaData.nis,
          nisn: siswaData.nisn,
          kelas: siswaData.kelas,
          password_input: kehadiranData.password_input,
          status: kehadiranData.status || 'pending',
          alasan_ditolak: kehadiranData.alasan_ditolak,
          waktu_absen: kehadiranData.waktu_absen || new Date().toISOString()
        })
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('Error creating kehadiran:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createKehadiran
  };
};

/**
 * Helper functions
 */
export const formatKehadiranData = (item) => {
  return {
    id: item.id,
    siswaId: item.siswa_id,
    nama: item.nama || item.siswa?.nama,
    nis: item.nis || item.siswa?.nis,
    nisn: item.nisn || item.siswa?.nisn,
    kelas: item.kelas || item.siswa?.kelas,
    status: item.status,
    alasanDitolak: item.alasan_ditolak,
    waktuAbsen: item.waktu_absen,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
};

export const getKelasList = (siswaData) => {
  const kelasSet = new Set();
  siswaData.forEach(siswa => {
    if (siswa.kelas) {
      kelasSet.add(siswa.kelas);
    }
  });
  return Array.from(kelasSet).sort();
};

export default useKehadiran;
