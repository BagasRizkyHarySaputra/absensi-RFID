'use client';

import React, { useEffect } from 'react';
import '../static/css/fonts.css';
import '../static/css/LOGINbackground.css';

// Import JavaScript functionality
if (typeof window !== 'undefined') {
  import('../static/js/LOGINbackground.js');
}

const LoginBackground = () => {
  useEffect(() => {
    // Initialize background animations when component mounts
    const initBackground = () => {
      // Any additional initialization can be done here
      console.log('Login background initialized');
    };

    // Set a small delay to ensure the DOM is ready
    const timer = setTimeout(initBackground, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="background-container">
      {/* Pink ellipse */}
      <div className="gradient-ellipse ellipse-pink"></div>
      
      {/* Blue ellipse */}
      <div className="gradient-ellipse ellipse-blue"></div>
      
      {/* Purple ellipse */}
      <div className="gradient-ellipse ellipse-purple"></div>
      
      {/* Cyan ellipse */}
      <div className="gradient-ellipse ellipse-cyan"></div>
    </div>
  );
};

export default LoginBackground;
