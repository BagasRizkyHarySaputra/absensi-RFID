"use client";

import React, { useState, useEffect, useRef } from 'react';
import '../static/css/ClassDetail.css';
import HEADERINpage from './HEADERINpage';

const ClassDetail = ({ classData, onBack }) => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const dayDropdownRef = useRef(null);
  const monthDropdownRef = useRef(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeRanges = ['Today', 'This Week', 'This Month', 'This Year'];

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

  const schedule = generateSchedule(classData.name);

  // Scroll navigation
  const scrollSchedule = (direction) => {
    const container = document.querySelector('.schedule-grid');
    if (container) {
      const scrollAmount = 240; // card width + gap
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
            <p className="info-description">
              Kelas {classData.name} adalah salah satu kelas di jurusan Sistem Informatika Jaringan dan Aplikasi yang terdiri dari 36 siswa. Kelas ini dikenal kompak, aktif, dan kreatif dalam berbagai kegiatan, baik akademik maupun nonakademik. Para siswanya memiliki semangat tinggi dalam mempelajari bidang teknologi, terutama dalam jaringan komputer, pemrograman, dan sistem aplikasi. Dengan kerja sama yang baik antara guru dan siswa, {classData.name} menjadi kelas yang produktif, berprestasi, dan memiliki rasa kekeluargaan yang kuat.
            </p>
          </div>
        </div>

        {/* Right Side - Schedule and Statistics */}
        <div className="class-detail-content">
          {/* Schedule Section */}
          <div className="schedule-section">
            <div className="section-header">
              <h2 className="section-title">Jadwal Pelajaran</h2>
              <div className="day-selector" ref={dayDropdownRef}>
                <button 
                  className="day-btn active"
                  onClick={() => setShowDayDropdown(!showDayDropdown)}
                >
                  <span className="day-icon">⚪</span> {selectedDay}
                </button>
                <button 
                  className="dropdown-btn"
                  onClick={() => setShowDayDropdown(!showDayDropdown)}
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
                        {day}
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
              <div className="schedule-grid">
                {schedule.map((item, index) => {
                  // Generate period numbers array
                  const periods = Array.from(
                    { length: item.duration }, 
                    (_, i) => item.startPeriod + i
                  );
                  
                  return (
                    <div key={index} className="schedule-card" data-duration={item.duration}>
                      <h4 className="schedule-subject">{item.subject}</h4>
                      <p className="schedule-teacher">{item.teacher}</p>
                      <div className="schedule-periods">
                        {periods.map((period, idx) => (
                          <span key={idx} className="schedule-period-number">{period}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    <svg viewBox="0 0 200 200" className="pie-chart">
                      <circle cx="100" cy="100" r="80" fill="#f3f5fa" />
                      <text x="100" y="105" textAnchor="middle" className="chart-label">0%</text>
                    </svg>
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
                    <svg viewBox="0 0 200 200" className="pie-chart">
                      <circle cx="100" cy="100" r="80" fill="#f3f5fa" />
                      <text x="100" y="105" textAnchor="middle" className="chart-label">0%</text>
                    </svg>
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
    </div>
  );
};

export default ClassDetail;
