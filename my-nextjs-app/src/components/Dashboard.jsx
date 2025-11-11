'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SidebarDashboard from './sideDASHBOARD';
import DashboardBackground from './DashboardBACKGROUND';
import { useAuth } from '../hooks/useAuth';
import { fetchAttendanceData, getAttendanceStatistics } from './collectDATA';
import { submitPengajuan } from '../lib/pengajuanService';
import '../static/css/fonts.css';
import '../static/css/Dashboard.css';
import '../static/css/sideDASHBOARD.css';
import HistoryPage from './history';
import PengajuanPage from './pengajuan';
import KelasPage from './kelas';
import Header from './header';
import { CheckIcon } from '@heroicons/react/24/outline';
import { getJadwalSchedule, getMockSchedule } from '../lib/jadwalService2';

// Import JavaScript functionality
if (typeof window !== 'undefined') {
  import('../static/js/Dashboard.js');
  import('../static/js/sideDASHBOARD.js');
}

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const { user } = useAuth();
  
  // Viewport + Pagination state
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isMobile ? 2 : 6; // Mobile shows 2 rows per page, desktop 6

  // Real data state for dashboard table
  const [attendanceData, setAttendanceData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Leave request form state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDescription, setLeaveDescription] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- Schedule (dashboard card) state ---
  const [schedule, setSchedule] = useState({ 1: [], 2: [], 3: [], 4: [], 5: [] });
  const [scheduleError, setScheduleError] = useState('');
  const [nowMins, setNowMins] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  const [todayIdx, setTodayIdx] = useState(1); // 1..5

  // Helpers for time/slots
  const toMin = (h, m) => h * 60 + m;
  const fmt = (mins) => {
    if (!Number.isFinite(mins)) return '';
    const h = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${String(h).padStart(2, '0')}.${String(mm).padStart(2, '0')}`;
  };
  const generateDaySlots = (day) => {
    const LESSON = 45;
    const BREAKS = day === 5 ? [] : [{ start: toMin(10, 0), dur: 15 }, { start: toMin(11, 45), dur: 15 }];
    let t = toMin(7, 0);
    const out = [];
    while (out.length < 12) {
      const bNow = BREAKS.find(b => t >= b.start && t < b.start + b.dur);
      if (bNow) { t = bNow.start + bNow.dur; continue; }
      const overlap = BREAKS.find(b => t < b.start && t + LESSON > b.start);
      if (overlap) { t = overlap.start + overlap.dur; continue; }
      const end = t + LESSON;
      out.push({ start: t, end });
      t = end;
    }
    return out;
  };
  const parseRangeFromKet = (ket) => {
    if (!ket || typeof ket !== 'string') return { start: Infinity, end: Infinity };
    const s = ket.replace(/\s/g, '');
    const parts = s.split(/[\-–—]/);
    const re = /(\d{1,2})[:.](\d{2})/;
    const m1 = re.exec(parts[0] || '');
    const m2 = re.exec(parts[1] || '');
    const toM = (h, m) => (Number(h) * 60) + Number(m);
    const start = m1 ? toM(m1[1], m1[2]) : Infinity;
    const end = m2 ? toM(m2[1], m2[2]) : Infinity;
    return { start, end };
  };

  // Determine Jakarta day and keep ticking time
  useEffect(() => {
    const computeDay = () => {
      const nowUtc = new Date();
      const jakarta = new Date(nowUtc.getTime() + 7 * 60 * 60000);
      const d = jakarta.getUTCDay();
      setTodayIdx(d >= 1 && d <= 5 ? d : 1);
      setNowMins(jakarta.getUTCHours() * 60 + jakarta.getUTCMinutes());
    };
    computeDay();
    const id = setInterval(computeDay, 30000);
    return () => clearInterval(id);
  }, []);

  // Load schedule for current user class
  useEffect(() => {
    const load = async () => {
      try {
        const kelasName = currentUser?.kelas || 'XI SIJA 2';
        const res = await getJadwalSchedule(kelasName);
        if (res.success) {
          setSchedule(res.data);
          setScheduleError('');
        } else {
          setSchedule(getMockSchedule());
          setScheduleError(res.error || 'Gagal memuat jadwal, menggunakan mock');
        }
      } catch (e) {
        setSchedule(getMockSchedule());
        setScheduleError(e?.message || 'Gagal memuat jadwal, menggunakan mock');
      }
    };
    // load when user info is ready
    if (currentUser !== null) load();
  }, [currentUser]);

  // Get current user from localStorage (same as history.jsx)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('absensi_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        console.log('Dashboard - Current user loaded:', userData);
      } else {
        setError('No user logged in. Please login first.');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user information');
    }
  }, []);

  // Fetch real attendance data function
  const fetchDashboardData = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      // Only fetch data if we have a current user
      if (!currentUser || !currentUser.id) {
        setError('User not found. Please login again.');
        setLoading(false);
        return;
      }

      const options = {
        page,
        pageSize,
        sortBy: 'created_at',
        sortOrder: 'desc'
      };

      // For dashboard, show user's own data unless they're admin
      let userFilters = {};
      if (currentUser.role !== 'admin' && currentUser.nis !== 'admin') {
        userFilters.siswaId = currentUser.id; // Filter by current user's database ID for students
      }
      // If admin, show all data (no filter)

      console.log('Dashboard - Fetching data for user:', currentUser.nama, 'Role:', currentUser.role || 'student');
      const result = await fetchAttendanceData(options, userFilters);
      
      if (result.success) {
        setAttendanceData(result.data);
        setTotalCount(result.count);
      } else {
        // Handle case where we're using mock data
        if (result.error === 'Using mock data - database not configured') {
          setAttendanceData(result.data);
          setTotalCount(result.count);
          setError('Using demo data - Connect to database for real data');
        } else {
          throw new Error(result.error);
        }
      }
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
      setError(err.message || 'Failed to fetch attendance data');
      // Fallback to empty data
      setAttendanceData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when user is loaded
  useEffect(() => {
    if (currentUser) {
      fetchDashboardData(1);
      setCurrentPage(1);
    }
  }, [currentUser, pageSize]);

  // When page changes
  useEffect(() => {
    if (currentPage !== 1 && currentUser) {
      fetchDashboardData(currentPage);
    }
  }, [currentPage]);

  // Detect mobile viewport
  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  // Derived pagination values - now using real data
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedRows = useMemo(() => {
    return attendanceData; // Data is already paginated from API
  }, [attendanceData]);

  // Clamp current page if page size change reduces total pages
  useEffect(() => {
    setCurrentPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Buat daftar nomor halaman dengan elipsis
  const getPageNumbers = (current, total) => {
    const range = [];
    const rangeWithDots = [];
    const delta = 1; // jumlah halaman di sekitar current
    let last;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta) ||
        i <= 2 ||
        i >= total - 1
      ) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (last) {
        if (i - last === 2) {
          rangeWithDots.push(last + 1);
        } else if (i - last > 2) {
          rangeWithDots.push('…');
        }
      }
      rangeWithDots.push(i);
      last = i;
    }
    return rangeWithDots;
  };

  const handleMenuSelect = (menuId) => {
    setActiveMenu(menuId);
  };

  // Leave request handlers
  const handleLeaveSubmit = () => {
    if (!leaveReason.trim()) {
      setLeaveError('Alasan izin harus diisi');
      return;
    }
    
    if (!currentUser?.nis) {
      setLeaveError('User tidak terautentikasi. Silakan login ulang.');
      return;
    }
    
    // Clear any previous errors and success messages
    setLeaveError('');
    setLeaveSuccess('');
    
    // Show date picker popup
    setShowDatePicker(true);
  };

  const handleDateSelection = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Don't allow past dates
    if (date < today) {
      return;
    }

    if (!selectedStartDate) {
      // First click - set start date
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (!selectedEndDate) {
      // Second click - set end date
      if (date >= selectedStartDate) {
        setSelectedEndDate(date);
      } else {
        // If clicked date is before start date, reset and use as new start date
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      }
    } else {
      // Both dates selected, reset and start over
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    }
    
    // Clear any date-related errors when user selects dates
    if (leaveError.includes('tanggal')) {
      setLeaveError('');
    }
  };

  const handleDatePickerConfirm = async () => {
    if (!selectedStartDate || !selectedEndDate) {
      setLeaveError('Silakan pilih tanggal mulai dan selesai');
      return;
    }

    if (!currentUser?.nis) {
      setLeaveError('User tidak terautentikasi');
      return;
    }

    setLeaveLoading(true);
    setLeaveError('');

    try {
      // Prepare pengajuan data
      const pengajuanData = {
        nis: currentUser.nis,
        tanggal_mulai: selectedStartDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        tanggal_selesai: selectedEndDate.toISOString().split('T')[0],
        alasan: leaveReason.trim(),
        keterangan: leaveDescription.trim() || null,
        file_pendukung: null // File upload not available in dashboard quick form
      };

      console.log('Submitting pengajuan data:', pengajuanData);

      // Submit to database using the same service as pengajuan page
      const result = await submitPengajuan(pengajuanData);
      
      if (result.success) {
        setLeaveSuccess('Pengajuan izin berhasil dikirim!');
        
        // Reset form and close popup
        setLeaveReason('');
        setLeaveDescription('');
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        setShowDatePicker(false); // Close popup immediately
        setLeaveLoading(false); // Reset loading state
        
        // Auto hide success message after 5 seconds
        setTimeout(() => {
          setLeaveSuccess('');
        }, 5000);
        
      } else {
        setLeaveError(result.error || 'Gagal mengirim pengajuan');
        setLeaveLoading(false);
      }
      
    } catch (error) {
      console.error('Error submitting pengajuan:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Handle different types of errors
      if (error.message.includes('RLS Policy') ||
          error.message.includes('Row Level Security') ||
          error.message.includes('permission denied') ||
          error.message.includes('violates row-level security policy')) {
        
        console.log('RLS/Permission error detected');
        setLeaveError(`❌ Database Permission Error: ${error.message}. Periksa file FIX_RLS_SUPABASE.md untuk solusi.`);
        setLeaveLoading(false);
        
      } else if (error.message.includes('environment variables') ||
          error.message.includes('Supabase tidak dikonfigurasi') ||
          error.message.includes('table') && error.message.includes('does not exist') ||
          error.message === 'Supabase error: {}' ||
          error.message.includes('tidak dapat diakses') ||
          error.message.includes('Database connection error')) {
        
        console.log('Database configuration/connection issue detected, enabling demo mode');
        setIsDemoMode(true);
        
        // Simulate successful submission for demo
        setTimeout(() => {
          setLeaveSuccess('✅ Pengajuan izin berhasil disimulasikan (Demo Mode)!');
          setLeaveReason('');
          setLeaveDescription('');
          setSelectedStartDate(null);
          setSelectedEndDate(null);
          setShowDatePicker(false);
          setLeaveLoading(false);
          
          setTimeout(() => {
            setLeaveSuccess('');
            setIsDemoMode(false);
          }, 5000);
        }, 1000);
        
      } else {
        setLeaveError(`Gagal mengirim pengajuan: ${error.message}`);
        setLeaveLoading(false);
      }
    }
  };

  const handleDatePickerCancel = () => {
    setShowDatePicker(false);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setLeaveError('');
    setLeaveLoading(false); // Reset loading state when canceled
  };

  // Handle escape key and outside click to close popup
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showDatePicker) {
        handleDatePickerCancel();
      }
    };

    const handleClickOutside = (event) => {
      if (showDatePicker && event.target.closest('.date-picker-modal') === null) {
        handleDatePickerCancel();
      }
    };

    if (showDatePicker) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isSameDate = (date1, date2) => {
    return date1?.toDateString() === date2?.toDateString();
  };

  const renderDashboardContent = () => (
    <>
  
      {/* Top table card like the mock */}
      {!loading && (
        <div className="dash-card">
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Presence</th>
                  <th>NIS</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Information</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td>{row.date}</td>
                      <td>{row.time}</td>
                      <td className="presence">{row.presence}</td>
                      <td>{row.nis}</td>
                      <td>{row.name}</td>
                      <td>{row.className}</td>
                      <td>
                        <span className={`badge ${row.status.toLowerCase() === 'accepted' ? 'accepted' : 'pending'}`}>
                          <span className="icon" aria-hidden>
                            <CheckIcon width={10} height={10} strokeWidth={3} />
                          </span>
                          {row.status}
                        </span>
                      </td>
                      <td>{row.info}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ 
                      textAlign: 'center', 
                      padding: '2rem',
                      color: '#64748B'
                    }}>
                      No attendance data found
                      {currentUser && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                          {currentUser.role === 'admin' ? 'No attendance records in system' : `No records found for ${currentUser.nama}`}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!isMobile && totalPages > 1 && (
            <div className="table-footer">
              <div className="pagination" role="navigation" aria-label="Pagination">
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  {'<'}
                </button>

                {getPageNumbers(currentPage, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`dots-${i}`} className="page-btn" aria-hidden>
                      …
                    </span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      className={`page-btn ${currentPage === p ? 'active' : ''}`}
                      onClick={() => handlePageChange(p)}
                      aria-current={currentPage === p ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  {'>'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom two-column grid */}
      <div className="bottom-grid">
        {/* Schedule card */}
        <div className="schedule-card">
          <div className="schedule-header">{['SENIN','SELASA','RABU','KAMIS','JUMAT'][todayIdx - 1]}</div>
          {scheduleError && (
            <div style={{ color: '#b91c1c', fontSize: '0.8rem', margin: '0.25rem 0' }}>{scheduleError}</div>
          )}
          {(() => {
            const items = schedule[todayIdx] || [];
            const slots = generateDaySlots(todayIdx);
            // Build list with computed start/end
            const enriched = items.map((it, i) => {
              const ket = it?.meta?.keterangan || '';
              const p = parseRangeFromKet(ket);
              let start = p.start, end = p.end;
              if (!Number.isFinite(start) || !Number.isFinite(end)) {
                const slot = slots[i];
                start = slot?.start; end = slot?.end;
              }
              return { ...it, _start: start, _end: end };
            }).filter(e => Number.isFinite(e._start) && Number.isFinite(e._end));
            enriched.sort((a,b)=> a._start - b._start);
            // Find current index
            let currentIdx = enriched.findIndex(e => nowMins >= e._start && nowMins < e._end);
            if (currentIdx === -1) {
              // If before first -> use first as current; if after last -> use last
              if (enriched.length) {
                if (nowMins < enriched[0]._start) currentIdx = 0; else currentIdx = enriched.length - 1;
              }
            }
            const current = currentIdx >= 0 ? enriched[currentIdx] : null;
            const prev = currentIdx > 0 ? enriched[currentIdx - 1] : null;
            const next = currentIdx >= 0 && currentIdx < enriched.length - 1 ? enriched[currentIdx + 1] : null;
            const boxStyleBase = {
              display: 'grid',
              // Fix left and right columns so subject stays perfectly centered
              gridTemplateColumns: '140px 1fr 220px',
              alignItems: 'center',
              columnGap: '0.75rem',
              padding: '0.9rem 1rem',
              borderRadius: '16px',
              background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
              position: 'relative'
            };
            const timeSpanStyle = { color: '#111827', fontSize: '0.8rem', flexShrink: 0 };
            const renderRow = (label, item, highlight=false) => {
              if (!item) return (
                <div style={{ ...boxStyleBase, opacity: 0.4 }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{label}</span>
                  <span style={{ textAlign: 'center', fontWeight: 500, color: '#111827' }}>—</span>
                  <span style={{ justifySelf: 'end', color: '#111827', fontSize: '0.75rem' }}>—</span>
                </div>
              );
              const st = highlight ? {
                ...boxStyleBase,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(29,78,216,0.12))',
                border: '1px solid #3B82F6',
                boxShadow: '0 8px 20px -4px rgba(59,130,246,0.25)',
              } : boxStyleBase;
              return (
                <div style={st}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#111827', textAlign: 'center' }}>{item.subject || '-'}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                    <span style={timeSpanStyle}>{`${fmt(item._start)} - ${fmt(item._end)}`}</span>
                    <span style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 500 }}>{item.teacher}</span>
                  </div>
                </div>
              );
            };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {renderRow('Sebelumnya', prev, false)}
                {renderRow('Sekarang', current, true)}
                {renderRow('Selanjutnya', next, false)}
              </div>
            );
          })()}
        </div>

        {/* Leave request form */}
        <div className="leave-card">
          {/* Demo Mode Indicator */}
          {isDemoMode && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>ℹ️</span>
              <span style={{ fontSize: '0.875rem' }}>Demo Mode: Database tidak tersedia, menggunakan simulasi</span>
            </div>
          )}

          {/* Success/Error Messages */}
          {leaveSuccess && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#166534'
            }}>
              {leaveSuccess}
            </div>
          )}
          
          {leaveError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#DC2626'
            }}>
              {leaveError}
            </div>
          )}

          <div className="form-grid">
            <div className="form-row">
              <input 
                className="leave-input" 
                placeholder="Alasan izin" 
                value={leaveReason}
                onChange={(e) => {
                  setLeaveReason(e.target.value);
                  // Clear error when user starts typing
                  if (leaveError.includes('Alasan')) {
                    setLeaveError('');
                  }
                }}
              />
            </div>
            <div className="form-row">
              <input 
                className="leave-input" 
                placeholder="Keterangan Alasan (opsional)" 
                value={leaveDescription}
                onChange={(e) => setLeaveDescription(e.target.value)}
              />
            </div>
            <div className="form-row">
              <input 
                className="leave-input" 
                placeholder="Bukti Tambahan" 
                readOnly
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                title="File upload akan tersedia di halaman Pengajuan"
              />
            </div>
            <div className="form-row">
              <button 
                className="submit-btn"
                onClick={handleLeaveSubmit}
                disabled={leaveLoading || !leaveReason.trim() || !currentUser?.nis}
                style={{
                  opacity: leaveLoading || !leaveReason.trim() || !currentUser?.nis ? 0.6 : 1,
                  cursor: leaveLoading || !leaveReason.trim() || !currentUser?.nis ? 'not-allowed' : 'pointer'
                }}
              >
                {leaveLoading ? 'Mengirim...' : 'Ajukan izin'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker Popup */}
      {showDatePicker && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div 
            className="date-picker-modal"
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}
          >
            {/* Loading Overlay */}
            {leaveLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    border: '3px solid #f3f4f6',
                    borderTop: '3px solid #3B82F6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                  }}></div>
                  <p style={{ color: '#374151', margin: 0, fontSize: '0.875rem' }}>
                    Mengirim pengajuan...
                  </p>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: '#1F2937'
              }}>
                Pilih Tanggal Izin
              </h3>
              <p style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '0.875rem', 
                color: '#6B7280'
              }}>
                Klik sekali untuk tanggal mulai (biru), klik lagi untuk tanggal selesai (hijau)
              </p>
              
              {/* Selected dates display */}
              <div style={{ marginBottom: '1rem' }}>
                {selectedStartDate && (
                  <div style={{
                    display: 'inline-block',
                    background: '#DBEAFE',
                    color: '#1D4ED8',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    margin: '0.25rem 0.5rem 0.25rem 0'
                  }}>
                    Mulai: {formatDateDisplay(selectedStartDate)}
                  </div>
                )}
                {selectedEndDate && (
                  <div style={{
                    display: 'inline-block',
                    background: '#DCFCE7',
                    color: '#166534',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    margin: '0.25rem 0.5rem 0.25rem 0'
                  }}>
                    Selesai: {formatDateDisplay(selectedEndDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar */}
            <div>
              {/* Month header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1F2937'
              }}>
                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.25rem',
                marginBottom: '1rem'
              }}>
                {/* Day headers */}
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} style={{
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6B7280'
                  }}>
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {generateCalendarDays().map((date, index) => {
                  const today = new Date();
                  const isToday = isSameDate(date, today);
                  const isCurrentMonth = date.getMonth() === today.getMonth();
                  const isStartDate = isSameDate(date, selectedStartDate);
                  const isEndDate = isSameDate(date, selectedEndDate);
                  const isPastDate = date < today.setHours(0, 0, 0, 0);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => !isPastDate && handleDateSelection(date)}
                      disabled={isPastDate}
                      style={{
                        padding: '0.5rem',
                        border: isStartDate ? '2px solid #3B82F6' : 
                               isEndDate ? '2px solid #10B981' : '1px solid #E5E7EB',
                        borderRadius: '50%',
                        background: isStartDate ? '#DBEAFE' :
                                   isEndDate ? '#DCFCE7' :
                                   isToday ? '#F3F4F6' : 'white',
                        color: isPastDate ? '#9CA3AF' :
                               isStartDate ? '#1D4ED8' :
                               isEndDate ? '#059669' :
                               !isCurrentMonth ? '#9CA3AF' : '#1F2937',
                        cursor: isPastDate ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: isToday ? '600' : '400',
                        width: '2.5rem',
                        height: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isPastDate ? 0.4 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleDatePickerCancel}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDatePickerConfirm}
                disabled={!selectedStartDate || !selectedEndDate || leaveLoading}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: selectedStartDate && selectedEndDate && !leaveLoading ? '#3B82F6' : '#9CA3AF',
                  color: 'white',
                  cursor: selectedStartDate && selectedEndDate && !leaveLoading ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem'
                }}
              >
                {leaveLoading ? 'Mengirim...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderPageContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return renderDashboardContent();
      case 'history':
        return <HistoryPage />;
      case 'kelas':
        return <KelasPage />;
      case 'pengajuan':
        return <PengajuanPage />;
      default:
        return renderDashboardContent();
    }
  };

  return (
    <DashboardBackground>
      <div className="dashboard-layout">
        {/* Sidebar */}
        <SidebarDashboard 
          onMenuSelect={handleMenuSelect}
          activeMenu={activeMenu}
        />

        {/* Main Content */}
        <main className="main-content">
          <div className="dashboard-container">
            {/* Page Header */}
            <Header pageTitle={
              activeMenu === 'dashboard' ? 'Dashboard' :
              activeMenu === 'history' ? 'History' :
              activeMenu === 'kelas' ? 'Kelas' :
              activeMenu === 'pengajuan' ? 'Pengajuan' : 'Dashboard'
            } />

            {/* Page Content */}
            <div id="main-content-area" className="main-content-area">
              {renderPageContent()}
            </div>
          </div>
        </main>
      </div>
    </DashboardBackground>
  );
};

export default Dashboard;