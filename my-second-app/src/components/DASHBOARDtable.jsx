"use client";

import React, { useState, useEffect } from 'react';
import '../static/css/DASHBOARDtable.css';

const DASHBOARDtable = () => {
  const [attendanceData, setAttendanceData] = useState([
    {
      id: 1,
      date: '24 Oktober 2025',
      time: '06:45',
      presence: 'Presensi Masuk',
      nis: '244119900',
      name: 'Chu Yue',
      class: 'XI SIJA 2',
      status: 'accepted',
      information: 'Successful'
    },
    {
      id: 2,
      date: '24 Oktober 2025',
      time: '06:45',
      presence: 'Presensi Masuk',
      nis: '244119900',
      name: 'Chu Yue',
      class: 'XI XJU 3',
      status: 'declined',
      information: 'Wrong pin'
    },
    {
      id: 3,
      date: '24 Oktober 2025',
      time: '06:45',
      presence: 'Presensi Masuk',
      nis: '244119900',
      name: 'Chu Yue',
      class: 'XI TME 1',
      status: 'accepted',
      information: 'Successful'
    },
    {
      id: 4,
      date: '24 Oktober 2025',
      time: '06:45',
      presence: 'Presensi Masuk',
      nis: '244119900',
      name: 'Chu Yue',
      class: 'XI TEM 2',
      status: 'declined',
      information: 'Wrong pin'
    },
    {
      id: 5,
      date: '24 Oktober 2025',
      time: '06:45',
      presence: 'Presensi Masuk',
      nis: '244119900',
      name: 'Chu Yue',
      class: 'XI TEK 1',
      status: 'accepted',
      information: 'Successful'
    },
    {
      id: 6,
      date: '24 Oktober 2025',
      time: '06:45',
      presence: 'Presensi Masuk',
      nis: '244119900',
      name: 'Chu Yue',
      class: 'XI TKR 3',
      status: 'declined',
      information: 'Wrong pin'
    }
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(68);

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Here you would typically fetch new data for the selected page
  };

  return (
    <div className="attendance-table-section">
      {/* Table Header */}
      <div className="table-header">
        <div className="header-row">
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
            {attendanceData.map((record) => (
              <tr key={record.id}>
                <td>{record.date}</td>
                <td>{record.time}</td>
                <td>{record.presence}</td>
                <td>{record.nis}</td>
                <td>{record.name}</td>
                <td>{record.class}</td>
                <td>
                  <span className={`status-badge ${record.status}`}>
                    {record.status === 'accepted' ? 'Accepted ✓' : 'Declined ✗'}
                  </span>
                </td>
                <td>{record.information}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="pagination">
        <button 
          className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
        <button 
          className={`page-btn ${currentPage === 2 ? 'active' : ''}`}
          onClick={() => handlePageChange(2)}
        >
          2
        </button>
        <button 
          className={`page-btn ${currentPage === 3 ? 'active' : ''}`}
          onClick={() => handlePageChange(3)}
        >
          3
        </button>
        <span>...</span>
        <button 
          className={`page-btn ${currentPage === 67 ? 'active' : ''}`}
          onClick={() => handlePageChange(67)}
        >
          67
        </button>
        <button 
          className={`page-btn ${currentPage === 68 ? 'active' : ''}`}
          onClick={() => handlePageChange(68)}
        >
          68
        </button>
      </div>
    </div>
  );
};

export default DASHBOARDtable;
