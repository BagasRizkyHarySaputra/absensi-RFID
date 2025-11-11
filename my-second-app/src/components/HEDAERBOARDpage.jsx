"use client";

import React from 'react';
import '../static/css/HEDAERBOARDpage.css';

const HEDAERBOARDpage = ({ onLogout, sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="dashboard-header">
      {/* Left Side - Logo and Title */}
      <div className="header-left">
        <div className="header-logo-section">
          {/* Menu Toggle Button */}
          <button 
            className="menu-toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <img 
              src={sidebarOpen ? "/menu_open.svg" : "/menu_close.svg"}
              alt={sidebarOpen ? "Open Menu" : "Close Menu"}
              className="menu-icon"
            />
          </button>
          
          <img 
            src="/LOGO-STEMBA.png" 
            alt="SMK Negeri 7 Semarang Logo" 
            className="header-logo"
          />
          <div className="header-text">
            <h1 className="header-Title">Presensi</h1>
            <p className="header-subtitle">SMK Negeri 7 Semarang</p>
          </div>
        </div>
      </div>

      {/* Center - Empty space for balanced layout */}
      <div className="header-center">
        {/* Time display removed as requested */}
      </div>

      {/* Right Side - Actions */}
      <div className="header-right">
        <div className="header-actions">
          {/* Notifications */}
          <button className="header-action-btn" title="Notifications">
            <img 
              src="/notifications.svg" 
              alt="Notifications" 
              className="header-icon"
            />
          </button>

          {/* More Options */}
          <button className="header-action-btn" title="More Options">
            <img 
              src="/more.svg" 
              alt="More Options" 
              className="header-icon"
            />
          </button>

          {/* User Profile */}
          <div className="user-profile">
            <button className="profile-btn" title="User Profile">
              <img 
                src="/account_circle.svg" 
                alt="User Profile" 
                className="profile-icon"
              />
            </button>
            <div className="user-dropdown">
              <div className="user-info">
                <span className="user-name">Admin</span>
                <span className="user-role">Administrator</span>
              </div>
              <hr className="dropdown-divider" />
              <button className="dropdown-item logout-item" onClick={onLogout}>
                <svg className="logout-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HEDAERBOARDpage;
