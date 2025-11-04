"use client";

import React, { useEffect, useState } from 'react';
import '../static/css/Classes.css';
import HEADERINpage from './HEADERINpage';
import ClassDetail from './ClassDetail';

const Classes = () => {
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    // Load any additional JavaScript functionality
    const loadClassesJS = async () => {
      try {
        await import('../static/js/Classes.js');
      } catch (error) {
        console.log('Classes.js not found or empty');
      }
    };
    loadClassesJS();
  }, []);

  const classes = [
    { id: 1, name: 'XI SIJA 1', avatar: '👩‍🎓' },
    { id: 2, name: 'XI SIJA 2', avatar: '👨‍🎓' },
    { id: 3, name: 'XI SIJA 3', avatar: '👩‍💼' }
  ];

  const handleClassClick = (classItem) => {
    setSelectedClass(classItem);
  };

  const handleBack = () => {
    setSelectedClass(null);
  };

  // Show detail page if a class is selected
  if (selectedClass) {
    return <ClassDetail classData={selectedClass} onBack={handleBack} />;
  }

  // Show class list
  return (
    <div className="classes-page">
      <HEADERINpage title="Classes" />
      
      <div className="classes-content">
        <div className="classes-grid">
          {classes.map((classItem) => (
            <div 
              key={classItem.id} 
              className="class-card"
              onClick={() => handleClassClick(classItem)}
            >
              <div className="class-avatar">
                <span className="avatar-icon">{classItem.avatar}</span>
              </div>
              <h3 className="class-name">{classItem.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Classes;