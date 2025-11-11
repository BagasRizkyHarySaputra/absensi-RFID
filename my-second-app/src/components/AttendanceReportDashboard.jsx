"use client";

import React, { useEffect, useState } from 'react';
import { getAttendanceSummary } from '../lib/report';

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

// Compute ISO start/end by selected range (subset used on dashboard)
function computeRange(rangeLabel) {
  const now = new Date();

  if (rangeLabel === 'Today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // Default: This Month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function AttendanceReportDashboard({ kelas, range = 'This Month', layout = 'default', title = 'Student Attendance Report' }) {
  const [values, setValues] = useState([0, 0, 0]); // [hadir, izin, alpha]
  const [loading, setLoading] = useState(false);
  const pieColors = ['#2E65D8', '#82A9F4', '#E6BFD4']; // hadir, izin, alpha

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!kelas) return;
      setLoading(true);
      try {
        const { start, end } = computeRange(range);
        const res = await getAttendanceSummary({ kelas, start, end });
        const hadir = res?.hadir || 0;
        const izin = res?.izin || 0;
        const alpha = res?.alpha || 0;
        if (mounted) setValues([hadir, izin, alpha]);
      } catch (e) {
        console.error('❌ Failed loading dashboard attendance summary:', e);
        if (mounted) setValues([0,0,0]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [kelas, range]);

  const total = values.reduce((a,b)=>a+b,0) || 1;
  const pct = values.map(v => Math.round((v/total)*100));

  // Wide layout for ClassDetail page: title + legend left, enlarged pie right
  if (layout === 'wide') {
    return (
      <div className="attendance-wide" style={{ display: 'flex', alignItems: 'stretch', gap: '2rem' }}>
        <div className="attendance-left" style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <div className="attendance-header-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
            <h3 className="stat-title" style={{ margin: 0 }}>{title}</h3>
          </div>
          <div className="attendance-stats legend-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '420px' }}>
            <button disabled className="chip hadir" style={chipStyleWide('#2E65D8')}>Hadir <span style={pctInline}>{pct[0]}%</span></button>
            <button disabled className="chip izin" style={chipStyleWide('#82A9F4')}>Izin <span style={pctInline}>{pct[1]}%</span></button>
            <button disabled className="chip alpha" style={chipStyleWide('#E6BFD4', '#374151')}>Alpha <span style={pctInline}>{pct[2]}%</span></button>
          </div>
        </div>
        <div className="attendance-right" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: '1rem' }}>
          {loading ? (
            <div className="pie-loading" style={loadingStyleWide}>
              <div style={spinnerStyleWide}></div>
              <span style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#6B7280' }}>Loading...</span>
            </div>
          ) : (() => {
            const sum = values.reduce((a,b)=>a+b,0);
            if (sum === 0) {
              return (
                <div style={noDataStyleWide}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📊</div>
                  <div style={{ fontSize: '0.9rem' }}>No data</div>
                </div>
              );
            }
            return (
              <div
                className="pie"
                style={{ width: '200px', height: '200px', borderRadius: '50%', background: pieBackground(values, pieColors) }}
                role="img"
                aria-label="Attendance Pie Chart"
              />
            );
          })()}
        </div>
      </div>
    );
  }

  // Default compact layout
  return (
    <div className="attendance-content" style={{ paddingTop: '0.5rem' }}>
      <div className="attendance-stats legend-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button disabled className="chip hadir" style={chipStyle('#2E65D8')}>Hadir <strong style={pctStyle}>{pct[0]}%</strong></button>
        <button disabled className="chip izin" style={chipStyle('#82A9F4')}>Izin <strong style={pctStyle}>{pct[1]}%</strong></button>
        <button disabled className="chip alpha" style={chipStyle('#E6BFD4', '#374151')}>Alpha <strong style={pctStyle}>{pct[2]}%</strong></button>
      </div>
      <div className="pie-chart-section" style={{ marginTop: '0.75rem' }}>
        <div className="pie-chart" style={{ display: 'flex', justifyContent: 'center' }}>
          {loading ? (
            <div className="pie-loading" style={loadingStyle}>
              <div style={spinnerStyle}></div>
              <span style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#6B7280' }}>Loading...</span>
            </div>
          ) : (
            (() => {
              const sum = values.reduce((a,b)=>a+b,0);
              if (sum === 0) {
                return (
                  <div style={noDataStyle}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📊</div>
                    <div>No data</div>
                  </div>
                );
              }
              return (
                <div
                  className="pie"
                  style={{ width: '120px', height: '120px', borderRadius: '50%', background: pieBackground(values, pieColors) }}
                  role="img"
                  aria-label="Attendance Pie Chart"
                />
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}

const chipStyle = (bg, textColor='#fff') => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
  padding: '0.45rem 0.75rem',
  fontSize: '0.75rem',
  borderRadius: '12px',
  background: bg,
  color: textColor,
  border: 'none',
  cursor: 'default'
});

const pctStyle = { fontWeight: 600 };

const loadingStyle = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F3F4F6',
  border: '2px dashed #D1D5DB'
};

const spinnerStyle = {
  width: '24px',
  height: '24px',
  border: '3px solid #E5E7EB',
  borderTop: '3px solid #5B62B3',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const noDataStyle = {
  width: '120px',
  height: '120px',
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
};

// Wide layout style helpers
const chipStyleWide = (bg, textColor='#fff') => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  padding: '0.75rem 1.25rem',
  fontSize: '0.9rem',
  borderRadius: '16px',
  background: bg,
  color: textColor,
  border: 'none',
  minWidth: '240px',
  cursor: 'default',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
});

const pctInline = { fontWeight: 600 };

const loadingStyleWide = {
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F3F4F6',
  border: '3px dashed #D1D5DB'
};

const spinnerStyleWide = {
  width: '38px',
  height: '38px',
  border: '4px solid #E5E7EB',
  borderTop: '4px solid #5B62B3',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const noDataStyleWide = {
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  background: '#F3F4F6',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: '3px dashed #D1D5DB',
  color: '#9CA3AF',
  fontSize: '0.85rem',
  textAlign: 'center'
};
