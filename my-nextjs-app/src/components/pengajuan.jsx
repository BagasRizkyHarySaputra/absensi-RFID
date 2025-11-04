"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from '../hooks/useAuth';
import { submitPengajuan, getUserPengajuan, uploadFile } from '../lib/pengajuanService';
import "../static/css/pengajuan.css";
import { CameraIcon, DocumentIcon, CheckIcon, XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";

// Optional helper on the client
if (typeof window !== "undefined") {
  import("../static/js/pengajuan.js");
}

export default function PengajuanPage() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userPengajuan, setUserPengajuan] = useState([]);
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'history'
  
  // Form state
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState({ d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() });
  const [endDate, setEndDate] = useState({ d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() });
  const [alasan, setAlasan] = useState("");
  const [keterangan, setKeterangan] = useState("");

  // Load user's pengajuan history on component mount
  useEffect(() => {
    if (user?.nis) {
      loadUserPengajuan();
    }
  }, [user]);

  const loadUserPengajuan = async () => {
    if (!user?.nis) return;
    
    const result = await getUserPengajuan(user.nis);
    if (result.success) {
      setUserPengajuan(result.data);
    }
  };

  function onPickFile() {
    fileRef.current?.click();
  }
  
  function onFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setFileName(f.name);
      setSelectedFile(f);
    }
  }

  const formatDate = (dateObj) => {
    return `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.nis) {
      setError("User tidak terautentikasi");
      return;
    }

    // Validation
    if (!alasan.trim()) {
      setError("Alasan harus diisi");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let fileUrl = null;
      
      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile, `pengajuan_${user.nis}`);
        if (uploadResult.success) {
          fileUrl = uploadResult.url;
        } else {
          setError("Gagal mengupload file: " + uploadResult.error);
          setLoading(false);
          return;
        }
      }

      // Prepare pengajuan data
      const pengajuanData = {
        nis: user.nis,
        tanggal_mulai: formatDate(startDate),
        tanggal_selesai: formatDate(endDate),
        alasan: alasan.trim(),
        keterangan: keterangan.trim() || null,
        file_pendukung: fileUrl
      };

      // Submit to database
      const result = await submitPengajuan(pengajuanData);
      
      if (result.success) {
        setSuccess("Pengajuan berhasil dikirim!");
        
        // Reset form
        setAlasan("");
        setKeterangan("");
        setFileName("");
        setSelectedFile(null);
        setStartDate({ d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() });
        setEndDate({ d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() });
        
        // Reload pengajuan history
        await loadUserPengajuan();
        
        // Switch to history tab to show the new pengajuan
        setActiveTab('history');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckIcon className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XMarkIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      default:
        return 'Menunggu';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  return (
    <section className="pengajuan-container">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          Ajukan Izin
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Riwayat Pengajuan
        </button>
      </div>

      {activeTab === 'form' ? (
        /* Form Pengajuan */
        <div className="pengajuan-form">
          {/* Error/Success Messages */}
          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Dates Row */}
            <div className="dates-grid spaced-block">
              <div className="form-field">
                <label className="field-label">Tanggal mulai</label>
                <SegmentedDateInput value={startDate} onChange={setStartDate} />
              </div>
              <div className="form-field">
                <label className="field-label">Tanggal selesai</label>
                <SegmentedDateInput value={endDate} onChange={setEndDate} />
              </div>
            </div>

            {/* Reason */}
            <div className="form-field alasan-field">
              <label className="field-label">Alasan Izin</label>
              <textarea 
                className="pill-textarea" 
                placeholder="Masukkan Alasan (wajib diisi)" 
                rows={3}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                required
              />
            </div>

            {/* Optional detail */}
            <div className="form-field keterangan-field">
              <label className="field-label">Keterangan Alasan (opsional)</label>
              <textarea 
                className="pill-textarea" 
                placeholder="Masukkan Keterangan" 
                rows={3}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div className="form-field upload-field">
              <label className="field-label">File Pendukung (opsional)</label>
              <button type="button" className="upload-btn" onClick={onPickFile} disabled={loading}>
                <div className="upload-icon">
                  {fileName ? <DocumentIcon className="w-5 h-5" /> : <CameraIcon className="w-5 h-5" />}
                </div>
                <span className="upload-text">
                  {fileName || "Pilih File"}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={onFileChange}
                style={{ display: "none" }}
              />
              {fileName && (
                <p className="file-info">File terpilih: {fileName}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="submit-section">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading || !alasan.trim()}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Mengirim...
                  </>
                ) : (
                  'Kirim Pengajuan'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* History Pengajuan */
        <div className="pengajuan-history">
          <h3 className="history-title">Riwayat Pengajuan Izin</h3>
          
          {userPengajuan.length === 0 ? (
            <div className="no-data">
              <p>Belum ada pengajuan izin</p>
            </div>
          ) : (
            <div className="history-list">
              {userPengajuan.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-header">
                    <div className="history-date">
                      <strong>{new Date(item.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}</strong>
                    </div>
                    <div className={`history-status ${getStatusClass(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span>{getStatusText(item.status)}</span>
                    </div>
                  </div>
                  
                  <div className="history-content">
                    <div className="history-field">
                      <strong>Alasan:</strong>
                      <p>{item.alasan}</p>
                    </div>
                    
                    {item.keterangan && (
                      <div className="history-field">
                        <strong>Keterangan:</strong>
                        <p>{item.keterangan}</p>
                      </div>
                    )}
                    
                    <div className="history-meta">
                      <small>Diajukan: {new Date(item.tanggal_pengajuan).toLocaleString('id-ID')}</small>
                      {item.tanggal_disetujui && (
                        <small>Diproses: {new Date(item.tanggal_disetujui).toLocaleString('id-ID')}</small>
                      )}
                    </div>
                    
                    {item.file_pendukung && (
                      <div className="history-file">
                        <a href={item.file_pendukung} target="_blank" rel="noopener noreferrer">
                          <DocumentIcon className="w-4 h-4" />
                          Lihat File Pendukung
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Helpers for segmented date input
function daysInMonth(y, m /* 1..12 */) {
  return new Date(y, m, 0).getDate();
}
function pad2(n) { return String(n).padStart(2, "0"); }

function SegmentedDateInput({ value, onChange }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(null); // 'd' | 'm' | 'y' | null

  // Close menu on outside click / Escape
  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(e.target)) return;
      setOpen(null);
    }
    function onKey(e) { if (e.key === "Escape") setOpen(null); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function setDay(d) { onChange({ d, m: value.m, y: value.y }); setOpen(null); }
  function setMonth(m) {
    const max = daysInMonth(value.y, m);
    const d = Math.min(value.d, max);
    onChange({ d, m, y: value.y });
    setOpen(null);
  }
  function setYear(y) {
    const max = daysInMonth(y, value.m);
    const d = Math.min(value.d, max);
    onChange({ d, m: value.m, y });
    setOpen(null);
  }

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const years = useMemo(() => {
    const cur = new Date().getFullYear();
    const arr = [];
    for (let y = 2000; y <= cur; y++) arr.push(y);
    return arr;
  }, []);

  return (
    <div className="seg-date-wrap" ref={wrapRef}>
      <div className="seg-date pill-input" onClick={() => open && setOpen(null)}>
        <button type="button" className={`seg ${open === 'd' ? 'open' : ''}`} onClick={(e)=>{ e.stopPropagation(); setOpen(open==='d'?null:'d'); }}>{pad2(value.d)}</button>
        <span className="sep">/</span>
        <button type="button" className={`seg ${open === 'm' ? 'open' : ''}`} onClick={(e)=>{ e.stopPropagation(); setOpen(open==='m'?null:'m'); }}>{pad2(value.m)}</button>
        <span className="sep">/</span>
        <button type="button" className={`seg ${open === 'y' ? 'open' : ''}`} onClick={(e)=>{ e.stopPropagation(); setOpen(open==='y'?null:'y'); }}>{value.y}</button>
      </div>

      {open === 'd' && (
        <div className="seg-menu days" role="listbox" aria-label="Pilih tanggal">
          {Array.from({ length: daysInMonth(value.y, value.m) }, (_, i) => i + 1).map((d) => (
            <button key={d} className={`opt ${d===value.d?'active':''}`} onClick={() => setDay(d)}>{pad2(d)}</button>
          ))}
        </div>
      )}

      {open === 'm' && (
        <div className="seg-menu months" role="listbox" aria-label="Pilih bulan">
          {months.map((label, idx) => (
            <button key={label} className={`opt ${idx+1===value.m?'active':''}`} onClick={() => setMonth(idx + 1)}>
              {pad2(idx + 1)} <span className="opt-sub">{label}</span>
            </button>
          ))}
        </div>
      )}

      {open === 'y' && (
        <div className="seg-menu years" role="listbox" aria-label="Pilih tahun">
          {years.map((y) => (
            <button key={y} className={`opt ${y===value.y?'active':''}`} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
      )}
    </div>
  );
}
