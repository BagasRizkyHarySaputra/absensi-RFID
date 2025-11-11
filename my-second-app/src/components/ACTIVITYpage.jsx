"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import '../static/css/activity.css';
import '../static/css/DASHBOARDtable.css';
import '../static/js/activity.js';
import HEADERINpage from './HEADERINpage';
import { kehadiranService } from '../lib/kehadiranService';

export default function ACTIVITYpage() {
  // Real-time data state
  const [kehadiranData, setKehadiranData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const pageRef = useRef(null);
  const cardRef = useRef(null);
  const wrapRef = useRef(null);
  const tableRef = useRef(null);
  const paginationRef = useRef(null);

  // Load kehadiran data from database
  const loadKehadiranData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading kehadiran data for page:', page);
      
      const { data, error, count } = await kehadiranService.getKehadiran(page, rowsPerPage);
      
      if (error) {
        console.error('❌ Failed to load kehadiran data:', error);
        setError('Failed to load attendance data');
        setKehadiranData([]);
        setTotalCount(0);
      } else {
        console.log('✅ Kehadiran data loaded successfully:', data?.length || 0, 'records');
        setKehadiranData(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('❌ Error loading kehadiran data:', err);
      setError('Error loading attendance data');
      setKehadiranData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

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
      let status = 'Accepted';
      let info = 'Successful';
      let presenceType = 'Presensi Masuk';

      // Check the status field from database
      if (record.status === 'ditolak') {
        status = 'Declined';
        info = record.alasan_ditolak || 'Rejected';
      } else if (record.status === 'disetujui') {
        status = 'Accepted';
        info = 'Approved';
      } else if (record.status === 'pending') {
        status = 'Pending';
        info = 'Waiting for approval';
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
        date: formattedDate,
        time: formattedTime,
        presence: presenceType,
        nis: record.nis || 'N/A',
        name: record.nama || 'Unknown',
        class: record.kelas || 'N/A',
        status: status,
        info: info
      };
    });
  }, []);

  // Get formatted data for current page
  const pageRows = useMemo(() => {
    if (loading) {
      // Return skeleton data while loading
      return Array.from({ length: rowsPerPage }, (_, i) => ({
        date: '...',
        time: '...',
        presence: '...',
        nis: '...',
        name: '...',
        class: '...',
        status: 'Loading',
        info: '...'
      }));
    }
    
    return formatKehadiranData(kehadiranData);
  }, [kehadiranData, loading, rowsPerPage, formatKehadiranData]);

  // Load data when component mounts or dependencies change
  useEffect(() => {
    loadKehadiranData();
  }, [loadKehadiranData]);

  // Handle page navigation
  const goTo = useCallback((p) => {
    const newPage = Math.max(1, Math.min(totalPages, p));
    setPage(newPage);
  }, [totalPages]);
  const renderPageButtons = () => {
    const btns = [];
    const showPages = 3; // Maximum number of page buttons to show
    
    if (totalPages <= showPages) {
      // Show all pages if total is less than or equal to showPages
      for (let i = 1; i <= totalPages; i++) btns.push(i);
    } else {
      // Smart pagination logic
      let startPage = Math.max(1, page - Math.floor(showPages / 2));
      let endPage = Math.min(totalPages, startPage + showPages - 1);
      
      // Adjust start page if we're near the end
      if (endPage - startPage < showPages - 1) {
        startPage = Math.max(1, endPage - showPages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        btns.push(1);
        if (startPage > 2) {
          btns.push('…l');
        }
      }
      
      // Add visible page range
      for (let i = startPage; i <= endPage; i++) {
        btns.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          btns.push('…r');
        }
        btns.push(totalPages);
      }
    }
    return btns;
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing kehadiran data...');
      loadKehadiranData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadKehadiranData]);

  return (
    <div className="activity-page" ref={pageRef}>
      <HEADERINpage title="Student's Activity" />

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
        
        <div className="attendance-table-container">
          <table className="attendance-table">
            <tbody>
              {pageRows.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center' }}>{r.date}</td>
                  <td style={{ textAlign: 'center' }}>{r.time}</td>
                  <td style={{ textAlign: 'center' }}>{r.presence}</td>
                  <td style={{ textAlign: 'center' }}>{r.nis}</td>
                  <td style={{ textAlign: 'center' }}>{r.name}</td>
                  <td style={{ textAlign: 'center' }}>{r.class}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${r.status === 'Accepted' ? 'accepted' : r.status === 'Declined' ? 'declined' : 'pending'}`} style={{
                      backgroundColor: r.status === 'Accepted' ? '#D1DEC2' : r.status === 'Declined' ? '#B35B5C' : '#FFA500',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minWidth: '100px'
                    }}>
                      <span style={{ textAlign: 'left' }}>
                        {r.status}
                      </span>
                      {r.status === 'Accepted' && (
                        <img 
                          src="/Check.svg" 
                          alt="Accepted" 
                          style={{ 
                            width: '16px', 
                            height: '16px',
                            filter: 'brightness(0) invert(1)' // Make icon white
                          }} 
                        />
                      )}
                      {r.status === 'Declined' && (
                        <img 
                          src="/X.svg" 
                          alt="Declined" 
                          style={{ 
                            width: '16px', 
                            height: '16px',
                            filter: 'brightness(0) invert(1)' // Make icon white
                          }} 
                        />
                      )}
                      {r.status === 'Pending' && (
                        <span style={{ fontSize: '16px' }}>⏳</span>
                      )}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{r.info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button 
            className="page-btn nav-button" 
            onClick={() => goTo(page - 1)} 
            disabled={page === 1} 
            aria-label="Previous page"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minWidth: '40px',
              minHeight: '40px',
              border: 'none',
              background: 'transparent',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1
            }}
          >
            <img 
              src="/panah-kiri.svg" 
              alt="Previous" 
              style={{ 
                width: '32px', 
                height: '32px',
                display: 'block'
              }} 
            />
          </button>
          {renderPageButtons().map((b, i) => (
            typeof b === 'number' ? (
              <button
                key={i}
                className={`page-btn ${page === b ? 'active' : ''}`}
                onClick={() => goTo(b)}
              >
                {b}
              </button>
            ) : (
              <span key={i} className="ellipsis">...</span>
            )
          ))}
          <button 
            className="page-btn nav-button" 
            onClick={() => goTo(page + 1)} 
            disabled={page === totalPages} 
            aria-label="Next page"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              minWidth: '40px',
              minHeight: '40px',
              border: 'none',
              background: 'transparent',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1
            }}
          >
            <img 
              src="/panah-kanan.svg" 
              alt="Next" 
              style={{ 
                width: '32px', 
                height: '32px',
                display: 'block'
              }} 
            />
          </button>
        </div>
      </div>
    </div>
  );
}
