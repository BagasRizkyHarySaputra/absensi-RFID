// DASHBOARDtable.js

/**
 * Dashboard Table JavaScript Functions
 * Contains utility functions for the attendance table component
 */

// Table sorting functionality
export const sortTableData = (data, column, direction = 'asc') => {
  return [...data].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    // Handle different data types
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

// Pagination functionality
export const paginateData = (data, currentPage, itemsPerPage = 6) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
};

// Calculate total pages
export const calculateTotalPages = (totalItems, itemsPerPage = 6) => {
  return Math.ceil(totalItems / itemsPerPage);
};

// Filter data by status
export const filterByStatus = (data, status) => {
  if (!status || status === 'all') {
    return data;
  }
  return data.filter(item => item.status === status);
};

// Search functionality
export const searchData = (data, searchTerm) => {
  if (!searchTerm) return data;
  
  const term = searchTerm.toLowerCase();
  return data.filter(item => 
    item.name.toLowerCase().includes(term) ||
    item.class.toLowerCase().includes(term) ||
    item.nis.includes(term) ||
    item.information.toLowerCase().includes(term)
  );
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Format time for display
export const formatTime = (timeString) => {
  return timeString; // Already in HH:MM format
};

// Export status information
export const getStatusInfo = (status) => {
  const statusMap = {
    accepted: {
      text: 'Accepted ✓',
      class: 'accepted',
      color: '#065F46'
    },
    declined: {
      text: 'Declined ✗',
      class: 'declined',
      color: '#991B1B'
    }
  };
  
  return statusMap[status] || statusMap.declined;
};

// Utility function to debounce search input
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Initialize table functionality
export const initializeTable = () => {
  console.log('Dashboard table initialized');
  
  // Add any initialization logic here
  // For example, setting up event listeners for sorting, etc.
  
  return {
    sortTableData,
    paginateData,
    calculateTotalPages,
    filterByStatus,
    searchData,
    formatDate,
    formatTime,
    getStatusInfo,
    debounce
  };
};
