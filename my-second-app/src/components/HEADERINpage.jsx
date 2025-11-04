"use client";

import React, { useEffect, useState } from 'react';
import '../static/css/HEADERINpage.css';

const HEADERINpage = ({ title = "Page Title" }) => {
  // Live time/date updates
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Load JavaScript functionality
    const loadHeaderJS = async () => {
      try {
        await import('../static/js/HEADERINpage.js');
      } catch (error) {
        console.log('HEADERINpage.js not found or empty');
      }
    };
    loadHeaderJS();

    // Update time every second
    const timeInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Format time and date
  const timeStr = now.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const dateStr = now.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="header-in-page">
      <h1 className="header-title">{title}</h1>
      <div className="header-meta">
        <div className="header-time">{timeStr}</div>
        <div className="header-date">{dateStr}</div>
      </div>
    </header>
  );
};

export default HEADERINpage;
