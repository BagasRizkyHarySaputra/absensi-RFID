// Header JavaScript Functions
// This file contains utility functions for the header component

class HeaderUtils {
  // Format time for display
  static formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // Format date for display
  static formatDate(date) {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get current time and date
  static getCurrentDateTime() {
    return new Date();
  }

  // Update time display every second
  static startTimeUpdater(updateCallback) {
    const updateTime = () => {
      if (updateCallback && typeof updateCallback === 'function') {
        updateCallback(this.getCurrentDateTime());
      }
    };

    // Update immediately
    updateTime();

    // Update every second
    const timer = setInterval(updateTime, 1000);

    // Return cleanup function
    return () => {
      clearInterval(timer);
    };
  }

  // Notification management
  static getNotificationCount() {
    try {
      return parseInt(localStorage.getItem('notification-count') || '0');
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  static setNotificationCount(count) {
    try {
      localStorage.setItem('notification-count', count.toString());
      this.updateNotificationBadge();
      return true;
    } catch (error) {
      console.error('Error setting notification count:', error);
      return false;
    }
  }

  static incrementNotificationCount() {
    const currentCount = this.getNotificationCount();
    this.setNotificationCount(currentCount + 1);
  }

  static clearNotifications() {
    this.setNotificationCount(0);
  }

  // Update notification badge in UI
  static updateNotificationBadge() {
    const count = this.getNotificationCount();
    const notificationBtn = document.querySelector('.header-action-btn[title="Notifications"]');
    
    if (notificationBtn) {
      if (count > 0) {
        notificationBtn.classList.add('has-notification');
        notificationBtn.setAttribute('data-count', count);
      } else {
        notificationBtn.classList.remove('has-notification');
        notificationBtn.removeAttribute('data-count');
      }
    }
  }

  // Handle notification click
  static handleNotificationClick() {
    console.log('Notifications clicked');
    // Here you can implement notification panel logic
    this.clearNotifications();
  }

  // Handle more options click
  static handleMoreOptionsClick() {
    console.log('More options clicked');
    // Here you can implement more options menu logic
  }

  // Handle profile click
  static handleProfileClick() {
    console.log('Profile clicked');
    // Here you can implement profile menu logic
  }

  // User session management
  static getUserInfo() {
    try {
      const userInfo = localStorage.getItem('user-info');
      return userInfo ? JSON.parse(userInfo) : {
        name: 'Admin',
        role: 'Administrator',
        email: 'admin@gmail.com'
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return {
        name: 'Admin',
        role: 'Administrator',
        email: 'admin@gmail.com'
      };
    }
  }

  static setUserInfo(userInfo) {
    try {
      localStorage.setItem('user-info', JSON.stringify(userInfo));
      return true;
    } catch (error) {
      console.error('Error setting user info:', error);
      return false;
    }
  }

  // Logout functionality
  static handleLogout(onLogout) {
    try {
      // Clear user session data
      localStorage.removeItem('user-info');
      localStorage.removeItem('dashboard-active-section');
      localStorage.removeItem('notification-count');
      
      // Call logout callback
      if (onLogout && typeof onLogout === 'function') {
        onLogout();
      }
      
      console.log('User logged out successfully');
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  // Theme support
  static getTheme() {
    try {
      return localStorage.getItem('header-theme') || 'light';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light';
    }
  }

  static setTheme(theme) {
    try {
      localStorage.setItem('header-theme', theme);
      this.applyTheme(theme);
      return true;
    } catch (error) {
      console.error('Error setting theme:', error);
      return false;
    }
  }

  static applyTheme(theme) {
    const header = document.querySelector('.dashboard-header');
    if (header) {
      header.setAttribute('data-theme', theme);
    }
  }

  // Initialize header
  static initializeHeader() {
    // Apply saved theme
    const theme = this.getTheme();
    this.applyTheme(theme);

    // Update notification badge
    this.updateNotificationBadge();

    // Add event listeners
    this.addEventListeners();

    return {
      theme,
      userInfo: this.getUserInfo(),
      notificationCount: this.getNotificationCount()
    };
  }

  // Add event listeners
  static addEventListeners() {
    // Notification button
    const notificationBtn = document.querySelector('.header-action-btn[title="Notifications"]');
    if (notificationBtn) {
      notificationBtn.addEventListener('click', this.handleNotificationClick.bind(this));
    }

    // More options button
    const moreBtn = document.querySelector('.header-action-btn[title="More Options"]');
    if (moreBtn) {
      moreBtn.addEventListener('click', this.handleMoreOptionsClick.bind(this));
    }

    // Profile button
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', this.handleProfileClick.bind(this));
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const userProfile = document.querySelector('.user-profile');
      if (userProfile && !userProfile.contains(event.target)) {
        // Optional: hide dropdown if implementing manual show/hide
      }
    });
  }

  // Search functionality (for future implementation)
  static handleSearch(query) {
    console.log('Search query:', query);
    // Implement search logic here
  }

  // Breadcrumb management
  static generateBreadcrumb(currentSection) {
    const breadcrumbMap = {
      'dashboard': ['Dashboard'],
      'activity': ['Activity'],
      'reports': ['Reports'],
      'classes': ['Classes'],
      'approvals': ['Approvals']
    };

    return breadcrumbMap[currentSection] || ['Dashboard'];
  }

  // Responsive behavior
  static handleResize() {
    const width = window.innerWidth;
    const header = document.querySelector('.dashboard-header');
    
    if (header) {
      if (width < 768) {
        header.classList.add('mobile');
      } else {
        header.classList.remove('mobile');
      }
    }
  }

  // Initialize resize handler
  static initializeResize() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Return cleanup function
    return () => {
      window.removeEventListener('resize', this.handleResize.bind(this));
    };
  }

  // Analytics tracking
  static trackHeaderInteraction(action, element) {
    try {
      const interaction = {
        action,
        element,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      // Store in localStorage for now (replace with real analytics)
      const interactions = JSON.parse(localStorage.getItem('header-interactions') || '[]');
      interactions.push(interaction);
      
      // Keep only last 100 interactions
      if (interactions.length > 100) {
        interactions.splice(0, interactions.length - 100);
      }
      
      localStorage.setItem('header-interactions', JSON.stringify(interactions));
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeaderUtils;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.HeaderUtils = HeaderUtils;
}
