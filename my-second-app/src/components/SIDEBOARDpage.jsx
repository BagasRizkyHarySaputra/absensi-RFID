"use client";

import React from 'react';
import '../static/css/SIDEBOARDpage.css';

const SIDEBOARDpage = ({ activeSection, setActiveSection, className, style }) => {
  const menuSections = [
    {
      title: 'Analyze',
      items: [
        { id: 'dashboard', icon: '/Dashboard.svg', label: 'Dashboard' },
        { id: 'activity', icon: '/Activity.svg', label: 'Activity' },
        { id: 'reports', icon: '/Reports.svg', label: 'Reports' }
      ]
    },
    {
      title: 'Manage',
      items: [
        { id: 'classes', icon: '/Classes.svg', label: 'Classes' },
        { id: 'approvals', icon: '/Approvals.svg', label: 'Approvals' }
      ]
    }
  ];

  return (
    <aside className={`dashboard-sidebar ${className || ''}`} style={style}>
      <nav className="sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className="nav-section">
            <div className="nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <button 
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <img 
                  src={item.icon} 
                  alt={`${item.label} icon`}
                  className="nav-icon"
                />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default SIDEBOARDpage;
