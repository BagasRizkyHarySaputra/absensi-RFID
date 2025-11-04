// Dashboard JavaScript functionality

class DashboardHandler {
  constructor() {
    this.currentUser = null;
    this.stats = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0
    };
    this.recentActivities = [];
    this.rfidStatus = 'connected';
    
    this.init();
  }

  init() {
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', () => {
        this.loadUserData();
        this.loadStats();
        this.loadRecentActivities();
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.checkRFIDStatus();
      });
    }
  }

  loadUserData() {
    // Get user data from localStorage or mock data
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    } else {
      // Mock user data for demonstration
      this.currentUser = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        role: 'Admin',
        email: 'admin@absensi.com'
      };
    }
    
    this.updateUserDisplay();
  }

  updateUserDisplay() {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const welcomeNameEl = document.getElementById('welcomeName');
    
    if (userNameEl) userNameEl.textContent = this.currentUser.name || this.currentUser.username;
    if (userRoleEl) userRoleEl.textContent = this.currentUser.role || 'User';
    if (welcomeNameEl) welcomeNameEl.textContent = this.currentUser.name || this.currentUser.username;
  }

  loadStats() {
    // Mock statistics data
    this.stats = {
      present: 45,
      absent: 5,
      late: 8,
      total: 58
    };
    
    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    const presentEl = document.getElementById('presentCount');
    const absentEl = document.getElementById('absentCount');
    const lateEl = document.getElementById('lateCount');
    const totalEl = document.getElementById('totalCount');
    
    if (presentEl) presentEl.textContent = this.stats.present;
    if (absentEl) absentEl.textContent = this.stats.absent;
    if (lateEl) lateEl.textContent = this.stats.late;
    if (totalEl) totalEl.textContent = this.stats.total;
  }

  loadRecentActivities() {
    // Mock recent activities
    this.recentActivities = [
      {
        id: 1,
        time: '08:30',
        user: 'John Doe',
        action: 'Masuk',
        type: 'checkin'
      },
      {
        id: 2,
        time: '08:25',
        user: 'Jane Smith',
        action: 'Masuk',
        type: 'checkin'
      },
      {
        id: 3,
        time: '08:20',
        user: 'Bob Johnson',
        action: 'Masuk (Terlambat)',
        type: 'late'
      },
      {
        id: 4,
        time: '08:15',
        user: 'Alice Brown',
        action: 'Masuk',
        type: 'checkin'
      },
      {
        id: 5,
        time: '17:30',
        user: 'Mike Wilson',
        action: 'Keluar',
        type: 'checkout'
      }
    ];
    
    this.updateActivitiesDisplay();
  }

  updateActivitiesDisplay() {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;
    
    activitiesList.innerHTML = '';
    
    this.recentActivities.forEach(activity => {
      const listItem = document.createElement('li');
      listItem.className = 'activity-item';
      listItem.innerHTML = `
        <div class="activity-time">${activity.time}</div>
        <div class="activity-description">
          <div class="activity-user">${activity.user}</div>
          <div class="activity-action">${activity.action}</div>
        </div>
      `;
      activitiesList.appendChild(listItem);
    });
  }

  setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Quick action buttons
    const viewEmployeesBtn = document.getElementById('viewEmployeesBtn');
    const viewReportsBtn = document.getElementById('viewReportsBtn');
    const manualEntryBtn = document.getElementById('manualEntryBtn');
    
    if (viewEmployeesBtn) {
      viewEmployeesBtn.addEventListener('click', () => this.navigateToEmployees());
    }
    
    if (viewReportsBtn) {
      viewReportsBtn.addEventListener('click', () => this.navigateToReports());
    }
    
    if (manualEntryBtn) {
      manualEntryBtn.addEventListener('click', () => this.showManualEntryModal());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }
  }

  handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  }

  navigateToEmployees() {
    // Navigate to employees page
    console.log('Navigating to employees page...');
    // window.location.href = '/employees';
  }

  navigateToReports() {
    // Navigate to reports page
    console.log('Navigating to reports page...');
    // window.location.href = '/reports';
  }

  showManualEntryModal() {
    // Show manual entry modal
    console.log('Opening manual entry modal...');
    alert('Fitur input manual akan segera tersedia!');
  }

  refreshData() {
    console.log('Refreshing dashboard data...');
    this.loadStats();
    this.loadRecentActivities();
    this.checkRFIDStatus();
    
    // Show refresh feedback
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      const originalText = refreshBtn.textContent;
      refreshBtn.textContent = 'Memperbarui...';
      refreshBtn.disabled = true;
      
      setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
      }, 1000);
    }
  }

  startRealTimeUpdates() {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
      this.simulateNewActivity();
      this.updateStats();
    }, 30000);
  }

  simulateNewActivity() {
    const names = ['Alex Johnson', 'Sarah Wilson', 'Mike Brown', 'Lisa Davis', 'Tom Anderson'];
    const actions = ['Masuk', 'Keluar', 'Masuk (Terlambat)'];
    const types = ['checkin', 'checkout', 'late'];
    
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const newActivity = {
      id: Date.now(),
      time: `${hours}:${minutes}`,
      user: randomName,
      action: randomAction,
      type: randomType
    };
    
    // Add to beginning of array and limit to 10 items
    this.recentActivities.unshift(newActivity);
    this.recentActivities = this.recentActivities.slice(0, 10);
    
    this.updateActivitiesDisplay();
    this.showNotification(`${randomName} - ${randomAction}`);
  }

  updateStats() {
    // Simulate stats updates
    const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    this.stats.present = Math.max(0, this.stats.present + variation);
    this.stats.total = this.stats.present + this.stats.absent + this.stats.late;
    
    this.updateStatsDisplay();
  }

  checkRFIDStatus() {
    // Simulate RFID status check
    const statusDot = document.getElementById('rfidStatusDot');
    const statusText = document.getElementById('rfidStatusText');
    
    if (statusDot && statusText) {
      const isConnected = Math.random() > 0.1; // 90% chance of being connected
      
      if (isConnected) {
        statusDot.style.background = '#10b981';
        statusText.textContent = 'RFID Reader Terhubung';
        this.rfidStatus = 'connected';
      } else {
        statusDot.style.background = '#ef4444';
        statusText.textContent = 'RFID Reader Terputus';
        this.rfidStatus = 'disconnected';
      }
    }
  }

  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></div>
        <div>
          <div style="font-weight: 500; color: #1f2937;">Aktivitas Baru</div>
          <div style="font-size: 0.875rem; color: #6b7280;">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Method to export data
  exportData(type) {
    console.log(`Exporting ${type} data...`);
    // Implement export functionality
  }

  // Method to get dashboard summary
  getSummary() {
    return {
      user: this.currentUser,
      stats: this.stats,
      rfidStatus: this.rfidStatus,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Add CSS for notifications
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize dashboard
const dashboardHandler = new DashboardHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardHandler;
}

// Global utility functions
window.DashboardUtils = {
  refreshData: () => dashboardHandler.refreshData(),
  exportData: (type) => dashboardHandler.exportData(type),
  getSummary: () => dashboardHandler.getSummary()
};