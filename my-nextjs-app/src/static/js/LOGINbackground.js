// Background animation and interaction handler

class BackgroundHandler {
  constructor() {
    this.ellipses = [];
    this.mousePosition = { x: 0, y: 0 };
    this.isInteractive = true;
    
    this.init();
  }

  init() {
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupEllipses();
        this.bindEvents();
        this.startAnimation();
      });
    }
  }

  setupEllipses() {
    // Get all ellipse elements
    this.ellipses = [
      {
        element: document.querySelector('.ellipse-pink'),
        originalPosition: { x: 10, y: 20 },
        speed: 0.5,
        direction: 1
      },
      {
        element: document.querySelector('.ellipse-blue'),
        originalPosition: { x: 70, y: 40 },
        speed: 0.3,
        direction: -1
      },
      {
        element: document.querySelector('.ellipse-purple'),
        originalPosition: { x: 20, y: 70 },
        speed: 0.4,
        direction: 1
      },
      {
        element: document.querySelector('.ellipse-cyan'),
        originalPosition: { x: 65, y: 10 },
        speed: 0.6,
        direction: -1
      }
    ];
  }

  bindEvents() {
    // Mouse move interaction
    document.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });

    // Window resize handling
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Visibility change handling
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Touch events for mobile
    document.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e);
    });
  }

  handleMouseMove(e) {
    if (!this.isInteractive) return;

    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    this.mousePosition.x = (clientX / innerWidth) * 100;
    this.mousePosition.y = (clientY / innerHeight) * 100;
    
    this.updateEllipsesOnMouseMove();
  }

  handleTouchMove(e) {
    if (!this.isInteractive || !e.touches.length) return;

    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    const { innerWidth, innerHeight } = window;
    
    this.mousePosition.x = (clientX / innerWidth) * 100;
    this.mousePosition.y = (clientY / innerHeight) * 100;
    
    this.updateEllipsesOnMouseMove();
  }

  updateEllipsesOnMouseMove() {
    this.ellipses.forEach((ellipse, index) => {
      if (!ellipse.element) return;

      const intensity = 0.02; // How much the ellipses react to mouse
      const offsetX = (this.mousePosition.x - 50) * intensity * ellipse.direction;
      const offsetY = (this.mousePosition.y - 50) * intensity * ellipse.direction;
      
      const newX = ellipse.originalPosition.x + offsetX;
      const newY = ellipse.originalPosition.y + offsetY;
      
      ellipse.element.style.transform = `translate(${offsetX * 2}px, ${offsetY * 2}px)`;
    });
  }

  startAnimation() {
    this.animateEllipses();
  }

  animateEllipses() {
    let startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      
      this.ellipses.forEach((ellipse, index) => {
        if (!ellipse.element) return;

        // Create subtle floating motion
        const floatOffset = Math.sin(elapsed * ellipse.speed + index) * 10;
        const scaleVariation = 1 + Math.sin(elapsed * ellipse.speed * 0.5 + index) * 0.05;
        
        // Apply animation if not overridden by mouse interaction
        if (this.isInteractive) {
          const currentTransform = ellipse.element.style.transform || '';
          if (!currentTransform.includes('translate')) {
            ellipse.element.style.transform = `translateY(${floatOffset}px) scale(${scaleVariation})`;
          }
        }
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  handleResize() {
    // Recalculate positions on window resize
    this.setupEllipses();
  }

  handleVisibilityChange() {
    // Pause/resume animations when tab is not visible
    this.isInteractive = !document.hidden;
  }

  // Method to add new ellipse dynamically
  addEllipse(config) {
    const ellipse = document.createElement('div');
    ellipse.className = `gradient-ellipse ${config.className}`;
    ellipse.style.cssText = `
      width: ${config.width}px;
      height: ${config.height}px;
      background: ${config.background};
      top: ${config.top}%;
      left: ${config.left}%;
    `;
    
    const container = document.querySelector('.background-container');
    if (container) {
      container.appendChild(ellipse);
      
      this.ellipses.push({
        element: ellipse,
        originalPosition: { x: config.left, y: config.top },
        speed: config.speed || 0.5,
        direction: config.direction || 1
      });
    }
  }

  // Method to remove ellipse
  removeEllipse(className) {
    const ellipse = document.querySelector(`.${className}`);
    if (ellipse) {
      ellipse.remove();
      this.ellipses = this.ellipses.filter(e => e.element !== ellipse);
    }
  }

  // Method to change ellipse colors
  changeEllipseColor(className, newColor) {
    const ellipse = document.querySelector(`.${className}`);
    if (ellipse) {
      ellipse.style.background = newColor;
    }
  }

  // Method to toggle interactivity
  toggleInteractivity() {
    this.isInteractive = !this.isInteractive;
    
    if (!this.isInteractive) {
      // Reset all ellipses to original positions
      this.ellipses.forEach(ellipse => {
        if (ellipse.element) {
          ellipse.element.style.transform = '';
        }
      });
    }
  }

  // Method to create ripple effect on click
  createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'gradient-ellipse';
    ripple.style.cssText = `
      width: 50px;
      height: 50px;
      background: rgba(139, 92, 246, 0.3);
      left: ${x - 25}px;
      top: ${y - 25}px;
      animation: rippleEffect 1s ease-out forwards;
      pointer-events: none;
    `;
    
    const container = document.querySelector('.background-container');
    if (container) {
      container.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 1000);
    }
  }
}

// Add ripple effect CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleEffect {
      0% {
        transform: scale(0);
        opacity: 0.6;
      }
      100% {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize background handler
const backgroundHandler = new BackgroundHandler();

// Add click event for ripple effect
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    backgroundHandler.createRipple(e.clientX, e.clientY);
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundHandler;
}

// Global utility functions
window.BackgroundUtils = {
  addEllipse: (config) => backgroundHandler.addEllipse(config),
  removeEllipse: (className) => backgroundHandler.removeEllipse(className),
  changeColor: (className, color) => backgroundHandler.changeEllipseColor(className, color),
  toggleInteractivity: () => backgroundHandler.toggleInteractivity()
};
