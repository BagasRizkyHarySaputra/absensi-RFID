// Login Page JavaScript Functions

class LoginPageHandler {
  constructor() {
    this.formData = {
      username: '',
      password: '',
      rememberMe: false
    };
    this.isLoading = false;
    this.showPassword = false;
    
    this.init();
  }

  init() {
    // Initialize event listeners when DOM is ready
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', () => {
        this.bindEvents();
        this.loadSavedCredentials();
      });
    }
  }

  bindEvents() {
    // Form submission
    const form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Password toggle
    const passwordToggle = document.getElementById('passwordToggle');
    if (passwordToggle) {
      passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
    }

    // Input changes
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember-me');

    if (usernameInput) {
      usernameInput.addEventListener('input', (e) => this.handleInputChange('username', e.target.value));
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', (e) => this.handleInputChange('password', e.target.value));
    }

    if (rememberCheckbox) {
      rememberCheckbox.addEventListener('change', (e) => this.handleInputChange('rememberMe', e.target.checked));
    }

    // Enter key handling
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const form = document.getElementById('loginForm');
        if (form) {
          this.handleSubmit(e);
        }
      }
    });
  }

  handleInputChange(field, value) {
    this.formData[field] = value;
    this.validateForm();
  }

  validateForm() {
    const submitButton = document.getElementById('submitButton');
    const isValid = this.formData.username.trim() !== '' && this.formData.password.trim() !== '';
    
    if (submitButton) {
      submitButton.disabled = !isValid || this.isLoading;
    }
    
    return isValid;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    
    if (passwordInput) {
      passwordInput.type = this.showPassword ? 'text' : 'password';
    }
    
    if (passwordToggle) {
      const icon = passwordToggle.querySelector('svg');
      if (icon) {
        // Update icon based on visibility state
        icon.style.opacity = this.showPassword ? '0.6' : '0.4';
      }
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm() || this.isLoading) {
      return;
    }

    this.setLoadingState(true);

    try {
      // Simulate API call
      const result = await this.authenticateUser(this.formData);
      
      if (result.success) {
        this.handleLoginSuccess(result);
      } else {
        this.handleLoginError(result.message);
      }
    } catch (error) {
      this.handleLoginError('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      this.setLoadingState(false);
    }
  }

  async authenticateUser(credentials) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock authentication logic
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      return {
        success: true,
        user: {
          id: 1,
          username: credentials.username,
          role: 'admin'
        },
        token: 'mock-jwt-token'
      };
    } else if (credentials.username === 'user' && credentials.password === 'user123') {
      return {
        success: true,
        user: {
          id: 2,
          username: credentials.username,
          role: 'user'
        },
        token: 'mock-jwt-token'
      };
    } else {
      return {
        success: false,
        message: 'Username atau password salah'
      };
    }
  }

  setLoadingState(loading) {
    this.isLoading = loading;
    const submitButton = document.getElementById('submitButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (submitButton) {
      submitButton.disabled = loading;
    }
    
    if (buttonText) {
      buttonText.textContent = loading ? 'Memproses...' : 'Masuk';
    }
    
    if (loadingSpinner) {
      loadingSpinner.style.display = loading ? 'inline-block' : 'none';
    }
  }

  handleLoginSuccess(result) {
    console.log('Login berhasil:', result);
    
    // Save credentials if remember me is checked
    if (this.formData.rememberMe) {
      this.saveCredentials();
    } else {
      this.clearSavedCredentials();
    }
    
    // Save token to localStorage
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    // Show success message
    this.showMessage('Login berhasil! Mengalihkan...', 'success');
    
    // Redirect to dashboard after delay
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
  }

  handleLoginError(message) {
    console.error('Login gagal:', message);
    this.showMessage(message, 'error');
    
    // Clear password field
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.focus();
    }
    
    this.formData.password = '';
  }

  showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('loginMessage');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'loginMessage';
      messageEl.className = 'login-message';
      
      const form = document.getElementById('loginForm');
      if (form) {
        form.insertBefore(messageEl, form.firstChild);
      }
    }
    
    messageEl.textContent = message;
    messageEl.className = `login-message ${type}`;
    messageEl.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      if (messageEl) {
        messageEl.style.display = 'none';
      }
    }, 5000);
  }

  saveCredentials() {
    if (this.formData.rememberMe) {
      localStorage.setItem('savedUsername', this.formData.username);
      localStorage.setItem('rememberMe', 'true');
    }
  }

  loadSavedCredentials() {
    const savedUsername = localStorage.getItem('savedUsername');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedUsername && rememberMe) {
      const usernameInput = document.getElementById('username');
      const rememberCheckbox = document.getElementById('remember-me');
      
      if (usernameInput) {
        usernameInput.value = savedUsername;
        this.formData.username = savedUsername;
      }
      
      if (rememberCheckbox) {
        rememberCheckbox.checked = true;
        this.formData.rememberMe = true;
      }
    }
  }

  clearSavedCredentials() {
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('rememberMe');
  }

  // Utility function to check if user is already logged in
  static isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Utility function to logout
  static logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Utility function to get current user
  static getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Initialize login handler
const loginHandler = new LoginPageHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoginPageHandler;
}

// Global utility functions
window.LoginUtils = {
  isAuthenticated: LoginPageHandler.isAuthenticated,
  logout: LoginPageHandler.logout,
  getCurrentUser: LoginPageHandler.getCurrentUser
};
