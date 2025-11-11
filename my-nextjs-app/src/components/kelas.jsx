"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getJadwalSchedule, getMockSchedule } from "../lib/jadwalService2";
import { useAuth } from "../hooks/useAuth";
import "../static/css/kelas.css";

// Optional helper
if (typeof window !== "undefined") {
  import("../static/js/kelas.js");
}

const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"];

// time helpers
function toMin(h, m) { return h * 60 + m; }
function fmt(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
}

function generateDaySlots(day) {
  // day: 1..5. Mon-Thu: 45' lessons, breaks 10:00 (15'), 11:45 (15'); Fri: 45', no break
  const LESSON = 45;
  const BREAKS = day === 5
    ? []
    : [
        { start: toMin(10, 0), dur: 15 },
        { start: toMin(11, 45), dur: 15 },
      ];
  // default start 07:00; we'll skip over breaks if a slot would touch them
  let t = toMin(7, 0);
  const out = [];
  while (out.length < 12) {
    // if current time is within a break, jump to its end
    const bNow = BREAKS.find(b => t >= b.start && t < b.start + b.dur);
    if (bNow) { t = bNow.start + bNow.dur; continue; }
    // if next slot would overlap a break start, move to break end first
    const overlap = BREAKS.find(b => t < b.start && t + LESSON > b.start);
    if (overlap) { t = overlap.start + overlap.dur; continue; }
    const end = t + LESSON;
    out.push({ start: t, end });
    t = end;
  }
  return out;
}

// Previous mock lesson generator retained as fallback via service

export default function KelasPage() {
  const { user } = useAuth();
  // Determine initial day using Jakarta timezone (UTC+7). Map Mon=1..Fri=5 else default 1.
  const initialDay = (() => {
    const nowUtc = new Date();
    // convert to Jakarta by adding offset (minutes * 60000)
    const jakarta = new Date(nowUtc.getTime() + 7 * 60 * 60000);
    const d = jakarta.getUTCDay(); // still 0..6 but using shifted time basis
    if (d >= 1 && d <= 5) return d; // Mon..Fri
    return 1; // weekend -> show Monday as default
  })();
  const [day, setDay] = useState(initialDay); // 1..5
  const [nowMins, setNowMins] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  const [schedule, setSchedule] = useState(() => getMockSchedule());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  // Load real schedule from database (optional: specify kelas if identification available)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const kelasName = user?.kelas || undefined;
      const result = await getJadwalSchedule(kelasName);
      if (cancelled) return;
      if (result.success) {
        setSchedule(result.data);
        // Check if any subject exists; if none, inform user but keep UI
        const hasAny = Object.values(result.data || {}).some(arr => Array.isArray(arr) && arr.some(it => it.subject));
        if (!hasAny) {
          setError(kelasName ? `Tidak ada jadwal untuk kelas ${kelasName}` : 'Tidak ada jadwal yang tersedia');
        }
        setDebugInfo(`Loaded schedule for kelas=${kelasName || 'ALL'} hasAny=${hasAny}`);
      } else {
        console.warn('Using mock schedule, failed to load jadwal:', result.error);
        setError(result.error);
        setSchedule(getMockSchedule());
        setDebugInfo(`Fallback mock used. Error=${result.error}`);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user?.kelas]);
  const slotsByDay = useMemo(() => ({
    1: generateDaySlots(1),
    2: generateDaySlots(2),
    3: generateDaySlots(3),
    4: generateDaySlots(4),
    5: generateDaySlots(5),
  }), []);

  // Determine current weekday mapping: Mon=1..Fri=5 (else 0 for weekend)
  const todayIdx = (() => {
    const nowUtc = new Date();
    const jakarta = new Date(nowUtc.getTime() + 7 * 60 * 60000);
    const gd = jakarta.getUTCDay(); // 0..6 (Sun..Sat) based on Jakarta time
    if (gd >= 1 && gd <= 5) return gd; // Mon..Fri
    return 0;
  })();

  // Tick every 30s to update highlight
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowMins(n.getHours() * 60 + n.getMinutes());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const rows = schedule[day] || [];

  function goto(p) {
    const np = Math.min(5, Math.max(1, p));
    setDay(np);
  }

  return (
    <section className="kelas-container">
      <div className="kelas-card">
        <div className="kelas-header">{DAYS[day - 1]}</div>
        {error && (
          <div className="kelas-error" aria-live="polite" style={{ color: '#b91c1c', fontSize: '0.75rem', marginBottom: '4px' }}>
            {error}
          </div>
        )}
        {debugInfo && (
          <div className="kelas-debug" style={{ display: 'none' }}>{debugInfo}</div>
        )}
        <div className="kelas-list-scroll" role="list">
          {rows.map((row, idx) => {
            const slot = slotsByDay[day][idx];
            const isCurrent = day === todayIdx && slot && nowMins >= slot.start && nowMins < slot.end;
            return (
            <div key={row.id} className={`kelas-item ${isCurrent ? "current" : ""}`} role="listitem">
              <span className="subject">{row.subject}</span>
              <span className="time">
                {row.timeLabel
                  ? row.timeLabel
                  : `${fmt(slotsByDay[day][idx]?.start)} - ${fmt(slotsByDay[day][idx]?.end)}`}
              </span>
              <span className="teacher">{row.teacher}</span>
            </div>
          );})}
        </div>
      </div>

      <div className="kelas-footer">
        <div className="pagination" role="navigation" aria-label="Hari">
          <button className="page-btn" onClick={() => goto(day - 1)} disabled={day === 1} aria-label="Hari sebelumnya">‹</button>
          {[1,2,3,4,5].map((n) => (
            <button key={n} className={`page-btn ${day === n ? "active" : ""}`} onClick={() => goto(n)}>{n}</button>
          ))}
          <button className="page-btn" onClick={() => goto(day + 1)} disabled={day === 5} aria-label="Hari berikutnya">›</button>
        </div>
      </div>
    </section>
  );
}
