'use client';

import React, { useEffect } from 'react';
import '../static/css/DashboardBACKGROUND.css';

// Import JavaScript functionality
if (typeof window !== 'undefined') {
  import('../static/js/DashboardBACKGROUND.js');
}

const DashboardBackground = ({ children }) => {
  useEffect(() => {
    // Initialize background animations atau effects jika diperlukan
    const initializeBackground = () => {
      // Add any dynamic background effects here
      console.log('Dashboard Background initialized');
    };

    initializeBackground();
  }, []);

  return (
    <div className="dashboard-background">
      {/* Background Base */}
      <div className="background-base"></div>
      
      {/* Background Shapes */}
      <div className="background-shapes">
        {/* Extra Large Background Ellipse */}
        <div className="ellipse-shape mega-ellipse"></div>
        
        {/* Main Ellipse Shape - Right Side */}
        <div className="ellipse-shape main-ellipse"></div>
        
        {/* Secondary Ellipse Shapes for depth */}
        <div className="ellipse-shape secondary-ellipse-1"></div>
        <div className="ellipse-shape secondary-ellipse-2"></div>
        
        {/* Additional subtle shapes */}
        <div className="ellipse-shape accent-ellipse-1"></div>
        <div className="ellipse-shape accent-ellipse-2"></div>
      </div>

      {/* Background Overlay untuk smooth blending */}
      <div className="background-overlay"></div>

      {/* Content Container */}
      <div className="background-content">
        {children}
      </div>
    </div>
  );
};

export default DashboardBackground;
