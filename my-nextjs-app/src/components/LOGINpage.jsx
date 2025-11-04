'use client';

import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLogin, useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import '../static/css/fonts.css';
import '../static/css/LOGINpage.css';
import LoginBackground from './LOGINbackground';

// Import JavaScript functionality
if (typeof window !== 'undefined') {
  import('../static/js/LOGINpage.js');
}

const LoginPage = () => {
  const [formData, setFormData] = useState({
    nis: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { handleLogin, loading, error, clearError } = useLogin();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error saat user mulai mengetik
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await handleLogin(formData.nis, formData.password);
    
    if (result.success) {
      // Redirect ke dashboard
      router.push('/dashboard');
    }
  };

  return (
    <>
      <LoginBackground />
      <div className="login-container">
        <div className="max-w-md w-full space-y-8">
          {/* Logo/Header Section */}
          <div className="logo-container">
            <div className="logo-icon">
              <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM2 8a6 6 0 1010.743 5.743L12 14l-0.257-0.257A6 6 0 712 8z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="logo-title">
              Sistem Absensi RFID
            </h2>
            <p className="logo-subtitle">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

        {/* Login Form */}
        <div className="login-card">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">
                {error}
              </p>
            </div>
          )}

          <form id="loginForm" className="space-y-6" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nis" className="form-label">
                NIS (Nomor Induk Siswa)
              </label>
              <input
                id="nis"
                name="nis"
                type="text"
                required
                value={formData.nis}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Masukkan NIS Anda"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Masukkan password Anda"
                  autoComplete="current-password"
                />
                <button
                  id="passwordToggle"
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="form-options">
              <div className="checkbox-container">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="checkbox"
                />
                <label htmlFor="remember-me" className="text-sm text-gray-700">
                  Ingat saya
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="forgot-password">
                  Lupa password?
                </a>
              </div>
            </div>

            <div>
              <button
                id="submitButton"
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading && (
                  <div id="loadingSpinner" className="loading-spinner"></div>
                )}
                <span id="buttonText">
                  {loading ? 'Memproses...' : 'Masuk'}
                </span>
              </button>
            </div>
          </form>

          {/* Demo credentials info */}
          <div className="demo-info">
            <p className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 border rounded">
              <strong>Demo:</strong> NIS: admin, Password: admin <br />
              Atau gunakan NIS siswa yang terdaftar di database
            </p>
          </div>

          {/* Replaced additional links with copyright */}
          <div className="additional-links">
            <p className="footer-text">Copyright © 2025 SMK NEGERI 7 SEMARANG.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p className="footer-text">
            
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginPage;