import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

// Auth Context
const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const savedUser = localStorage.getItem('absensi_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      localStorage.removeItem('absensi_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (nis, password) => {
    setLoading(true);
    setError(null);

    try {
      // Check if supabase is available
      if (!supabase) {
        // Mock login for demo mode
        console.warn('Database not configured, using mock login');
        const mockUser = {
          id: 'mock-' + nis,
          nama: 'Demo User',
          nis: nis,
          nisn: '1234567890',
          kelas: 'XI SIJA 1'
        };
        
        if (nis === 'admin' && password === 'admin') {
          mockUser.nama = 'Administrator';
          mockUser.role = 'admin';
        }
        
        setUser(mockUser);
        localStorage.setItem('absensi_user', JSON.stringify(mockUser));
        return { success: true, user: mockUser };
      }

      // Query database untuk cari user berdasarkan NIS
      const { data: siswaData, error: queryError } = await supabase
        .from('siswa')
        .select('*')
        .eq('nis', nis)
        .single();

      if (queryError || !siswaData) {
        throw new Error('NIS tidak ditemukan');
      }

      // Verify password (dalam implementasi nyata, gunakan bcrypt)
      if (siswaData.password !== password) {
        throw new Error('Password salah');
      }

      // Set user data
      const userData = {
        id: siswaData.id,
        nama: siswaData.nama,
        nis: siswaData.nis,
        nisn: siswaData.nisn,
        kelas: siswaData.kelas,
        role: 'student'
      };

      setUser(userData);
      localStorage.setItem('absensi_user', JSON.stringify(userData));

      return { success: true, user: userData };

    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Terjadi kesalahan saat login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear user state first
    setUser(null);
    setError(null);
    setLoading(false);
    
    // Clear localStorage
    localStorage.removeItem('absensi_user');
    
    // Additional cleanup for any other auth-related keys
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook untuk login form
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleLogin = async (nis, password) => {
    setLoading(true);
    setError(null);

    if (!nis || !password) {
      setError('NIS dan password harus diisi');
      setLoading(false);
      return { success: false, error: 'NIS dan password harus diisi' };
    }

    const result = await login(nis, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  };

  return {
    handleLogin,
    loading,
    error,
    clearError: () => setError(null)
  };
};

// Admin check function
export const useAdmin = () => {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.nis === 'admin';
};

export default useAuth;