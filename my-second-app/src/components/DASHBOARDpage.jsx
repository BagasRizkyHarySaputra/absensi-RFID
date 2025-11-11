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
import { approvalService } from '../lib/approvalService';
import statistikService from '../lib/statistik';
import { getRealtimeScheduleSlice } from '../lib/jadwalService';
import '../static/css/DASHBOARDpage.css';

// Supabase client - environment variables only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('🚨 DASHBOARDpage: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Build a conic-gradient pie background from values and colors
function pieBackground(values, colors, emptyColor = '#CBD5E1') {
  const total = values.reduce((s, v) => s + v, 0);
  if (total <= 0) return emptyColor;
  let acc = 0;
  const stops = values.map((v, i) => {
    const start = (acc / total) * 100;
    const end = ((acc + v) / total) * 100;
    acc += v;
    return `${colors[i]} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

const DASHBOARDpage = ({ onLogout }) => {
  const [currentTime, setCurrentTime] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [dashboardApprovals, setDashboardApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  
  // Pie chart states
  const [classes, setClasses] = useState([]);
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [pieChartData, setPieChartData] = useState([0, 0, 0]); // [hadir, izin, alpha]
  const [pieChartLoading, setPieChartLoading] = useState(false);

  // Realtime schedule state
  const [realtimePrev, setRealtimePrev] = useState(null);
  const [realtimeCurrent, setRealtimeCurrent] = useState(null);
  const [realtimeNext, setRealtimeNext] = useState(null);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [realtimeError, setRealtimeError] = useState('');

  // Update time every second - also initialize time on client side
  useEffect(() => {
    // Set initial time on client side
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard stats from database
  useEffect(() => {
    fetchDashboardStats();
    loadDashboardApprovals();
    loadClasses();
  }, []);

  // Load pie chart data when current class changes
  useEffect(() => {
    if (classes.length > 0) {
      loadPieChartData();
    }
  }, [currentClassIndex, classes]);

  // Load realtime schedule slice (prev/current/next) for selected class
  useEffect(() => {
    let timer;
    const targetClass = classes && classes.length > 0 ? classes[currentClassIndex] : 'XI SIJA 2';
    const loadRealtime = async () => {
      try {
        setRealtimeLoading(true);
        setRealtimeError('');
        const res = await getRealtimeScheduleSlice(targetClass.replace(/\s+/g, ' ').trim().replace(/\s/g, '_'));
        if (!res?.success) {
          setRealtimePrev(null);
          setRealtimeCurrent(null);
          setRealtimeNext(null);
          setRealtimeError(res?.error || 'Failed to load schedule');
        } else {
          setRealtimePrev(res.prev || null);
          setRealtimeCurrent(res.current || null);
          setRealtimeNext(res.next || null);
        }
      } catch (e) {
        setRealtimeError(e?.message || 'Failed to load schedule');
        setRealtimePrev(null);
        setRealtimeCurrent(null);
        setRealtimeNext(null);
      } finally {
        setRealtimeLoading(false);
      }
    };

    // initial load
    loadRealtime();
    // refresh every 60s to keep in sync with current time
    timer = setInterval(loadRealtime, 60000);
    return () => timer && clearInterval(timer);
  }, [currentClassIndex, classes]);

  // Load pending approvals for dashboard
  const loadDashboardApprovals = async () => {
    try {
      setApprovalsLoading(true);
      console.log('📋 Loading dashboard approvals...');
      
      // Get only pending approvals, limit to 5 for dashboard
      const { data, error } = await approvalService.getApprovals(1, 5, '');
      
      if (error) {
        console.error('❌ Error loading dashboard approvals:', error);
        setDashboardApprovals([]);
      } else {
        // Transform data to match dashboard format
        const transformedData = await Promise.all(data.map(async (pengajuan) => {
          // Get student data
          let studentData = pengajuan.siswa;
          if (!studentData && pengajuan.nis) {
            try {
              studentData = await approvalService.getStudentByNis(pengajuan.nis);
            } catch (err) {
              studentData = { nama: `NIS: ${pengajuan.nis}`, kelas: 'Unknown' };
            }
          }
          
          if (!studentData) {
            studentData = { nama: `NIS: ${pengajuan.nis}`, kelas: 'Unknown' };
          }
          
          // Determine the type of request
          let title = 'Izin';
          const alasanLower = pengajuan.alasan.toLowerCase();
          if (alasanLower.includes('sakit')) {
            title = 'Izin Sakit';
          } else if (alasanLower.includes('keluarga')) {
            title = 'Izin Keluarga';
          } else if (alasanLower.includes('dokter')) {
            title = 'Izin Dokter';
          } else if (alasanLower.includes('terlambat') || alasanLower.includes('macet')) {
            title = 'Keterlambatan';
          } else if (alasanLower.includes('urusan')) {
            title = 'Cuti';
          } else if (alasanLower.includes('password') || alasanLower.includes('reset')) {
            title = 'Reset Password';
          } else if (alasanLower.includes('presensi') || alasanLower.includes('kelas')) {
            title = 'Presensi';
          }

          return {
            id: pengajuan.id,
            category: 'Pengajuan',
            title: title,
            description: pengajuan.alasan,
            user: {
              name: studentData?.nama || `NIS: ${pengajuan.nis}`,
              class: studentData?.kelas || 'Unknown'
            },
            status: pengajuan.status,
            nis: pengajuan.nis
          };
        }));
        
        console.log('✅ Dashboard approvals loaded:', transformedData.length);
        setDashboardApprovals(transformedData.slice(0, 5)); // Limit to 5 cards for dashboard
      }
    } catch (err) {
      console.error('❌ Error loading dashboard approvals:', err);
      setDashboardApprovals([]);
    } finally {
      setApprovalsLoading(false);
    }
  };

  // Handle approval actions
  const handleDashboardApprove = async (id) => {
    try {
      console.log('📝 Approving dashboard request with ID:', id);
      const { error } = await approvalService.approveRequest(id);
      if (error) {
        alert('Failed to approve request: ' + error.message);
      } else {
        alert('Request approved successfully!');
        loadDashboardApprovals(); // Reload approvals
      }
    } catch (error) {
      console.error('Error in handleDashboardApprove:', error);
      alert('An error occurred while processing the request');
    }
  };

  const handleDashboardReject = async (id) => {
    try {
      console.log('❌ Rejecting dashboard request with ID:', id);
      const { error } = await approvalService.rejectRequest(id);
      if (error) {
        alert('Failed to reject request: ' + error.message);
      } else {
        alert('Request rejected successfully!');
        loadDashboardApprovals(); // Reload approvals
      }
    } catch (error) {
      console.error('Error in handleDashboardReject:', error);
      alert('An error occurred while processing the request');
    }
  };

  // Load available classes for pie chart
  const loadClasses = async () => {
    try {
      console.log('🎓 Loading classes for dashboard pie chart...');
      const classesResult = await statistikService.getClasses(10);
      
      if (classesResult?.classes && Array.isArray(classesResult.classes) && classesResult.classes.length > 0) {
        setClasses(classesResult.classes);
        console.log('✅ Classes loaded for dashboard:', classesResult.classes);
      } else {
        console.warn('⚠️ No classes found, using fallback');
        setClasses(['XI SIJA 1', 'XI SIJA 2', 'XI SIJA 3']);
      }
    } catch (error) {
      console.error('❌ Failed to load classes for dashboard:', error);
      setClasses(['XI SIJA 1', 'XI SIJA 2', 'XI SIJA 3']);
    }
  };

  // Load pie chart data for current class
  const loadPieChartData = async () => {
    if (classes.length === 0) return;
    
    try {
      setPieChartLoading(true);
      const currentClass = classes[currentClassIndex];
      
      console.log(`📊 Loading pie chart data for dashboard: ${currentClass}`);
      
      // Get today's date range
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const res = await statistikService.getAttendanceSummary({
        kelas: currentClass,
        start: today.toISOString(),
        end: tomorrow.toISOString()
      });
      
      console.log(`📈 Dashboard pie chart data for ${currentClass}:`, res);
      
      const hadir = res?.data?.Hadir || 0;
      const izin = res?.data?.Izin || 0;
      const alpha = res?.data?.Alpha || 0;
      
      setPieChartData([hadir, izin, alpha]);
      console.log(`📊 Dashboard pie chart values: [${hadir}, ${izin}, ${alpha}]`);
      
    } catch (error) {
      console.error('❌ Failed to load pie chart data:', error);
      setPieChartData([0, 0, 0]);
    } finally {
      setPieChartLoading(false);
    }
  };

  // Navigate to previous class
  const previousClass = () => {
    setCurrentClassIndex(prev => 
      prev === 0 ? classes.length - 1 : prev - 1
    );
  };

  // Navigate to next class
  const nextClass = () => {
    setCurrentClassIndex(prev => 
      prev === classes.length - 1 ? 0 : prev + 1
    );
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard stats from database...');
      
      // Get total students from siswa table
      let totalStudents = 0;
      try {
        const { data, error, count } = await supabase
          .from('siswa')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching students count:', error);
          totalStudents = 0;
        } else {
          totalStudents = count || 0;
          console.log('👥 Total students found:', totalStudents);
        }
      } catch (err) {
        console.warn('⚠️ Error accessing siswa table:', err);
        totalStudents = 0;
      }

      // Get today's date in Jakarta timezone (UTC+7)
      const now = new Date();
      const jakartaOffset = 7 * 60; // UTC+7 in minutes
      const jakartaTime = new Date(now.getTime() + (jakartaOffset * 60000));
      
      const today = new Date(jakartaTime);
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log('📅 Date range for today:', {
        from: today.toISOString(),
        to: tomorrow.toISOString(),
        jakartaDate: jakartaTime.toLocaleString('id-ID')
      });

      // Get today's attendance records from kehadiran table
      let attendanceData = [];
      try {
        const { data, error } = await supabase
          .from('kehadiran')
          .select('status, waktu_absen, nama, nis')
          .gte('waktu_absen', today.toISOString())
          .lt('waktu_absen', tomorrow.toISOString());
        
        if (error) {
          console.error('Error fetching attendance data:', error);
          attendanceData = [];
        } else {
          attendanceData = data || [];
          console.log(`📋 Found ${attendanceData.length} attendance records for today`);
          console.log('Status distribution:', attendanceData.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
          }, {}));
        }
      } catch (err) {
        console.warn('⚠️ Error accessing kehadiran table:', err);
        attendanceData = [];
      }

      // Count attendance based on status
      // Present: 'hadir', 'terlambat'
      const presentToday = attendanceData.filter(record => 
        record.status === 'hadir' || record.status === 'terlambat'
      ).length;
      
      // Absent: 'tidak_hadir', 'alpha', 'izin', 'sakit'
      const absentToday = attendanceData.filter(record => 
        record.status === 'tidak_hadir' || 
        record.status === 'alpha' || 
        record.status === 'izin' || 
        record.status === 'sakit'
      ).length;
      
      // Calculate attendance rate
      const attendanceRate = totalStudents > 0 ? 
        ((presentToday / totalStudents) * 100).toFixed(1) : '0.0';

      console.log('✅ Dashboard stats calculated:', {
        totalStudents,
        presentToday,
        absentToday,
        attendanceRate: attendanceRate + '%',
        totalRecordsToday: attendanceData.length
      });

      setStats({
        totalStudents,
        presentToday,
        absentToday,
        attendanceRate: parseFloat(attendanceRate)
      });

      setLoading(false);
    } catch (error) {
      console.error('❌ Critical error fetching dashboard stats:', error);
      
      // Set fallback values on error
      setStats({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0
      });
      
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

  <div className={`dashboard-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
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
                    <h3 className="stat-number">
                      {loading ? '...' : stats.totalStudents}
                    </h3>
                    <p className="stat-label">Total Students</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3 className="stat-number">
                      {loading ? '...' : stats.presentToday}
                    </h3>
                    <p className="stat-label">Present Today</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">❌</div>
                  <div className="stat-content">
                    <h3 className="stat-number">
                      {loading ? '...' : stats.absentToday}
                    </h3>
                    <p className="stat-label">Absent Today</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3 className="stat-number">
                      {loading ? '...' : `${stats.attendanceRate}%`}
                    </h3>
                    <p className="stat-label">Attendance Rate</p>
                  </div>
                </div>
              </div>

              {/* Realtime Schedule (Prev | Current | Next) */}
              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div className="header-line"></div>
                  <h3 style={{ margin: 0 }}>Today's Schedule</h3>
                  <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                    {classes && classes.length > 0 ? classes[currentClassIndex] : 'XI SIJA 2'}
                  </span>
                </div>
                {realtimeError && (
                  <div style={{ color: '#DC2626', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{realtimeError}</div>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '0.75rem'
                }}>
                  {/* Previous */}
                  <div className="stat-card" style={{ opacity: realtimePrev ? 1 : 0.5 }}>
                    <div className="stat-icon">⏮️</div>
                    <div className="stat-content" style={{ width: '100%' }}>
                      <h3 className="stat-number" style={{ fontSize: '1rem' }}>
                        {realtimeLoading ? '...' : (realtimePrev ? (realtimePrev.mapel || '-') : '—')}
                      </h3>
                      <p className="stat-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{realtimePrev?.guru || ''}</span>
                        <span>{realtimePrev?._label || ''}</span>
                      </p>
                    </div>
                  </div>

                  {/* Current */}
                  <div className="stat-card" style={{
                    border: '2px solid #4F46E5',
                    boxShadow: '0 8px 24px rgba(79,70,229,0.15)'
                  }}>
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-content" style={{ width: '100%' }}>
                      <h3 className="stat-number" style={{ fontSize: '1rem' }}>
                        {realtimeLoading ? 'Loading…' : (realtimeCurrent ? (realtimeCurrent.mapel || '-') : 'No ongoing lesson')}
                      </h3>
                      <p className="stat-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{realtimeCurrent?.guru || ''}</span>
                        <span>{realtimeCurrent?._label || ''}</span>
                      </p>
                    </div>
                  </div>

                  {/* Next */}
                  <div className="stat-card" style={{ opacity: realtimeNext ? 1 : 0.5 }}>
                    <div className="stat-icon">⏭️</div>
                    <div className="stat-content" style={{ width: '100%' }}>
                      <h3 className="stat-number" style={{ fontSize: '1rem' }}>
                        {realtimeLoading ? '...' : (realtimeNext ? (realtimeNext.mapel || '-') : '—')}
                      </h3>
                      <p className="stat-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{realtimeNext?.guru || ''}</span>
                        <span>{realtimeNext?._label || ''}</span>
                      </p>
                    </div>
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
                        {(() => {
                          const total = pieChartData.reduce((a, b) => a + b, 0) || 1;
                          const percentages = pieChartData.map(v => Math.round((v / total) * 100));
                          return (
                            <>
                              <div className="stat-item hadir">
                                <span className="stat-bullet">●</span>
                                <span className="stat-text">Hadir ({percentages[0]}%)</span>
                              </div>
                              <div className="stat-item izin">
                                <span className="stat-bullet">●</span>
                                <span className="stat-text">Izin ({percentages[1]}%)</span>
                              </div>
                              <div className="stat-item alpha">
                                <span className="stat-bullet">●</span>
                                <span className="stat-text">Alpha ({percentages[2]}%)</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      <div className="pie-chart-section">
                        <div className="pie-chart">
                          {pieChartLoading ? (
                            <div className="pie-loading" style={{
                              width: '100px',
                              height: '100px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#F3F4F6',
                              border: '2px dashed #D1D5DB'
                            }}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                border: '2px solid #E5E7EB',
                                borderTop: '2px solid #5B62B3',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }}></div>
                            </div>
                          ) : (
                            (() => {
                              const total = pieChartData.reduce((a, b) => a + b, 0);
                              const pieColors = ['#2E65D8', '#82A9F4', '#E6BFD4']; // hadir, izin, alpha
                              
                              if (total === 0) {
                                return (
                                  <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: '#F3F4F6',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed #D1D5DB',
                                    color: '#9CA3AF',
                                    fontSize: '0.75rem',
                                    textAlign: 'center'
                                  }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📊</div>
                                    <div>No data</div>
                                  </div>
                                );
                              }
                              
                              return (
                                <div
                                  className="pie"
                                  style={{ 
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: pieBackground(pieChartData, pieColors)
                                  }}
                                  role="img"
                                  aria-label="Attendance Pie Chart"
                                />
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="class-selector">
                      <img 
                        src="/panah-kiri.svg" 
                        alt="Previous" 
                        className="arrow-left"
                        onClick={previousClass}
                        style={{ cursor: 'pointer', opacity: classes.length > 1 ? 1 : 0.3 }}
                      />
                      <div className="select-container">
                        <div className="class-select">
                          {classes.length > 0 ? classes[currentClassIndex] : 'Loading...'}
                        </div>
                      </div>
                      <img 
                        src="/panah-kanan.svg" 
                        alt="Next" 
                        className="arrow-right"
                        onClick={nextClass}
                        style={{ cursor: 'pointer', opacity: classes.length > 1 ? 1 : 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Action Cards Container */}
                  <div className="action-cards-container">
                    <div className="action-cards">
                      {approvalsLoading ? (
                        // Loading skeleton
                        Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className="action-card">
                            <div className="card-header">
                              <span className="card-category">Loading...</span>
                              <h4 className="card-title">...</h4>
                              <p className="card-description">...</p>
                            </div>
                            <div className="card-content">
                              <div className="user-info">
                                <div className="user-icon">
                                  <img src="/account_circle.svg" alt="User" width="24" height="24" />
                                </div>
                                <div className="user-details">
                                  <span className="user-name">...</span>
                                  <span className="user-class">...</span>
                                </div>
                              </div>
                            </div>
                            <div className="action-buttons">
                              <button className="btn-accept" disabled>
                                <img src="/Check.svg" alt="Accept" />
                              </button>
                              <button className="btn-decline" disabled>
                                <img src="/X.svg" alt="Decline" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : dashboardApprovals.length > 0 ? (
                        // Real data
                        dashboardApprovals.map((approval) => (
                          <div key={approval.id} className="action-card pending-card">
                            <div className="card-header">
                              <span className="card-category">{approval.category}</span>
                              <h4 className="card-title">{approval.title}</h4>
                              <p className="card-description">{approval.description}</p>
                            </div>
                            <div className="card-content">
                              <div className="user-info">
                                <div className="user-icon">
                                  <img src="/account_circle.svg" alt="User" width="24" height="24" />
                                </div>
                                <div className="user-details">
                                  <span className="user-name">{approval.user.name}</span>
                                  <span className="user-class">{approval.user.class}</span>
                                </div>
                              </div>
                            </div>
                            <div className="action-buttons">
                              <button 
                                className="btn-accept"
                                onClick={() => handleDashboardApprove(approval.id)}
                                title="Approve Request"
                              >
                                <img src="/Check.svg" alt="Accept" />
                              </button>
                              <button 
                                className="btn-decline"
                                onClick={() => handleDashboardReject(approval.id)}
                                title="Reject Request"
                              >
                                <img src="/X.svg" alt="Decline" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        // No data message
                        <div className="no-approvals-message" style={{ 
                          gridColumn: '1 / -1', 
                          textAlign: 'center', 
                          padding: '2rem', 
                          color: '#666' 
                        }}>
                          <p>No pending approvals at the moment</p>
                        </div>
                      )}
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
