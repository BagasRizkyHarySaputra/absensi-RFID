// Approvals.js
// Additional JavaScript functionality for the Approvals component

// Initialize approvals functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeApprovals();
});

function initializeApprovals() {
  // Add any approvals-specific JavaScript functionality here
  
  // Example: Add animation on page load
  const approvalsPage = document.querySelector('.approvals-page');
  if (approvalsPage) {
    approvalsPage.style.opacity = '0';
    approvalsPage.style.transform = 'translateY(20px)';
    
    // Fade in animation
    setTimeout(() => {
      approvalsPage.style.transition = 'all 0.6s ease';
      approvalsPage.style.opacity = '1';
      approvalsPage.style.transform = 'translateY(0)';
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
    initializeApprovals,
    animateDevelopmentNote
  };
}