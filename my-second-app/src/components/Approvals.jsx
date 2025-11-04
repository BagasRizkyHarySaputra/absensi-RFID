"use client";

import React, { useEffect, useState } from 'react';
import '../static/css/Approvals.css';
import HEADERINpage from './HEADERINpage';
import { approvalDatabase } from './database-backup'; // Using backup with hardcoded values

const Approvals = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  const itemsPerPage = 10;

  // Load approvals from database
  const loadApprovals = async () => {
    console.log('🚀 Starting to load approvals...');
    setLoading(true);
    
    // Test database connection first
    const connectionOK = await approvalDatabase.testConnection();
    if (!connectionOK) {
      setError('Failed to connect to database');
      setLoading(false);
      return;
    }
    
    try {
      const { data, error, count } = await approvalDatabase.getApprovals(
        currentPage, 
        itemsPerPage, 
        searchQuery
      );
      
      console.log('📊 Database response:', { data, error, count });
      console.log('📝 Data length:', data?.length);
      
      if (error) {
        setError(error.message);
        console.error('❌ Error loading approvals:', error);
      } else {
        // Transform pengajuan_izin data to match expected format
        const transformedData = await Promise.all(data.map(async (pengajuan) => {
          // Get student data by NIS
          const studentData = await approvalDatabase.getStudentByNis(pengajuan.nis);
          
          // Determine the type of request based on alasan
          let title = 'Izin';
          if (pengajuan.alasan.toLowerCase().includes('sakit')) {
            title = 'Izin Sakit';
          } else if (pengajuan.alasan.toLowerCase().includes('keluarga')) {
            title = 'Izin Keluarga';
          } else if (pengajuan.alasan.toLowerCase().includes('dokter')) {
            title = 'Izin Dokter';
          } else if (pengajuan.alasan.toLowerCase().includes('terlambat')) {
            title = 'Keterlambatan';
          }

          // Calculate duration
          const startDate = new Date(pengajuan.tanggal_mulai);
          const endDate = new Date(pengajuan.tanggal_selesai);
          const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          
          const description = duration === 1 
            ? `${pengajuan.alasan} (${startDate.toLocaleDateString('id-ID')})`
            : `${pengajuan.alasan} (${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')})`;

          return {
            id: pengajuan.id,
            category: 'Pengajuan',
            title: title,
            description: description,
            user: {
              name: studentData?.nama || 'Unknown Student',
              class: studentData?.kelas || pengajuan.nis
            },
            status: pengajuan.status,
            nis: pengajuan.nis,
            tanggal_mulai: pengajuan.tanggal_mulai,
            tanggal_selesai: pengajuan.tanggal_selesai,
            alasan: pengajuan.alasan,
            keterangan: pengajuan.keterangan,
            file_pendukung: pengajuan.file_pendukung
          };
        }));
        
        console.log('✅ Transformed data:', transformedData);
        console.log('📋 Setting approvals count:', transformedData.length);
        
        setApprovals(transformedData);
        setTotalCount(count || 0);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load approvals');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered, calling loadApprovals...');
    loadApprovals();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    // Load any additional JavaScript functionality
    const loadApprovalsJS = async () => {
      try {
        await import('../static/js/Approvals.js');
      } catch (error) {
        console.log('Approvals.js not found or empty');
      }
    };
    loadApprovalsJS();
  }, []);

  const handleApprove = async (id) => {
    try {
      const approval = approvals.find(a => a.id === id);
      if (approval?.status === 'pending') {
        // Approve pending request
        const { error } = await approvalDatabase.approveRequest(id);
        if (error) {
          console.error('Error approving request:', error);
          alert('Failed to approve request');
        } else {
          loadApprovals(); // Reload data
        }
      } else if (approval?.status === 'approved') {
        // Accept approved request (final confirmation)
        const { error } = await approvalDatabase.acceptApproval(id);
        if (error) {
          console.error('Error accepting approval:', error);
          alert('Failed to accept approval');
        } else {
          loadApprovals(); // Reload data
        }
      }
    } catch (error) {
      console.error('Error in handleApprove:', error);
      alert('An error occurred');
    }
  };

  const handleReject = async (id) => {
    try {
      const approval = approvals.find(a => a.id === id);
      if (approval?.status === 'pending') {
        // Reject pending request
        const { error } = await approvalDatabase.rejectRequest(id);
        if (error) {
          console.error('Error rejecting request:', error);
          alert('Failed to reject request');
        } else {
          loadApprovals(); // Reload data
        }
      } else if (approval?.status === 'approved') {
        // Cancel approved request
        const { error } = await approvalDatabase.cancelApproval(id);
        if (error) {
          console.error('Error canceling approval:', error);
          alert('Failed to cancel approval');
        } else {
          loadApprovals(); // Reload data
        }
      }
    } catch (error) {
      console.error('Error in handleReject:', error);
      alert('An error occurred');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="approvals-page">
      <HEADERINpage title="Approvals" />
      
      <div className="approvals-content">
        {/* Loading State */}
        {loading && (
          <div className="loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading approvals...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state" style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
            <p>Error: {error}</p>
            <button onClick={loadApprovals} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
              Retry
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <img src="/search.svg" alt="Search" width="48" height="48" />
              </button>
            </div>
          </form>
        </div>

        {/* Approval Cards Grid */}
        {!loading && !error && (
          <div className="approvals-grid">
            {console.log('🎯 Rendering approvals. State:', { loading, error, approvalsLength: approvals.length })}
            {approvals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>No approvals found.</p>
              </div>
            ) : (
              approvals.map((approval) => (
            <div key={approval.id} className={`action-card ${approval.status === 'pending' ? 'pending-card' : 'approved-card'}`}>
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
                {approval.status === 'pending' ? (
                  <>
                    <button 
                      className="btn-accept"
                      onClick={() => handleApprove(approval.id)}
                    >
                      <img src="/Check.svg" alt="Accept" />
                    </button>
                    <button 
                      className="btn-decline"
                      onClick={() => handleReject(approval.id)}
                    >
                      <img src="/X.svg" alt="Decline" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn-cancel"
                      onClick={() => handleReject(approval.id)}
                    >
                      Batalkan Presensi
                    </button>
                    <button 
                      className="btn-accept-text"
                      onClick={() => handleApprove(approval.id)}
                    >
                      Terima Presensi
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination">
            {/* Previous button */}
            {currentPage > 1 && (
              <button 
                className="page-btn"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
            )}

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button 
                  key={pageNum}
                  className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next button */}
            {currentPage < totalPages && (
              <button 
                className="page-btn"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;