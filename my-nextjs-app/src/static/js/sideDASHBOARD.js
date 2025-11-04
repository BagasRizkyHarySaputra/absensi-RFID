// Sidebar Dashboard JavaScript functionality

class SidebarHandler {
  constructor() {
    this.isMobile = false;
    this.isOpen = false;
    this.activeMenuItem = 'dashboard';
    
    this.init();
  }

  init() {
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', () => {
        this.checkMobile();
        this.bindEvents();
        this.setActiveMenuItem();
        this.setupResponsive();
      });
    }
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
    this.updateSidebarState();
  }

  bindEvents() {
    // Toggle button for mobile
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleSidebar());
    }

    // Overlay click to close sidebar
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeSidebar());
    }

    // Navigation menu items
    const navItems = document.querySelectorAll('.sidebar-nav-link');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => this.handleNavClick(e));
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Window resize
    window.addEventListener('resize', () => this.handleResize());

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => this.handleOutsideClick(e));
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    this.updateSidebarState();
  }

  openSidebar() {
    this.isOpen = true;
    this.updateSidebarState();
  }

  closeSidebar() {
    this.isOpen = false;
    this.updateSidebarState();
  }

  updateSidebarState() {
    const sidebar = document.getElementById('sidebar-container');
    const overlay = document.getElementById('sidebar-overlay');
    const mainContent = document.querySelector('.main-content');

    if (!sidebar) return;

    if (this.isMobile) {
      // Mobile behavior
      if (this.isOpen) {
        sidebar.classList.remove('mobile-hidden');
        sidebar.classList.add('mobile-visible');
        if (overlay) overlay.classList.add('active');
      } else {
        sidebar.classList.add('mobile-hidden');
        sidebar.classList.remove('mobile-visible');
        if (overlay) overlay.classList.remove('active');
      }
    } else {
      // Desktop behavior
      sidebar.classList.remove('mobile-hidden', 'mobile-visible');
      if (overlay) overlay.classList.remove('active');
      
      if (mainContent) {
        mainContent.classList.toggle('sidebar-hidden', !this.isOpen);
      }
    }
  }

  handleNavClick(e) {
    e.preventDefault();
    
    const clickedItem = e.currentTarget;
    const menuId = clickedItem.getAttribute('data-menu');
    
    if (menuId) {
      this.setActiveMenuItem(menuId);
      this.navigateToPage(menuId);
    }

    // Close sidebar on mobile after navigation
    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  setActiveMenuItem(menuId = null) {
    if (menuId) {
      this.activeMenuItem = menuId;
    }

    // Remove active class from all items
    const navItems = document.querySelectorAll('.sidebar-nav-link');
    navItems.forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to current item
    const activeItem = document.querySelector(`[data-menu="${this.activeMenuItem}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }

  navigateToPage(menuId) {
    console.log(`Navigating to: ${menuId}`);
    
    // Handle navigation based on menu item
    switch (menuId) {
      case 'dashboard':
        this.showDashboardContent();
        break;
      case 'history':
        this.showHistoryContent();
        break;
      case 'kelas':
        this.showKelasContent();
        break;
      case 'pengajuan':
        this.showPengajuanContent();
        break;
      default:
        console.log('Unknown menu item:', menuId);
    }
    
    // Update URL without page reload (SPA behavior)
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', `/${menuId}`);
    }
  }

  showDashboardContent() {
    // Show dashboard content
    this.updateMainContent('Dashboard', 'Selamat datang di halaman dashboard');
  }

  showHistoryContent() {
    // Show history content
    this.updateMainContent('History', 'Riwayat absensi akan ditampilkan di sini');
  }

  showKelasContent() {
    // Show class management content
    this.updateMainContent('Kelas', 'Manajemen kelas akan ditampilkan di sini');
  }

  showPengajuanContent() {
    // Show submission content
    this.updateMainContent('Pengajuan', 'Form pengajuan akan ditampilkan di sini');
  }

  updateMainContent(title, description) {
    const contentArea = document.getElementById('main-content-area');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="content-header">
          <h1 class="content-title">${title}</h1>
          <p class="content-description">${description}</p>
        </div>
        <div class="content-body">
          <!-- Content for ${title} will be loaded here -->
          <div class="placeholder-content">
            <div class="placeholder-card">
              <h3>Coming Soon</h3>
              <p>Konten untuk ${title} sedang dalam pengembangan.</p>
            </div>
          </div>
        </div>
      `;
    }
  }

  handleKeyboard(e) {
    // ESC key to close sidebar on mobile
    if (e.key === 'Escape' && this.isMobile && this.isOpen) {
      this.closeSidebar();
    }
    
    // Alt + M to toggle sidebar
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      this.toggleSidebar();
    }
  }

  handleResize() {
    const wasMobile = this.isMobile;
    this.checkMobile();
    
    // If switching from mobile to desktop, ensure sidebar is visible
    if (wasMobile && !this.isMobile) {
      this.isOpen = true;
      this.updateSidebarState();
    }
  }

  handleOutsideClick(e) {
    const sidebar = document.getElementById('sidebar-container');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (this.isMobile && this.isOpen && sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn) {
      this.closeSidebar();
    }
  }

  setupResponsive() {
    // Initial setup based on screen size
    if (!this.isMobile) {
      this.isOpen = true;
    }
    this.updateSidebarState();
  }

  // Method to programmatically set active menu
  setActiveMenu(menuId) {
    this.setActiveMenuItem(menuId);
    this.navigateToPage(menuId);
  }

  // Method to get current active menu
  getActiveMenu() {
    return this.activeMenuItem;
  }

  // Method to check if sidebar is open
  isOpened() {
    return this.isOpen;
  }

  // Method to add badge to menu item
  addBadge(menuId, count) {
    const menuItem = document.querySelector(`[data-menu="${menuId}"]`);
    if (menuItem) {
      let badge = menuItem.querySelector('.nav-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-badge';
        menuItem.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  }

  // Method to remove badge from menu item
  removeBadge(menuId) {
    const menuItem = document.querySelector(`[data-menu="${menuId}"]`);
    if (menuItem) {
      const badge = menuItem.querySelector('.nav-badge');
      if (badge) {
        badge.remove();
      }
    }
  }
}

// Initialize sidebar handler
const sidebarHandler = new SidebarHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarHandler;
}

// Global utility functions
window.SidebarUtils = {
  toggle: () => sidebarHandler.toggleSidebar(),
  setActive: (menuId) => sidebarHandler.setActiveMenu(menuId),
  getActive: () => sidebarHandler.getActiveMenu(),
  isOpen: () => sidebarHandler.isOpened(),
  addBadge: (menuId, count) => sidebarHandler.addBadge(menuId, count),
  removeBadge: (menuId) => sidebarHandler.removeBadge(menuId)
};
