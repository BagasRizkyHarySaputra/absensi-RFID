"use client";

import React, { useEffect, useState } from 'react';
import statistikService from '../lib/statistik';

// Conic pie background helper
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

// Map the time range string to ISO start/end (align with report page presets)
function computeRange(rangeLabel) {
  const now = new Date();

  if (rangeLabel === 'Today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (rangeLabel === 'This Week') {
    const start = new Date(now);
    const day = start.getDay();
    const diffToMonday = (day + 6) % 7;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
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

// Dashboard widget to show absent reasons: [Sakit, Izin, Alpha]
export default function AbsentReasonReportDashboard({ kelas, range = 'This Month' }) {
  const [values, setValues] = useState([0,0,0]); // [Sakit, Izin, Alpha]
  const [loading, setLoading] = useState(false);
  const colors = ['#5B62B3', '#82A9F4', '#E6BFD4'];

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!kelas) return;
      setLoading(true);
      try {
        const { start, end } = computeRange(range);
        // statistikService.getAttendanceSummary returns breakdown with Sakit/Izin/Alpha in res.data when available
        const res = await statistikService.getAttendanceSummary({ kelas, start, end });
        const sakit = res?.data?.Sakit || 0;
        const izin = res?.data?.Izin || 0;
        const alpha = res?.data?.Alpha || 0;
        if (mounted) setValues([sakit, izin, alpha]);
      } catch (e) {
        console.error('❌ Failed loading absent-reason summary:', e);
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

  return (
    <div className="attendance-content" style={{ paddingTop: '0.5rem' }}>
      <div className="attendance-stats legend-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button disabled className="chip hadir" style={chipStyle('#5B62B3')}>Sakit <strong style={pctStyle}>{pct[0]}%</strong></button>
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
                  style={{ width: '120px', height: '120px', borderRadius: '50%', background: pieBackground(values, colors) }}
                  role="img"
                  aria-label="Absent Reason Pie Chart"
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
