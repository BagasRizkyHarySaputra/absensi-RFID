"use client";

import React, { useState } from 'react';
import LOGINbackground from './LOGINbackground';
import DASHBOARDpage from './DASHBOARDpage';
import '../static/css/LOGINpage.css';

const LOGINpage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (loginError) setLoginError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check credentials
    if (formData.email === 'admin@gmail.com' && formData.password === 'admin123') {
      setIsLoggedIn(true);
      setLoginError('');
      console.log('Login successful');
    } else {
      setLoginError('Invalid email or password');
      console.log('Login failed');
    }
  };

  // If logged in, show dashboard
  if (isLoggedIn) {
    return <DASHBOARDpage onLogout={() => setIsLoggedIn(false)} />;
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
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
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
              />
            </div>
            
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            
            <button type="submit" className="login-button">
              Log in
            </button>
          </form>
          
          {/* login-footer removed as per latest request */}
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
