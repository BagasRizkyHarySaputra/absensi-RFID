"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../static/css/activity.css';
import '../static/js/activity.js';
import HEADERINpage from './HEADERINpage';

export default function ACTIVITYpage() {
  // Mock data to mirror the reference layout
  const classes = ['XI SIJA 2', 'XI KIJI 3', 'XI TME 1', 'XI TFLM 2', 'XI TEK 1', 'XI TKR 3'];
  const generateRows = (count = 12 * 68) => {
    return Array.from({ length: count }, (_, i) => {
      const accepted = i % 2 === 0;
      const mm = 45 + (i % 15); // 45..59 loop
      const time = `06.${String(mm).padStart(2, '0')}`;
      return {
        date: '24 Oktober 2025',
        time,
        presence: 'Presensi Masuk',
        nis: '244119900',
        name: 'Chu Yue',
        class: classes[i % classes.length],
        status: accepted ? 'Accepted' : 'Declined',
        info: accepted ? 'Successful' : 'Wrong pin'
      };
    });
  };

  const data = useMemo(() => generateRows(), []);
  const [page, setPage] = useState(1);
  const rowsPerPage = 12; // back to 12 rows per page with pagination
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const pageRef = useRef(null);
  const cardRef = useRef(null);
  const wrapRef = useRef(null);
  const tableRef = useRef(null);
  const paginationRef = useRef(null);
  // No scale logic needed: table scrolls naturally

  const pageRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [page, data, rowsPerPage]);

  const goTo = (p) => setPage(Math.max(1, Math.min(totalPages, p)));
  const renderPageButtons = () => {
    const btns = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) btns.push(i);
    } else {
      btns.push(1);
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      if (start > 2) btns.push('…l');
      for (let i = start; i <= end; i++) btns.push(i);
      if (end < totalPages - 1) btns.push('…r');
      btns.push(totalPages);
    }
    return btns;
  };

  return (
    <div className="activity-page" ref={pageRef}>
      <HEADERINpage title="Student's Activity" />

      <section
        className="activity-card"
        aria-label="activity table"
        ref={cardRef}
      >
        {/* External table header band (outside the white table) */}
        <div className="activity-table-head" aria-hidden="true">
          <div className="head-grid">
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
        <div className="activity-table-wrap" ref={wrapRef}>
          <table className="activity-table" ref={tableRef}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Presence</th>
                <th scope="col">NIS</th>
                <th scope="col">Name</th>
                <th scope="col">Class</th>
                <th scope="col">Status</th>
                <th scope="col">Information</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.date}</td>
                  <td>{r.time}</td>
                  <td>{r.presence}</td>
                  <td>{r.nis}</td>
                  <td>{r.name}</td>
                  <td>{r.class}</td>
                  <td>
                    <span className={`status-pill ${r.status === 'Accepted' ? 'accepted' : 'declined'}`}>
                      {r.status}
                      <span className="icon" aria-hidden="true">{r.status === 'Accepted' ? '✔' : '✖'}</span>
                    </span>
                  </td>
                  <td>{r.info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <nav className="activity-pagination" aria-label="pagination" ref={paginationRef}>
          <button className="page-btn" onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Previous page">◀</button>
          {renderPageButtons().map((b, i) => (
            typeof b === 'number' ? (
              <button
                key={i}
                className="page-btn"
                aria-current={page === b ? 'page' : undefined}
                onClick={() => goTo(b)}
              >
                {b}
              </button>
            ) : (
              <span key={i} className="page-ellipsis">…</span>
            )
          ))}
          <button className="page-next" onClick={() => goTo(page + 1)} disabled={page === totalPages} aria-label="Next page">▶</button>
        </nav>
      </section>
    </div>
  );
}
