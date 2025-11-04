// Classes.js
// Additional JavaScript functionality for the Classes component

// Initialize classes functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeClasses();
});

function initializeClasses() {
  // Add any classes-specific JavaScript functionality here
  
  // Example: Add animation on page load
  const classesPage = document.querySelector('.classes-page');
  if (classesPage) {
    classesPage.style.opacity = '0';
    classesPage.style.transform = 'translateY(20px)';
    
    // Fade in animation
    setTimeout(() => {
      classesPage.style.transition = 'all 0.6s ease';
      classesPage.style.opacity = '1';
      classesPage.style.transform = 'translateY(0)';
    }, 100);
  }
  
  // Add development note animation
  animateDevelopmentNote();
}

function animateDevelopmentNote() {
  const developmentNote = document.querySelector('.development-note');
  if (developmentNote) {
    const listItems = developmentNote.querySelectorAll('li');
    
    listItems.forEach((item, index) => {
      setTimeout(() => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = 'all 0.4s ease';
        
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateX(0)';
        }, 50);
      }, index * 100);
    });
  }
}

// Export functions for use in React components if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeClasses,
    animateDevelopmentNote
  };
}
