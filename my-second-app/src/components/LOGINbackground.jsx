import React from 'react';
import '../static/css/LOGINbackground.css';

const LOGINbackground = () => {
  return (
    <div className="login-background">
      {/* Layer noise/bintik-bintik */}
      <div className="noise-layer"></div>
      
      {/* Bulan */}
      <div className="moon"></div>
      
      {/* Bintang-bintang */}
      <div className="stars">
        <div className="star star-1"></div>
        <div className="star star-2"></div>
        <div className="star star-3"></div>
        <div className="star star-4"></div>
        <div className="star star-5"></div>
        <div className="star star-6"></div>
      </div>
      
      {/* 3 Gunung depan dengan posisi berbeda */}
      <div className="front-mountain-1"></div>
      <div className="front-mountain-2"></div>
      <div className="front-mountain-3"></div>
    </div>
  );
};

export default LOGINbackground;
