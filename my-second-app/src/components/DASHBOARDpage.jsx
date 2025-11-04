"use client";

import React, { useState, useEffect } from 'react';
import SIDEBOARDpage from './SIDEBOARDpage';
import HEDAERBOARDpage from './HEDAERBOARDpage';
import ACTIVITYpage from './ACTIVITYpage';
import REPORT from './REPORT';
import DASHBOARDtable from './DASHBOARDtable';
import HEADERINpage from './HEADERINpage';
import Classes from './Classes';
import Approvals from './Approvals';
import { createClient } from '@supabase/supabase-js';
import '../static/css/DASHBOARDpage.css';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DASHBOARDpage = ({ onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard stats from database
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get total students
      const { count: totalStudents } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true });

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('absensi')
        .select('status')
        .gte('tanggal', today.toISOString())
        .lt('tanggal', tomorrow.toISOString());

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
      }

      // Count present and absent
      const presentToday = attendanceData?.filter(a => a.status === 'hadir').length || 0;
      const absentToday = attendanceData?.filter(a => a.status === 'tidak_hadir' || a.status === 'alpha').length || 0;
      const attendanceRate = totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(1) : 0;

      setStats({
        totalStudents: totalStudents || 0,
        presentToday,
        absentToday,
        attendanceRate
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  // Lock body scroll on small screens when sidebar (drawer) is open
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    if (isMobile && sidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [sidebarOpen]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const recentActivity = [
    { id: 1, name: 'Ahmad Rizki', action: 'Check In', time: '07:15', status: 'present' },
    { id: 2, name: 'Siti Nurhaliza', action: 'Check In', time: '07:20', status: 'present' },
    { id: 3, name: 'Budi Santoso', action: 'Check Out', time: '15:30', status: 'present' },
    { id: 4, name: 'Maya Putri', action: 'Check In', time: '07:45', status: 'late' },
    { id: 5, name: 'Doni Prakoso', action: 'Check In', time: '08:00', status: 'late' }
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <HEDAERBOARDpage 
        onLogout={onLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="dashboard-content">
        {/* Sidebar with smooth transition */}
        <SIDEBOARDpage 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
          style={{
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />

        {/* Backdrop for mobile drawer */}
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`}
        />

        {/* Main Content */}
        <main className="dashboard-main">
          {activeSection === 'dashboard' && (
            <div className="dashboard-content-wrapper">
              {/* Header Section */}
              <HEADERINpage title="Dashboard" />

              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3 className="stat-number">{stats.totalStudents}</h3>
                    <p className="stat-label">Total Students</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3 className="stat-number">{stats.presentToday}</h3>
                    <p className="stat-label">Present Today</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">❌</div>
                  <div className="stat-content">
                    <h3 className="stat-number">{stats.absentToday}</h3>
                    <p className="stat-label">Absent Today</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3 className="stat-number">{stats.attendanceRate}%</h3>
                    <p className="stat-label">Attendance Rate</p>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Content */}
              <div className="dashboard-layout">
                {/* Attendance Table */}
                <DASHBOARDtable />

                {/* Bottom Section */}
                <div className="bottom-section">
                  {/* Student Attendance Report */}
                  <div className="attendance-report">
                    <div className="report-header">
                      <div className="header-line"></div>
                      <h3>Student Attendance Report</h3>
                    </div>
                    
                    <div className="attendance-content">
                      <div className="attendance-stats">
                        <div className="stat-item hadir">
                          <span className="stat-bullet">+</span>
                          <span className="stat-text">Hadir</span>
                        </div>
                        <div className="stat-item izin">
                          <span className="stat-bullet">+</span>
                          <span className="stat-text">Izin</span>
                        </div>
                        <div className="stat-item alpha">
                          <span className="stat-bullet">+</span>
                          <span className="stat-text">Alpha</span>
                        </div>
                      </div>
                      
                      <div className="pie-chart-section">
                        <div className="pie-chart">
                          <img src="/chart.svg" alt="Attendance Chart" className="chart-image" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="class-selector">
                      <img src="/panah-kiri.svg" alt="Previous" className="arrow-left" />
                      <div className="select-container">
                        <div className="class-select">
                          XI SIJA 2
                        </div>
                      </div>
                      <img src="/panah-kanan.svg" alt="Next" className="arrow-right" />
                    </div>
                  </div>

                  {/* Action Cards Container */}
                  <div className="action-cards-container">
                    <div className="action-cards">
                      <div className="action-card">
                        <div className="card-header">
                          <span className="card-category">Pengajuan</span>
                          <h4 className="card-title">Reset Password</h4>
                          <p className="card-description">Lupa password</p>
                        </div>
                        <div className="card-content">
                          <div className="user-info">
                            <div className="user-icon">
                              <img src="/account_circle.svg" alt="User" width="24" height="24" />
                            </div>
                            <div className="user-details">
                              <span className="user-name">Chu Yue</span>
                              <span className="user-class">XI SIJA 2</span>
                            </div>
                          </div>
                        </div>
                        <div className="action-buttons">
                          <button className="btn-accept">
                            <img src="/Check.svg" alt="Accept" />
                          </button>
                          <button className="btn-decline">
                            <img src="/X.svg" alt="Decline" />
                          </button>
                        </div>
                      </div>

                      <div className="action-card">
                        <div className="card-header">
                          <span className="card-category">Pengajuan</span>
                          <h4 className="card-title">Izin</h4>
                          <p className="card-description">Sakit perut</p>
                        </div>
                        <div className="card-content">
                          <div className="user-info">
                            <div className="user-icon">
                              <img src="/account_circle.svg" alt="User" width="24" height="24" />
                            </div>
                            <div className="user-details">
                              <span className="user-name">Chu Yue</span>
                              <span className="user-class">XI SIJA 2</span>
                            </div>
                          </div>
                        </div>
                        <div className="action-buttons">
                          <button className="btn-accept">
                            <img src="/Check.svg" alt="Accept" />
                          </button>
                          <button className="btn-decline">
                            <img src="/X.svg" alt="Decline" />
                          </button>
                        </div>
                      </div>

                      <div className="action-card">
                        <div className="card-header">
                          <span className="card-category">Pengajuan</span>
                          <h4 className="card-title">Presensi</h4>
                          <p className="card-description">Siswa tidak ditemukan di kelas</p>
                        </div>
                        <div className="card-content">
                          <div className="user-info">
                            <div className="user-icon">
                              <img src="/account_circle.svg" alt="User" width="24" height="24" />
                            </div>
                            <div className="user-details">
                              <span className="user-name">Chu Yue</span>
                              <span className="user-class">XI SIJA 2</span>
                            </div>
                          </div>
                        </div>
                        <div className="action-buttons">
                          <button className="btn-accept">
                            <img src="/Check.svg" alt="Accept" />
                          </button>
                          <button className="btn-decline">
                            <img src="/X.svg" alt="Decline" />
                          </button>
                        </div>
                      </div>

                      <div className="action-card">
                        <div className="card-header">
                          <span className="card-category">Pengajuan</span>
                          <h4 className="card-title">Cuti</h4>
                          <p className="card-description">Urusan keluarga</p>
                        </div>
                        <div className="card-content">
                          <div className="user-info">
                            <div className="user-icon">
                              <img src="/account_circle.svg" alt="User" width="24" height="24" />
                            </div>
                            <div className="user-details">
                              <span className="user-name">Ali Rahman</span>
                              <span className="user-class">XII RPL 1</span>
                            </div>
                          </div>
                        </div>
                        <div className="action-buttons">
                          <button className="btn-accept">
                            <img src="/Check.svg" alt="Accept" />
                          </button>
                          <button className="btn-decline">
                            <img src="/X.svg" alt="Decline" />
                          </button>
                        </div>
                      </div>

                      <div className="action-card">
                        <div className="card-header">
                          <span className="card-category">Pengajuan</span>
                          <h4 className="card-title">Terlambat</h4>
                          <p className="card-description">Macet di jalan</p>
                        </div>
                        <div className="card-content">
                          <div className="user-info">
                            <div className="user-icon">
                              <img src="/account_circle.svg" alt="User" width="24" height="24" />
                            </div>
                            <div className="user-details">
                              <span className="user-name">Sari Dewi</span>
                              <span className="user-class">X TKJ 3</span>
                            </div>
                          </div>
                        </div>
                        <div className="action-buttons">
                          <button className="btn-accept">
                            <img src="/Check.svg" alt="Accept" />
                          </button>
                          <button className="btn-decline">
                            <img src="/X.svg" alt="Decline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}          {activeSection === 'activity' && (
            <ACTIVITYpage />
          )}

          {activeSection === 'reports' && (
            <REPORT />
          )}

          {activeSection === 'classes' && (
            <Classes />
          )}

          {activeSection === 'approvals' && (
            <Approvals />
          )}
        </main>
      </div>
    </div>
  );
};

export default DASHBOARDpage;
