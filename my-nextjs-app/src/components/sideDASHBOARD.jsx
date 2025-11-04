'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  ClockIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const SidebarDashboard = ({ onMenuSelect, activeMenu = 'dashboard' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  // Menu items configuration
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '/dashboard.svg', // Custom SVG path
      href: '/dashboard'
    },
    {
      id: 'history',
      label: 'History',
      icon: '/history.svg', // Custom SVG path
      href: '/history'
    },
    {
      id: 'kelas',
      label: 'Kelas',
      icon: '/kelas.svg', // Custom SVG path
      href: '/kelas'
    },
    {
      id: 'pengajuan',
      label: 'Pengajuan',
      icon: '/pengajuan.svg', // Custom SVG path
      href: '/pengajuan'
    }
  ];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // On desktop, sidebar should be open by default
      if (!mobile) {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Handle menu item click
  const handleMenuClick = (menuId) => {
    if (menuId === 'logout') {
      handleLogout();
      return;
    }
    
    if (onMenuSelect) {
      onMenuSelect(menuId);
    }
    
    // Close mobile sidebar after selection
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    // Konfirmasi sebelum logout
    const confirmLogout = confirm('Apakah Anda yakin ingin keluar dari aplikasi?');
    
    if (!confirmLogout) {
      return; // User cancelled logout
    }
    
    try {
      // Use the logout function from auth context
      logout();
      
      // Force a complete page reload to ensure clean state
      window.location.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect even if logout fails
      window.location.replace('/');
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Close sidebar when clicking outside (mobile)
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          id="sidebar-toggle"
          onClick={toggleSidebar}
          className={`sidebar-mobile-toggle ${scrolled ? 'scrolled' : ''}`}
          aria-label="Toggle Sidebar"
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          id="sidebar-overlay"
          className="sidebar-overlay active"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="sidebar-container"
        className={`sidebar ${
          isMobile 
            ? (isOpen ? 'mobile-visible' : 'mobile-hidden')
            : (isOpen ? 'desktop-visible' : 'desktop-hidden')
        }`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-container">
              <div className="logo-circle">
                {/* Logo STEMBA */}
                <div className="logo-image">
                  <Image
                    src="/LOGO-STEMBA.png"
                    alt="Logo STEMBA"
                    width={32}
                    height={32}
                    priority
                  />
                </div>
              </div>
              <div className="logo-text">
                <h1>Presensi</h1>
                <p>SMK Negeri 7 Semarang</p>
              </div>
            </div>
          </div>
          
          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="sidebar-close-btn"
              aria-label="Close Sidebar"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => {
              const isActive = activeMenu === item.id;
              
              return (
                <li key={item.id} className="nav-item">
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                    data-menu={item.id}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="nav-icon">
                      <Image
                        src={item.icon}
                        alt={`${item.label} icon`}
                        width={20}
                        height={20}
                      />
                    </div>
                    <span className="nav-text">{item.label}</span>
                    {isActive && <div className="nav-indicator" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="sidebar-footer">
          <button
            onClick={() => handleMenuClick('logout')}
            className="logout-btn"
            aria-label="Logout"
            title="Keluar dari aplikasi"
          >
            <div className="logout-icon">
              {/* Option 1: Using Heroicon */}
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              {/* Option 2: Using custom SVG (uncomment if you have logout.svg)
              <Image
                src="/logout.svg"
                alt="Logout icon"
                width={20}
                height={20}
                className="custom-logout-icon"
              />
              */}
            </div>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarDashboard;
