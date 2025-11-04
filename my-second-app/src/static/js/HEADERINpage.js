// HEADERINpage.js
// Additional JavaScript functionality for the header component

// Initialize header functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeHeader();
});

function initializeHeader() {
  // Add any header-specific JavaScript functionality here
  
  // Example: Add animation on page load
  const header = document.querySelector('.header-in-page');
  if (header) {
    header.style.opacity = '0';
    header.style.transform = 'translateY(-20px)';
    
    // Fade in animation
    setTimeout(() => {
      header.style.transition = 'all 0.6s ease';
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }, 100);
  }
  
  // Add hover effects
  addHoverEffects();
}

function addHoverEffects() {
  const header = document.querySelector('.header-in-page');
  if (header) {
    header.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
    });
    
    header.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    });
  }
}

// Export functions for use in React components if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeHeader,
    addHoverEffects
  };
}
