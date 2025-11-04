// Sidebar JavaScript Functions
// This file contains utility functions for the sidebar component

class SidebarUtils {
  // Get all available menu items
  static getMenuItems() {
    return [
      { 
        id: 'dashboard', 
        icon: '/Dashboard.svg', 
        label: 'Dashboard',
        section: 'Analyze',
        description: 'Dashboard overview with statistics and recent activity'
      },
      { 
        id: 'activity', 
        icon: '/Activity.svg', 
        label: 'Activity',
        section: 'Analyze',
        description: 'View student activity and attendance logs'
      },
      { 
        id: 'reports', 
        icon: '/Reports.svg', 
        label: 'Reports',
        section: 'Analyze',
        description: 'Generate and view attendance reports'
      },
      { 
        id: 'classes', 
        icon: '/Classes.svg', 
        label: 'Classes',
        section: 'Manage',
        description: 'Manage classes and student groups'
      },
      { 
        id: 'approvals', 
        icon: '/Approvals.svg', 
        label: 'Approvals',
        section: 'Manage',
        description: 'Review and approve attendance requests'
      }
    ];
  }

  // Save active section to localStorage
  static saveActiveSection(sectionId) {
    try {
      localStorage.setItem('dashboard-active-section', sectionId);
      return true;
    } catch (error) {
      console.error('Error saving active section:', error);
      return false;
    }
  }

  // Get active section from localStorage
  static getActiveSection() {
    try {
      return localStorage.getItem('dashboard-active-section') || 'dashboard';
    } catch (error) {
      console.error('Error getting active section:', error);
      return 'dashboard';
    }
  }

  // Validate if section exists
  static isValidSection(sectionId) {
    const menuItems = this.getMenuItems();
    return menuItems.some(item => item.id === sectionId);
  }

  // Get section info by ID
  static getSectionInfo(sectionId) {
    const menuItems = this.getMenuItems();
    return menuItems.find(item => item.id === sectionId) || null;
  }

  // Handle section change with validation
  static handleSectionChange(sectionId, setActiveSection, callback = null) {
    if (this.isValidSection(sectionId)) {
      setActiveSection(sectionId);
      this.saveActiveSection(sectionId);
      
      // Optional callback for additional actions
      if (callback && typeof callback === 'function') {
        callback(sectionId);
      }
      
      return true;
    }
    return false;
  }

  // Get section breadcrumb
  static getSectionBreadcrumb(sectionId) {
    const section = this.getSectionInfo(sectionId);
    return section ? [
      { label: 'Dashboard', path: '/' },
      { label: section.label, path: `/${sectionId}` }
    ] : [];
  }

  // Check if sidebar should be collapsed on mobile
  static shouldCollapse() {
    return window.innerWidth < 768;
  }

  // Initialize sidebar state
  static initializeSidebar() {
    const activeSection = this.getActiveSection();
    const shouldCollapse = this.shouldCollapse();
    
    return {
      activeSection,
      collapsed: shouldCollapse
    };
  }

  // Add keyboard navigation support
  static addKeyboardNavigation(setActiveSection) {
    const handleKeyDown = (event) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const menuItems = this.getMenuItems();
      const currentIndex = menuItems.findIndex(item => 
        item.id === this.getActiveSection()
      );

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % menuItems.length;
          this.handleSectionChange(menuItems[nextIndex].id, setActiveSection);
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
          this.handleSectionChange(menuItems[prevIndex].id, setActiveSection);
          break;
          
        case 'Home':
          event.preventDefault();
          this.handleSectionChange('dashboard', setActiveSection);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }

  // Generate sidebar analytics
  static generateAnalytics() {
    const visits = this.getFromLocalStorage('sidebar-visits') || {};
    const currentSection = this.getActiveSection();
    
    // Increment visit count
    visits[currentSection] = (visits[currentSection] || 0) + 1;
    
    this.saveToLocalStorage('sidebar-visits', visits);
    
    return visits;
  }

  // Helper: Save to localStorage
  static saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  // Helper: Get from localStorage
  static getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // Theme support for sidebar
  static applySidebarTheme(theme = 'light') {
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebar) {
      sidebar.setAttribute('data-theme', theme);
    }
  }

  // Search functionality for menu items
  static searchMenuItems(query) {
    if (!query) return this.getMenuItems();
    
    const lowerQuery = query.toLowerCase();
    return this.getMenuItems().filter(item => 
      item.label.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarUtils;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.SidebarUtils = SidebarUtils;
}
