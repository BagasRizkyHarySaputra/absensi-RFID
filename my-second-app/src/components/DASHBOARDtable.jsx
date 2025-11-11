"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../static/css/DASHBOARDtable.css';
import { kehadiranService } from '../lib/kehadiranService';

const DASHBOARDtable = () => {
  // Real-time data state
  const [kehadiranData, setKehadiranData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6; // Dashboard shows 6 rows
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Load kehadiran data from database
  const loadKehadiranData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading dashboard kehadiran data for page:', currentPage);
      
      // Test connection first
      const connectionTest = await kehadiranService.testConnection();
      if (!connectionTest) {
        console.warn('⚠️ Database connection failed, using fallback data');
        setKehadiranData([]);
        setTotalCount(0);
        setError('Database connection failed');
        setLoading(false);
        return;
      }
      
      const result = await kehadiranService.getKehadiran(currentPage, rowsPerPage);
      
      if (result.error) {
        console.error('❌ Failed to load dashboard kehadiran data:', result.error);
        setError('Failed to load attendance data: ' + (result.error.message || 'Unknown error'));
        setKehadiranData([]);
        setTotalCount(0);
      } else {
        console.log('✅ Dashboard kehadiran data loaded successfully:', result.data?.length || 0, 'records');
        setKehadiranData(result.data || []);
        setTotalCount(result.count || 0);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Error loading dashboard kehadiran data:', err);
      setError('Error loading attendance data: ' + (err.message || 'Unknown error'));
      setKehadiranData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage]);

  // Format database data for display
  const formatKehadiranData = useCallback((dbData) => {
    return dbData.map(record => {
      // Format date from waktu_absen
      const date = new Date(record.waktu_absen);
      const formattedDate = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      });
      
      // Format time from waktu_absen
      const formattedTime = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Determine status and info based on actual database fields
      let status = 'accepted';
      let info = 'Successful';
      let presenceType = 'Presensi Masuk';

      // Handle kehadiran table status mapping
      if (record.status === 'hadir') {
        status = 'accepted';
        info = 'Present';
      } else if (record.status === 'terlambat') {
        status = 'accepted';
        info = 'Late but Present';
      } else if (record.status === 'tidak_hadir' || record.status === 'alpha') {
        status = 'declined';
        info = record.alasan_ditolak || 'Absent';
      } else if (record.status === 'izin') {
        status = 'accepted';
        info = 'Excused Absence';
      } else if (record.status === 'sakit') {
        status = 'accepted';
        info = 'Sick Leave';
      } else {
        // Default mapping
        status = 'accepted';
        info = record.status || 'Unknown';
      }

      // Determine presence type based on time or other indicators
      const hour = date.getHours();
      if (hour < 12) {
        presenceType = 'Presensi Masuk';
      } else if (hour >= 12 && hour < 17) {
        presenceType = 'Presensi Keluar';
      } else {
        presenceType = 'Presensi Lembur';
      }

      return {
        id: record.id,
        date: formattedDate,
        time: formattedTime,
        presence: presenceType,
        nis: record.nis || 'N/A',
        name: record.nama || 'Unknown',
        class: record.kelas || 'N/A',
        status: status,
        information: info
      };
    });
  }, []);

  // Get formatted data for current page
  const attendanceData = useMemo(() => {
    if (loading) {
      // Return skeleton data while loading
      return Array.from({ length: rowsPerPage }, (_, i) => ({
        id: i + 1,
        date: '...',
        time: '...',
        presence: '...',
        nis: '...',
        name: '...',
        class: '...',
        status: 'loading',
        information: '...'
      }));
    }
    
    return formatKehadiranData(kehadiranData);
  }, [kehadiranData, loading, rowsPerPage, formatKehadiranData]);

  // Load data when component mounts or dependencies change
  useEffect(() => {
    loadKehadiranData();
  }, [loadKehadiranData]);

  useEffect(() => {
    // Load any additional JavaScript functionality
    const loadTableJS = async () => {
      try {
        await import('../static/js/DASHBOARDtable.js');
      } catch (error) {
        console.log('DASHBOARDtable.js not found or empty');
      }
    };
    loadTableJS();
  }, []);

  // Auto-refresh data every 30 seconds (same as Activity page)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard kehadiran data...');
      loadKehadiranData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadKehadiranData]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="attendance-table-section">
      {/* Table Header */}
      <div className="table-header">
        <div className="header-row" style={{ textAlign: 'center' }}>
          <span>Date</span>
          <span>Time</span>
          <span>Presence</span>
          <span>NIS</span>
          <span>Name</span>
          <span>Class</span>
          <span>Status</span>
          <span>Information</span>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem 0',
          color: '#c33'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      <div className="attendance-table-container"
        style={error ? { opacity: 0.7 } : {}}>
        <table className="attendance-table">
          <tbody>
            {attendanceData.map((record) => (
              <tr key={record.id}>
                <td style={{ textAlign: 'center' }}>{record.date}</td>
                <td style={{ textAlign: 'center' }}>{record.time}</td>
                <td style={{ textAlign: 'center' }}>{record.presence}</td>
                <td style={{ textAlign: 'center' }}>{record.nis}</td>
                <td style={{ textAlign: 'center' }}>{record.name}</td>
                <td style={{ textAlign: 'center' }}>{record.class}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`status-badge ${record.status}`} style={{
                    backgroundColor: record.status === 'accepted' ? '#D1DEC2' : '#B35B5C',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: '100px'
                  }}>
                    <span style={{ textAlign: 'left' }}>
                      {record.status === 'accepted' ? 'Accepted' : 'Declined'}
                    </span>
                    <img 
                      src={record.status === 'accepted' ? '/Check.svg' : '/X.svg'} 
                      alt={record.status === 'accepted' ? 'Accepted' : 'Declined'} 
                      style={{ 
                        width: '16px', 
                        height: '16px',
                        filter: 'brightness(0) invert(1)' // Make icon white
                      }} 
                    />
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>{record.information}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="pagination">
        {/* Previous Button */}
        <img 
          src="/panah-kiri.svg" 
          alt="Previous Page" 
          className={`nav-button ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          style={{ 
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
            width: '32px',
            height: '32px'
          }}
        />
        
        {/* Page Numbers */}
        {totalPages > 0 && (() => {
          const pages = [];
          const showPages = 3; // Maximum number of page buttons to show
          let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
          let endPage = Math.min(totalPages, startPage + showPages - 1);
          
          // Adjust start page if we're near the end
          if (endPage - startPage < showPages - 1) {
            startPage = Math.max(1, endPage - showPages + 1);
          }
          
          // Add first page and ellipsis if needed
          if (startPage > 1) {
            pages.push(
              <button key="1" className={`page-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => handlePageChange(1)}>
                1
              </button>
            );
            if (startPage > 2) {
              pages.push(<span key="ellipsis1" className="ellipsis">...</span>);
            }
          }
          
          // Add visible page range
          for (let i = startPage; i <= endPage; i++) {
            pages.push(
              <button 
                key={i} 
                className={`page-btn ${currentPage === i ? 'active' : ''}`} 
                onClick={() => handlePageChange(i)}
              >
                {i}
              </button>
            );
          }
          
          // Add ellipsis and last page if needed
          if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
              pages.push(<span key="ellipsis2" className="ellipsis">...</span>);
            }
            pages.push(
              <button 
                key={totalPages} 
                className={`page-btn ${currentPage === totalPages ? 'active' : ''}`} 
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            );
          }
          
          return pages;
        })()}
        
        {/* Next Button */}
        <img 
          src="/panah-kanan.svg" 
          alt="Next Page" 
          className={`nav-button ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          style={{ 
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
            width: '32px',
            height: '32px'
          }}
        />
      </div>
    </div>
  );
};

export default DASHBOARDtable;
