"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from '../hooks/useAuth';
import "../static/css/header.css";

// Header with greeting, right-side actions, and page title
const Header = ({ pageTitle = "Dashboard" }) => {
  const { user } = useAuth();
  const [openNotif, setOpenNotif] = useState(false);
  const actionsRef = useRef(null);
  const bellBtnRef = useRef(null);

  // Get user name from auth context
  const userName = user?.nama || user?.name || "Pengguna";
  const userRole = user?.role === 'admin' ? 'Administrator' : 'Siswa';

  // Close notification popover on outside click or Esc
  useEffect(() => {
    function onDocClick(e) {
      if (!actionsRef.current) return;
      if (!openNotif) return;
      if (!actionsRef.current.contains(e.target)) {
        setOpenNotif(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpenNotif(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openNotif]);

  return (
    <div className="app-page-header" role="banner">
      <div className="top-row">
        <div className="welcome-row">
          <span className="welcome-prefix">Hi,</span>{" "}
          <span className="welcome-name">{userName}</span>
          <span className="welcome-suffix">!&nbsp;Selamat Datang!</span>
          {user && (
            <div className="user-info">
              <span className="user-details">
                {user.kelas && ` - ${user.kelas}`}
                {user.role === 'admin' && ' (Administrator)'}
              </span>
            </div>
          )}
        </div>

        {/* Removed date & NIS section per request */}

        <div
          className="header-actions-minimal"
          aria-label="User actions"
          ref={actionsRef}
        >
          <button
            ref={bellBtnRef}
            className="icon-btn bell-btn"
            aria-label="Notifications"
            aria-haspopup="dialog"
            aria-expanded={openNotif}
            onClick={() => {
              setOpenNotif((v) => !v);
              // trigger bell shake animation
              const btn = bellBtnRef.current;
              if (btn) {
                btn.classList.remove("shake");
                // force reflow to restart animation
                // eslint-disable-next-line no-unused-expressions
                btn.offsetWidth;
                btn.classList.add("shake");
                // remove class after animation is expected to finish
                setTimeout(() => btn.classList.remove("shake"), 900);
              }
            }}
          >
            <Image 
              src="/notifikasi.svg" 
              alt="Notifications" 
              width={24} 
              height={24} 
              className="icon custom-header-icon"
            />
          </button>

          {/* Admin inline: user icon + plain text (uses auth user name) */}
          <span className="admin-inline" title={userName}>
            <Image 
              src="/account.svg" 
              alt="User Account" 
              width={24} 
              height={24} 
              className="admin-icon custom-header-icon"
            />
            <span className="admin-label">{userName}</span>
          </span>

          {openNotif && (
            <div className="notif-popover" role="dialog" aria-label="Notifications">
              <div className="notif-header">Notifikasi</div>
              <ul className="notif-list">
                <li className="notif-item">Tidak ada notifikasi baru</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="title-row">
        <span className="title-accent" aria-hidden></span>
        <h1 className="title-text">{pageTitle}</h1>
      </div>
    </div>
  );
};

export default Header;