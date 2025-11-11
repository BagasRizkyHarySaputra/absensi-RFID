import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client - environment variables only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('🚨 useAuth: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default context value
const defaultContextValue = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'AuthProvider not found' }),
  logout: () => ({ success: false, error: 'AuthProvider not found' }),
  updateUser: () => ({ success: false, error: 'AuthProvider not found' }),
  checkAuth: () => {}
};

// Auth Context
const AuthContext = createContext(defaultContextValue);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth must be used within AuthProvider. Returning default values.');
    return defaultContextValue;
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
      const savedUser = localStorage.getItem('absensi_user_v2');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Verify the token is still valid (basic check)
        if (userData && userData.nis && userData.nama) {
          setUser(userData);
        } else {
          localStorage.removeItem('absensi_user_v2');
        }
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      localStorage.removeItem('absensi_user_v2');
    } finally {
      setLoading(false);
    }
  };

  const login = async (nis, password) => {
    setLoading(true);
    setError(null);

    try {
      // Check for admin login
      if (nis === 'admin@gmail.com' && password === 'admin123') {
        const adminUser = {
          id: 'admin-001',
          nama: 'Administrator',
          nis: 'admin@gmail.com',
          nisn: '0000000000',
          kelas: 'Admin',
          role: 'admin',
          loginTime: new Date().toISOString()
        };
        
        setUser(adminUser);
        localStorage.setItem('absensi_user_v2', JSON.stringify(adminUser));
        return { success: true, user: adminUser };
      }

      // Query database untuk cari user berdasarkan NIS
      const { data: siswaData, error: queryError } = await supabase
        .from('siswa')
        .select('*')
        .eq('nis', nis)
        .single();

      if (queryError || !siswaData) {
        throw new Error('NIS tidak ditemukan atau tidak terdaftar');
      }

      // Verify password 
      if (siswaData.password !== password) {
        throw new Error('Password salah');
      }

      // Set user data
      const userData = {
        id: siswaData.id,
        nama: siswaData.nama,
        nis: siswaData.nis,
        nisn: siswaData.nisn || '',
        kelas: siswaData.kelas || '',
        role: 'student',
        loginTime: new Date().toISOString()
      };

      setUser(userData);
      localStorage.setItem('absensi_user_v2', JSON.stringify(userData));

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
    try {
      setUser(null);
      setError(null);
      localStorage.removeItem('absensi_user_v2');
      
      // Optional: Clear other related data
      localStorage.removeItem('last_activity');
      
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false, error: err.message };
    }
  };

  const updateUser = (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('absensi_user_v2', JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      console.error('Update user error:', err);
      return { success: false, error: err.message };
    }
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default { useAuth, AuthProvider };