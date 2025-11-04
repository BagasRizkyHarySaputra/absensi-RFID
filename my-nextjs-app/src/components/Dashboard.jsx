'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SidebarDashboard from './sideDASHBOARD';
import DashboardBackground from './DashboardBACKGROUND';
import { useAuth } from '../hooks/useAuth';
import { fetchAttendanceData, getAttendanceStatistics } from './collectDATA';
import '../static/css/fonts.css';
import '../static/css/Dashboard.css';
import '../static/css/sideDASHBOARD.css';
import HistoryPage from './history';
import PengajuanPage from './pengajuan';
import KelasPage from './kelas';
import Header from './header';
import { CheckIcon } from '@heroicons/react/24/outline';

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

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  // Data for dashboard table - bisa disesuaikan berdasarkan user yang login
  const rows = useMemo(() => {
    if (!user) return [];
    
    const base = [];
    // Jika user adalah admin, tampilkan semua data
    // Jika user adalah siswa, tampilkan data mereka saja
    const names = user.role === 'admin' 
      ? ["Chu Yue", "Raihan Putra", "Salsa Nabila", "Dewi Lestari", "Gilang Pratama", "Chu Yue"]
      : [user.nama];
    
    const classes = user.role === 'admin'
      ? ["XI SIJA 2", "XI SIJA 2", "XI SIJA 2", "XI SIJA 2", "XI SIJA 2", "XI SIJA 2"]
      : [user.kelas];
    
    // Tambahkan lebih banyak data agar pergantian halaman terlihat saat diuji.
    // Di produksi, ini harus berasal dari API dengan pagination.
    const count = user.role === 'admin' ? 60 : 9; // 60 items -> 10 halaman dengan pageSize 6
    
    for (let i = 0; i < count; i++) {
      base.push({
        date: '24 Oktober 2025',
        time: '06.45',
        presence: 'Presensi Masuk',
        nis: user.role === 'admin' ? '244119900' : user.nis,
        name: names[i % names.length],
        className: classes[i % classes.length],
        status: 'Accepted',
        info: 'Successful'
      });
    }
    return base;
  }, [user]);

  // Derived pagination values
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

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

  const renderDashboardContent = () => (
    <>
      {/* Top table card like the mock */}
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
              {(isMobile ? rows : paginatedRows).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.date}</td>
                  <td>{row.time}</td>
                  <td className="presence">{row.presence}</td>
                  <td>{row.nis}</td>
                  <td>{row.name}</td>
                  <td>{row.className}</td>
                  <td>
                    <span className="badge accepted">
                      <span className="icon" aria-hidden>
                        <CheckIcon width={10} height={10} strokeWidth={3} />
                      </span>
                      Accepted
                    </span>
                  </td>
                  <td>Successful</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isMobile && (
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

      {/* Bottom two-column grid */}
      <div className="bottom-grid">
        {/* Schedule card */}
        <div className="schedule-card">
          <div className="schedule-header">SENIN</div>
          <ul className="schedule-list">
            <li className="schedule-item">
              <span className="subject">KK SIJA</span>
              <span className="line" />
              <span className="teacher">Bu Inung</span>
            </li>
            <li className="schedule-item">
              <span className="subject">KK SIJA</span>
              <span className="line" />
              <span className="teacher">Bu Nisa</span>
            </li>
            <li className="schedule-item">
              <span className="subject">B. Jerman</span>
              <span className="line" />
              <span className="teacher">Frau Vanda</span>
            </li>
          </ul>
        </div>

        {/* Leave request form */}
        <div className="leave-card">
          <div className="form-grid">
            <div className="form-row">
              <input className="leave-input" placeholder="Alasan izin" />
            </div>
            <div className="form-row">
              <input className="leave-input" placeholder="Keterangan Alasan (opsional)" />
            </div>
            <div className="form-row">
              <input className="leave-input" placeholder="Bukti Tambahan" />
            </div>
            <div className="form-row">
              <button className="submit-btn">Ajukan izin</button>
            </div>
          </div>
        </div>
      </div>
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