"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LOGINbackground from './LOGINbackground';
import { useAuth } from '../hooks/useAuth';
import '../static/css/LOGINpage.css';

const LOGINpage = () => {
  const [formData, setFormData] = useState({
    nis: '',
    password: ''
  });
  
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (loginError) setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nis.trim() || !formData.password.trim()) {
      setLoginError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      const result = await login(formData.nis.trim(), formData.password);
      
      if (result.success) {
        // Success - redirect will happen automatically via useEffect
        console.log('Login successful:', result.user);
        router.push('/dashboard');
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if checking authentication
  if (loading) {
    return (
      <div className="login-container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <LOGINbackground />
      {/* Left main area text */}
      <div className="left-hero" aria-hidden="false">
        <div className="left-hero-inner">
          <div className="hero-line">Presence With</div>
          <div className="hero-rfid">RFID</div>
          <div className="hero-tech">TECHNOLOGY</div>
        </div>
      </div>

      <div className="login-form-wrapper">
        <div className="login-form-container">
          <div className="login-header">
            <h1>Welcome</h1>
            <p>Please sign in to your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            {loginError && (
              <div className="login-error">
                {loginError}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="nis">Email / NIS</label>
              <input
                type="text"
                id="nis"
                name="nis"
                value={formData.nis}
                onChange={handleInputChange}
                placeholder="Enter your email or NIS"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" disabled={isLoading} />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password" style={{ opacity: isLoading ? 0.5 : 1 }}>
                Forgot password?
              </a>
            </div>
            
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span style={{ marginRight: '8px' }}>Signing in...</span>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }}></div>
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>
          
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: '#f8fafc', 
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Demo Login:
            </div>
            <div>Admin: <code>admin@gmail.com</code> / <code>admin123</code></div>
          </div>
        </div>
      </div>

      {/* Footer badge centered at bottom */}
      <div className="site-footer" role="contentinfo">
        <div className="footer-badge" aria-label="copyright notice">
          <span className="footer-text">Copyright <span aria-hidden>©</span> 2025 SMK NEGERI 7 SEMARANG</span>
        </div>
      </div>
    </div>
  );
};

export default LOGINpage;
