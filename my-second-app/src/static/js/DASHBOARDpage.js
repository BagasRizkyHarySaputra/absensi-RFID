// Dashboard JavaScript Functions
// This file contains utility functions for the dashboard

class DashboardUtils {
  // Format time with Indonesian locale
  static formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Format date with Indonesian locale
  static formatDate(date) {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Calculate attendance percentage
  static calculateAttendanceRate(present, total) {
    return total > 0 ? ((present / total) * 100).toFixed(1) : 0;
  }

  // Generate random activity data (for demo purposes)
  static generateSampleActivity() {
    const names = [
      'Ahmad Rizki', 'Siti Nurhaliza', 'Budi Santoso', 'Maya Putri', 
      'Doni Prakoso', 'Rina Sari', 'Joko Widodo', 'Dewi Lestari'
    ];
    
    const actions = ['Check In', 'Check Out'];
    const statuses = ['present', 'late'];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: names[Math.floor(Math.random() * names.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      time: this.generateRandomTime(),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }));
  }

  // Generate random time for demo
  static generateRandomTime() {
    const hours = Math.floor(Math.random() * 12) + 7; // 7 AM to 6 PM
    const minutes = Math.floor(Math.random() * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Validate login credentials
  static validateLogin(username, password) {
    const validCredentials = {
      username: 'admin',
      password: 'admin123'
    };
    
    return username === validCredentials.username && 
           password === validCredentials.password;
  }

  // Get greeting based on time
  static getGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Selamat Pagi';
    } else if (hour < 17) {
      return 'Selamat Siang';
    } else {
      return 'Selamat Sore';
    }
  }

  // Generate dashboard statistics
  static generateStats() {
    const totalStudents = 1250;
    const presentToday = Math.floor(Math.random() * 200) + 1050; // Random between 1050-1250
    const absentToday = totalStudents - presentToday;
    const attendanceRate = this.calculateAttendanceRate(presentToday, totalStudents);
    
    return {
      totalStudents,
      presentToday,
      absentToday,
      attendanceRate: parseFloat(attendanceRate)
    };
  }

  // Export data to CSV (utility function)
  static exportToCSV(data, filename) {
    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(row => row.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Local storage utilities
  static saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  static getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // Theme utilities
  static setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.saveToLocalStorage('theme', theme);
  }

  static getTheme() {
    return this.getFromLocalStorage('theme') || 'light';
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardUtils;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.DashboardUtils = DashboardUtils;
}
