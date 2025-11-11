"use client";

import React, { useState, useEffect, useRef } from 'react';
import '../static/css/ClassDetail.css';
import HEADERINpage from './HEADERINpage';
import statistikService from '../lib/statistik';
import { createClient } from '@supabase/supabase-js';

const ClassDetail = ({ classData, onBack }) => {
  // Get current day name for default selection
  const getCurrentDayEnglish = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    const currentDay = dayNames[today];
    
    // If it's weekend, default to Monday, otherwise use current day
    if (currentDay === 'Sunday' || currentDay === 'Saturday') {
      return 'Monday';
    }
    return currentDay;
  };

  // Get Indonesian day name for UI display
  const getCurrentDayIndonesian = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const today = new Date().getDay();
    return days[today];
  };

  const [selectedDay, setSelectedDay] = useState(getCurrentDayEnglish());
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const scheduleGridRef = useRef(null);

  const dayDropdownRef = useRef(null);
  const monthDropdownRef = useRef(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeRanges = ['Today', 'This Week', 'This Month', 'This Year'];

  // Build a conic-gradient pie background from values and colors (same as REPORT)
  function pieBackground(values, colors) {
    const total = values.reduce((s, v) => s + v, 0) || 1;
    let acc = 0;
    const stops = values.map((v, i) => {
      const start = (acc / total) * 100;
      const end = ((acc + v) / total) * 100;
      acc += v;
      return `${colors[i]} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  // Live statistik data for this class
  const [attValues, setAttValues] = useState([0, 0, 0]); // [Hadir, Izin, Alpha]
  const [absValues, setAbsValues] = useState([0, 0, 0]); // [Sakit, Izin, Alpha]
  const [statsLoading, setStatsLoading] = useState(false);

  // Schedule data from database
  const [scheduleData, setScheduleData] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  const pieColorsAttendance = ['#2E65D8', '#82A9F4', '#E6BFD4'];
  const pieColorsAbsent = ['#5B62B3', '#82A9F4', '#E6BFD4'];

  // Setup Supabase client - environment variables only
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('🚨 ClassDetail: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Convert day names between English and Indonesian
  const dayMapping = {
    'Monday': 'Senin',
    'Tuesday': 'Selasa', 
    'Wednesday': 'Rabu',
    'Thursday': 'Kamis',
    'Friday': 'Jumat'
  };

  // Fetch schedule for specific day and class
  const fetchScheduleForDay = async (dayName) => {
    try {
      // Convert class name format: "XI SIJA 1" -> "XI_SIJA_1"
      const kelasFormatted = classData.name.replace(/\s+/g, '_');
      
      // Convert day name to Indonesian
      const hariIndonesian = dayMapping[dayName] || dayName;
      
      console.log(`🔍 [ClassDetail] Fetching schedule for:`, {
        originalClass: classData.name,
        formattedClass: kelasFormatted,
        selectedDay: dayName,
        indonesianDay: hariIndonesian
      });
      
      const { data, error } = await supabase
        .from('jadwal_sija')
        .select('*')
        .eq('kelas', kelasFormatted)
        .eq('hari', hariIndonesian)
        .order('id', { ascending: true });
        
      if (error) {
        console.error('❌ [ClassDetail] Database error:', {
          error: error,
          message: error?.message,
          code: error?.code,
          details: error?.details
        });
        throw error;
      }
      
      console.log(`✅ [ClassDetail] Found ${(data || []).length} schedule entries for ${kelasFormatted} on ${hariIndonesian}`);
      
      return { success: true, data: data || [], hari: hariIndonesian };
    } catch (err) {
      console.error('❌ [ClassDetail] fetchScheduleForDay error:', {
        error: err,
        message: err?.message,
        stack: err?.stack
      });
      return { success: false, data: [], error: err.message || 'Unknown error occurred' };
    }
  };

  function computeRange(label) {
    const now = new Date();
    if (label === 'Today') {
      const start = new Date(now); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate()+1);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    if (label === 'This Week') {
      const start = new Date(now);
      const day = start.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate()-diffToMonday);
      start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate()+7);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    if (label === 'This Year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear()+1, 0, 1);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    // default: This Month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(start); end.setMonth(end.getMonth()+1);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // Load schedule data from database
  useEffect(() => {
    let mounted = true;
    
    async function loadSchedule() {
      setScheduleLoading(true);
      setScheduleError(null);
      
      try {
        console.log(`📚 Loading schedule for class: ${classData.name} on ${selectedDay}`);
        
        const result = await fetchScheduleForDay(selectedDay);
        
        if (!mounted) return;
        
        if (result.success) {
          console.log(`✅ Schedule loaded for ${selectedDay} (${result.hari}):`, result.data);
          
          // Transform database data to component format
          const transformedSchedule = result.data.map((item, index) => ({
            id: item.id,
            subject: item.mapel,
            teacher: item.guru || 'TBA', 
            startPeriod: index + 1, // Simple period numbering
            duration: Math.max(1, Math.round(item.banyak_jam || 1)), // Ensure at least 1 period
            keterangan: item.keterangan,
            originalData: item
          }));
          
          setScheduleData(transformedSchedule);
          
          // Show info about loaded day
          if (transformedSchedule.length === 0) {
            setScheduleError(`No schedule found for ${selectedDay} (${result.hari})`);
          }
        } else {
          console.error('❌ Failed to load schedule:', result.error);
          setScheduleError(result.error);
          // Fallback to hardcoded schedule on error
          setScheduleData(generateSchedule(classData.name));
        }
      } catch (error) {
        console.error('❌ Error loading schedule:', error);
        setScheduleError(error.message);
        if (mounted) {
          // Fallback to hardcoded schedule on error
          setScheduleData(generateSchedule(classData.name));
        }
      } finally {
        if (mounted) {
          setScheduleLoading(false);
        }
      }
    }
    
    loadSchedule();
    return () => { mounted = false; };
  }, [classData.name, selectedDay]);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      setStatsLoading(true);
      const { start, end } = computeRange(selectedMonth);
      const res = await statistikService.getAttendanceSummary({ kelas: classData.name, start, end });
      if (!mounted) return;
      if (!res.error) {
        const hadir = res.data?.Hadir || 0;
        const izin = res.data?.Izin || 0;
        const alpha = res.data?.Alpha || 0;
        const sakit = res.data?.Sakit || 0;
        setAttValues([hadir, izin, alpha]);
        setAbsValues([sakit, izin, alpha]);
      }
      setStatsLoading(false);
    }
    loadStats();
    return () => { mounted = false; };
  }, [selectedMonth, classData?.name]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target)) {
        setShowDayDropdown(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Generate random schedule based on class
  const generateSchedule = (className) => {
    const schedules = {
      'XI SIJA 1': [
        { subject: 'KK SIJA', teacher: 'INUNG', startPeriod: 1, duration: 4 },
        { subject: 'KK SIJA', teacher: 'NISA', startPeriod: 5, duration: 4 },
        { subject: 'B. Jerman', teacher: 'VANDA', startPeriod: 9, duration: 2 },
        { subject: 'B. Inggris', teacher: 'LUTH', startPeriod: 11, duration: 2 },
        { subject: 'Matematika', teacher: 'WINDI', startPeriod: 13, duration: 3 },
        { subject: 'B. Indonesia', teacher: 'ABUL', startPeriod: 16, duration: 2 },
        { subject: 'PJOK', teacher: 'BAMBANG', startPeriod: 18, duration: 2 },
        { subject: 'Sejarah', teacher: 'TIARA', startPeriod: 20, duration: 1 }
      ],
      'XI SIJA 2': [
        { subject: 'KK SIJA', teacher: 'INUNG', startPeriod: 1, duration: 4 },
        { subject: 'KK SIJA', teacher: 'NISA', startPeriod: 5, duration: 4 },
        { subject: 'B. Jerman', teacher: 'VANDA', startPeriod: 9, duration: 2 },
        { subject: 'B. Inggris', teacher: 'LUTH', startPeriod: 11, duration: 2 },
        { subject: 'B. Jawa', teacher: 'PUJO', startPeriod: 13, duration: 2 },
        { subject: 'Sejarah', teacher: 'TIARA', startPeriod: 15, duration: 2 },
        { subject: 'PJOK', teacher: 'BAMBANG', startPeriod: 17, duration: 2 },
        { subject: 'Matematika', teacher: 'WINDI', startPeriod: 19, duration: 3 }
      ],
      'XI SIJA 3': [
        { subject: 'B. Jerman', teacher: 'VANDA', startPeriod: 1, duration: 2 },
        { subject: 'KK SIJA', teacher: 'PUR', startPeriod: 3, duration: 4 },
        { subject: 'KK SIJA', teacher: 'IBNA', startPeriod: 7, duration: 4 },
        { subject: 'KK SIJA', teacher: 'PUR', startPeriod: 11, duration: 2 },
        { subject: 'BK', teacher: 'YOLA', startPeriod: 13, duration: 1 },
        { subject: 'KIK SIJA', teacher: 'AGUS', startPeriod: 14, duration: 2 },
        { subject: 'B. Inggris', teacher: 'LUTH', startPeriod: 16, duration: 2 },
        { subject: 'Matematika', teacher: 'WINDI', startPeriod: 18, duration: 3 },
        { subject: 'AGAMA', teacher: 'MOZA', startPeriod: 21, duration: 3 },
        { subject: 'B. Indonesia', teacher: 'ABUL', startPeriod: 24, duration: 3 },
        { subject: 'PPKN', teacher: 'SABAR', startPeriod: 27, duration: 2 },
        { subject: 'KIK NA', teacher: 'YULIA', startPeriod: 29, duration: 2 }
      ]
    };

    return schedules[className] || schedules['XI SIJA 1'];
  };

  // Use database schedule if available, fallback to hardcoded
  const schedule = scheduleData.length > 0 ? scheduleData : generateSchedule(classData.name);

  // Use the same accent color for all subjects (match KK SIJA color)
  const getSubjectColor = () => '#5B62B3';

  // PeriodBoxes: render a contiguous block made of `duration` white cells (merged visually).
  // Each cell shows its period number centered and supports press/touch animation.
  const PeriodBoxes = ({ startPeriod = 1, duration = 1 }) => {
    const [pressed, setPressed] = useState(() => Array(duration).fill(false));

    useEffect(() => {
      setPressed(Array(duration).fill(false));
    }, [startPeriod, duration]);

    const handlePress = (idx) => {
      setPressed((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
    };

    const handleRelease = (idx) => {
      setPressed((prev) => {
        const next = [...prev];
        next[idx] = false;
        return next;
      });
    };

    return (
      <div className="period-block" role="group" aria-label={`Periods ${startPeriod} - ${startPeriod + duration - 1}`}>
        {Array.from({ length: duration }).map((_, i) => (
          <div
            key={i}
            className={`period-cell ${pressed[i] ? 'pressed' : ''} ${i === 0 ? 'first' : ''} ${i === duration - 1 ? 'last' : ''}`}
            onMouseDown={() => handlePress(i)}
            onMouseUp={() => handleRelease(i)}
            onMouseLeave={() => handleRelease(i)}
            onTouchStart={() => handlePress(i)}
            onTouchEnd={() => handleRelease(i)}
          >
            <span className="period-number">{startPeriod + i}</span>
          </div>
        ))}
      </div>
    );
  };

  // Scroll navigation
  const scrollSchedule = (direction) => {
    const container = scheduleGridRef.current;
    if (container) {
      const scrollAmount = container.clientWidth / 3 + 16; // roughly one card + gap
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Mark the leftmost and rightmost visible cards so their outer corners stay rounded
  const updateVisibleEdges = () => {
    const container = scheduleGridRef.current;
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.schedule-card'));
    if (!cards.length) return;

    // reset classes
    cards.forEach(c => {
      c.classList.remove('is-left-edge');
      c.classList.remove('is-right-edge');
    });

    const crect = container.getBoundingClientRect();
    const threshold = 12; // pixels considered "visible"

    // find first and last visible
    let firstVisible = null;
    let lastVisible = null;
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      const visibleWidth = Math.min(r.right, crect.right) - Math.max(r.left, crect.left);
      if (visibleWidth > threshold) {
        if (!firstVisible) firstVisible = card;
        lastVisible = card;
      }
    }
    if (firstVisible) firstVisible.classList.add('is-left-edge');
    if (lastVisible) lastVisible.classList.add('is-right-edge');
  };

  // keep edge rounding in sync on mount, scroll and resize
  useEffect(() => {
    const container = scheduleGridRef.current;
    if (!container) return;
    const handler = () => updateVisibleEdges();
    handler();
    container.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);
    return () => {
      container.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, [schedule]);

  const attendanceReasons = [
    { label: 'Hadir', color: '#5B8FD9', percentage: 0 },
    { label: 'Izin', color: '#83A8E8', percentage: 0 },
    { label: 'Alpha', color: '#D8A8C8', percentage: 0 },
  ];

  const absentReasons = [
    { label: 'Sakit', color: '#5B62B3', percentage: 0 },
    { label: 'Izin', color: '#83A8E8', percentage: 0 },
    { label: 'Alpha', color: '#D8A8C8', percentage: 0 },
  ];

  const attTotal = attValues.reduce((s,v)=>s+v,0);
  const attPercent = attTotal ? Math.round((attValues[0] / attTotal) * 100) : 0; // hadir rate
  const absTotal = absValues.reduce((s,v)=>s+v,0);
  const absPercent = absTotal ? Math.round((absValues[0] / absTotal) * 100) : 0; // sakit rate

  return (
    <div className="class-detail-page">
      <HEADERINpage title="Classes" />

      <div className="class-detail-container">
        {/* Left Side - Class Card */}
        <div className="class-card-detail">
          <div className="class-card-avatar">
            <span className="avatar-large">👨‍🎓</span>
          </div>
          <h3 className="class-card-title">{classData.name}</h3>
          
          <div className="class-info-box">
            <h4 className="info-title">Wali Kelas</h4>
            <p className="info-subtitle">Purwanto, M.Kom.</p>
            <p className={`info-description ${descExpanded ? 'expanded' : ''}`}>
              Kelas {classData.name} adalah salah satu kelas di jurusan Sistem Informatika Jaringan dan Aplikasi yang terdiri dari 36 siswa. Kelas ini dikenal kompak, aktif, dan kreatif dalam berbagai kegiatan, baik akademik maupun nonakademik. Para siswanya memiliki semangat tinggi dalam mempelajari bidang teknologi, terutama dalam jaringan komputer, pemrograman, dan sistem aplikasi. Dengan kerja sama yang baik antara guru dan siswa, {classData.name} menjadi kelas yang produktif, berprestasi, dan memiliki rasa kekeluargaan yang kuat.
            </p>
            <button
              type="button"
              className="view-more-btn"
              onClick={() => setDescExpanded((v) => !v)}
            >
              {descExpanded ? 'View less' : 'View more'}
            </button>
          </div>
        </div>

        {/* Right Side - Schedule and Statistics */}
        <div className="class-detail-content">
          {/* Schedule Section */}
          <div className="schedule-section">
            <div className="section-header">
              <h2 className="section-title">
                Jadwal Pelajaran
                {!scheduleLoading && !scheduleError && scheduleData.length > 0 && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#10B981', 
                    marginLeft: '0.5rem',
                    fontWeight: 'normal'
                  }}>
                    • Live from database
                  </span>
                )}
                {!scheduleLoading && scheduleError && schedule.length > 0 && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#F59E0B', 
                    marginLeft: '0.5rem',
                    fontWeight: 'normal'
                  }}>
                    • Fallback schedule
                  </span>
                )}
              </h2>
              <div className="day-selector" ref={dayDropdownRef}>
                <button 
                  className="day-btn active"
                  onClick={() => setShowDayDropdown(!showDayDropdown)}
                  disabled={scheduleLoading}
                >
                  <span className="day-icon">📅</span> {selectedDay}
                  {scheduleLoading && (
                    <div className="day-spinner" style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid #E5E7EB',
                      borderTop: '2px solid #5B62B3',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginLeft: '0.5rem'
                    }}></div>
                  )}
                </button>
                <button 
                  className="dropdown-btn"
                  onClick={() => setShowDayDropdown(!showDayDropdown)}
                  disabled={scheduleLoading}
                >
                  ▼
                </button>
                {showDayDropdown && (
                  <div className="dropdown-menu">
                    {days.map((day) => (
                      <button
                        key={day}
                        className={`dropdown-item ${selectedDay === day ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDay(day);
                          setShowDayDropdown(false);
                        }}
                      >
                        <span style={{ marginRight: '0.5rem' }}>
                          {selectedDay === day ? '📅' : '📋'}
                        </span>
                        {day}
                        {day === getCurrentDayIndonesian() && (
                          <span style={{ 
                            fontSize: '0.7rem', 
                            color: '#10B981', 
                            marginLeft: '0.5rem' 
                          }}>
                            Today
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="schedule-wrapper">
              <button className="schedule-nav-btn left" onClick={() => scrollSchedule('left')}>
                ‹
              </button>
              
              {scheduleLoading ? (
                <div className="schedule-loading" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  gap: '1rem'
                }}>
                  <div className="spinner" style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #E5E7EB',
                    borderTop: '3px solid #5B62B3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <p style={{ color: '#6B7280', margin: 0 }}>Loading schedule...</p>
                </div>
              ) : scheduleError ? (
                <div className="schedule-error" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  minHeight: '200px',
                  gap: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem' }}>📅</div>
                  <p style={{ color: '#DC2626', margin: 0, fontWeight: '600' }}>
                    {scheduleError.includes('No schedule found') ? 'No schedule available' : 'Failed to load schedule'}
                  </p>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '0.875rem' }}>
                    {scheduleError.includes('No schedule found') 
                      ? `No classes scheduled for ${selectedDay.toLowerCase()}`
                      : scheduleError
                    }
                  </p>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '0.875rem' }}>
                    {scheduleError.includes('No schedule found') 
                      ? 'Try selecting a different day'
                      : 'Showing fallback schedule'
                    }
                  </p>
                </div>
              ) : schedule.length === 0 ? (
                <div className="schedule-empty" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  minHeight: '200px',
                  gap: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem' }}>🎓</div>
                  <p style={{ color: '#6B7280', margin: 0, fontWeight: '600' }}>No classes today</p>
                  <p style={{ color: '#6B7280', margin: 0, fontSize: '0.875rem' }}>No schedule available for {selectedDay.toLowerCase()}</p>
                </div>
              ) : (
                <div className="schedule-grid" ref={scheduleGridRef}>
                  {schedule.map((item, index) => {
                    // Generate period numbers array
                    const periods = Array.from(
                      { length: item.duration }, 
                      (_, i) => item.startPeriod + i
                    );
                    
                    return (
                      <div key={item.id || index} className="schedule-card" data-duration={item.duration}>
                        <div className="schedule-card-inner">
                          <h4 className="schedule-subject" style={{ color: getSubjectColor(item.subject) }}>{item.subject}</h4>
                          <p className="schedule-teacher" style={{ color: getSubjectColor(item.subject) }}>{item.teacher}</p>
                          {item.keterangan && (
                            <p className="schedule-time" style={{ 
                              color: '#6B7280', 
                              fontSize: '0.75rem', 
                              margin: '0.25rem 0' 
                            }}>
                              {item.keterangan}
                            </p>
                          )}
                          <div className="schedule-periods">
                            <PeriodBoxes startPeriod={item.startPeriod} duration={item.duration} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <button className="schedule-nav-btn right" onClick={() => scrollSchedule('right')}>
                ›
              </button>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="statistics-section">
            <div className="section-header">
              <h2 className="section-title">Statistik</h2>
              <div className="month-selector" ref={monthDropdownRef}>
                <button 
                  className="month-btn active"
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                >
                  <span className="month-icon">⚪</span> {selectedMonth}
                </button>
                <button 
                  className="dropdown-btn"
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                >
                  ▼
                </button>
                {showMonthDropdown && (
                  <div className="dropdown-menu">
                    {timeRanges.map((range) => (
                      <button
                        key={range}
                        className={`dropdown-item ${selectedMonth === range ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedMonth(range);
                          setShowMonthDropdown(false);
                        }}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stats-grid">
              {/* Student Attendance Report */}
              <div className="stat-card">
                <h3 className="stat-title">Student Attendance Report</h3>
                <div className="stat-content">
                  <div className="chart-legend">
                    {attendanceReasons.map((reason, idx) => (
                      <button key={idx} className="legend-btn" style={{ '--btn-color': reason.color }}>
                        <span className="btn-icon">+</span>
                        <span className="btn-label">{reason.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="chart-container">
                    <div className="pie-wrap">
                      {statsLoading ? (
                        <div className="pie loading" />
                      ) : (
                        <div className="pie" style={{ background: pieBackground(attValues, pieColorsAttendance) }} />
                      )}
                      <div className="pie-center-label">
                        <span className="chart-label">{attPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Absent Reason Report */}
              <div className="stat-card">
                <h3 className="stat-title absent">Student Absent Reason Report</h3>
                <div className="stat-content">
                  <div className="chart-legend">
                    {absentReasons.map((reason, idx) => (
                      <button key={idx} className="legend-btn absent" style={{ '--btn-color': reason.color }}>
                        <span className="btn-icon">+</span>
                        <span className="btn-label">{reason.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="chart-container">
                    <div className="pie-wrap">
                      {statsLoading ? (
                        <div className="pie loading" />
                      ) : (
                        <div className="pie" style={{ background: pieBackground(absValues, pieColorsAbsent) }} />
                      )}
                      <div className="pie-center-label">
                        <span className="chart-label">{absPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
      
      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ClassDetail;
