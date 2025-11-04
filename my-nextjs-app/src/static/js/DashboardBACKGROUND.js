// Dashboard Background JavaScript Functionality

(function() {
  'use strict';

  // Background effects initialization
  const initializeDashboardBackground = () => {
    console.log('Dashboard Background JavaScript loaded');

    // Add dynamic background effects
    addParallaxEffect();
    addMouseInteraction();
    addResizeHandler();
  };

  // Parallax effect for background shapes
  const addParallaxEffect = () => {
    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const shapes = document.querySelectorAll('.ellipse-shape');
      
      shapes.forEach((shape, index) => {
        const speed = 0.1 + (index * 0.05); // Different speeds for each shape
        const yPos = -(scrolled * speed);
        shape.style.transform = `translateY(${yPos}px)`;
      });

      ticking = false;
    };

    const requestParallax = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', requestParallax, { passive: true });
  };

  // Mouse interaction for subtle movement
  const addMouseInteraction = () => {
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const updateMousePosition = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animateShapes = () => {
      targetX += (mouseX - targetX) * 0.02;
      targetY += (mouseY - targetY) * 0.02;

      const shapes = document.querySelectorAll('.ellipse-shape');
      shapes.forEach((shape, index) => {
        const multiplier = (index + 1) * 0.5;
        const moveX = (targetX - window.innerWidth / 2) * 0.01 * multiplier;
        const moveY = (targetY - window.innerHeight / 2) * 0.01 * multiplier;
        
        shape.style.transform += ` translate(${moveX}px, ${moveY}px)`;
      });

      requestAnimationFrame(animateShapes);
    };

    // Add mouse move event listener
    document.addEventListener('mousemove', updateMousePosition, { passive: true });
    
    // Start animation loop
    animateShapes();
  };

  // Handle window resize
  const addResizeHandler = () => {
    let resizeTimeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Recalculate positions on resize
        const shapes = document.querySelectorAll('.ellipse-shape');
        shapes.forEach(shape => {
          shape.style.transform = ''; // Reset transforms
        });
      }, 250);
    };

    window.addEventListener('resize', handleResize, { passive: true });
  };

  // Performance optimization: Reduce animations on low-end devices
  const optimizeForPerformance = () => {
    // Check if device prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Disable animations
      const style = document.createElement('style');
      style.textContent = `
        .ellipse-shape {
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Check for low-end device indicators
    const isLowEndDevice = navigator.hardwareConcurrency <= 2 || 
                          navigator.deviceMemory <= 2 ||
                          /Android.*Chrome\/[0-5]/.test(navigator.userAgent);

    if (isLowEndDevice) {
      // Reduce visual effects
      const shapes = document.querySelectorAll('.ellipse-shape');
      shapes.forEach(shape => {
        shape.style.filter = 'blur(30px)'; // Reduce blur
        shape.style.opacity = '0.4'; // Reduce opacity
      });
    }
  };

  // Accessibility improvements
  const addAccessibilityFeatures = () => {
    // Add screen reader friendly descriptions
    const backgroundShapes = document.querySelector('.background-shapes');
    if (backgroundShapes) {
      backgroundShapes.setAttribute('aria-hidden', 'true');
      backgroundShapes.setAttribute('role', 'presentation');
    }

    // Add focus management
    const backgroundContent = document.querySelector('.background-content');
    if (backgroundContent) {
      backgroundContent.setAttribute('role', 'main');
    }
  };

  // Theme support
  const addThemeSupport = () => {
    // Detect system theme preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDarkMode) {
      // Add dark mode adjustments if needed
      document.documentElement.style.setProperty('--background-opacity', '0.3');
    }

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.style.setProperty('--background-opacity', '0.3');
      } else {
        document.documentElement.style.setProperty('--background-opacity', '0.6');
      }
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeDashboardBackground();
      optimizeForPerformance();
      addAccessibilityFeatures();
      addThemeSupport();
    });
  } else {
    initializeDashboardBackground();
    optimizeForPerformance();
    addAccessibilityFeatures();
    addThemeSupport();
  }

  // Export for potential external use
  if (typeof window !== 'undefined') {
    window.DashboardBackground = {
      init: initializeDashboardBackground,
      optimize: optimizeForPerformance
    };
  }

})();