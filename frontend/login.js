/**
 * Login Page JavaScript for Salyte Beacon
 * Handles authentication, form validation, and OAuth integration
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize login page functionality
    initializeLoginPage();
});

/**
 * Initialize all login page functionality
 */
function initializeLoginPage() {
    // Form validation and submission
    initializeFormValidation();
    
    // OAuth handlers
    initializeOAuthHandlers();
    
    // UI enhancements
    initializeUIEnhancements();
    
    // Remember me functionality
    initializeRememberMe();
    
    // Keyboard shortcuts
    initializeKeyboardShortcuts();
    
    console.log('Login page initialized successfully');
}

/**
 * Initialize form validation and submission
 */
function initializeFormValidation() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = loginForm.querySelector('.login-btn');
    
    // Real-time validation
    emailInput.addEventListener('input', validateEmail);
    emailInput.addEventListener('blur', validateEmail);
    
    passwordInput.addEventListener('input', validatePassword);
    passwordInput.addEventListener('blur', validatePassword);
    
    // Form submission
    loginForm.addEventListener('submit', handleFormSubmission);
    
    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            setFieldError(emailInput, 'Email is required');
            return false;
        } else if (!emailRegex.test(email)) {
            setFieldError(emailInput, 'Please enter a valid email address');
            return false;
        } else {
            setFieldSuccess(emailInput);
            return true;
        }
    }
    
    function validatePassword() {
        const password = passwordInput.value;
        
        if (!password) {
            setFieldError(passwordInput, 'Password is required');
            return false;
        } else if (password.length < 6) {
            setFieldError(passwordInput, 'Password must be at least 6 characters long');
            return false;
        } else {
            setFieldSuccess(passwordInput);
            return true;
        }
    }
    
    function handleFormSubmission(e) {
        e.preventDefault();
        
        // Validate all fields
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            showNotification('Please correct the errors above', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(submitButton, true);
        
        // Simulate API call
        authenticateUser(emailInput.value, passwordInput.value);
    }
}

/**
 * Set field error state
 */
function setFieldError(field, message) {
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
    
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.textContent = message;
    }
}

/**
 * Set field success state
 */
function setFieldSuccess(field) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
}

/**
 * Authenticate user (mock API call)
 */
async function authenticateUser(email, password) {
    try {
        // Show loading modal
        const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        loadingModal.show();
        
        // Mock API call
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (response.ok) {
            const data = await response.json();
            
            // Store authentication token (if remember me is checked)
            const rememberMe = document.getElementById('rememberMe').checked;
            if (rememberMe) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userEmail', email);
            } else {
                sessionStorage.setItem('authToken', data.token);
            }
            
            // Hide loading modal
            loadingModal.hide();
            
            // Success notification
            showNotification('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } else {
            throw new Error('Invalid credentials');
        }
        
    } catch (error) {
        // Hide loading modal
        const loadingModal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (loadingModal) loadingModal.hide();
        
        // Reset loading state
        const submitButton = document.querySelector('.login-btn');
        setLoadingState(submitButton, false);
        
        // Show error
        if (error.message === 'Invalid credentials') {
            showNotification('Invalid email or password. Please try again.', 'error');
        } else {
            showNotification('Login failed. Please check your connection and try again.', 'error');
        }
        
        console.error('Authentication error:', error);
    }
}

/**
 * Initialize OAuth handlers
 */
function initializeOAuthHandlers() {
    // Google OAuth is handled by onclick attribute in HTML
    // Phone login is handled by onclick attribute in HTML
}

/**
 * Handle Google OAuth login
 */
function handleGoogleLogin() {
    showNotification('Google OAuth integration coming soon!', 'info');
    
    // Mock Google OAuth flow
    console.log('Initiating Google OAuth...');
    
    // In a real implementation, you would:
    // 1. Initialize Google OAuth client
    // 2. Handle OAuth flow
    // 3. Exchange authorization code for tokens
    // 4. Authenticate with your backend
    
    // Mock implementation
    setTimeout(() => {
        showNotification('Google login is currently in development', 'warning');
    }, 1000);
}

/**
 * Handle phone number login
 */
function handlePhoneLogin() {
    // Create phone login modal
    const phoneModal = createPhoneLoginModal();
    const modal = new bootstrap.Modal(phoneModal);
    modal.show();
}

/**
 * Create phone login modal
 */
function createPhoneLoginModal() {
    const modalHTML = `
        <div class="modal fade" id="phoneLoginModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-phone me-2"></i>Login with Phone
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="phoneLoginForm">
                            <div class="mb-3">
                                <label for="phoneNumber" class="form-label">Phone Number</label>
                                <div class="input-group">
                                    <select class="form-select" style="max-width: 100px;">
                                        <option value="+254">+254</option>
                                        <option value="+1">+1</option>
                                        <option value="+44">+44</option>
                                    </select>
                                    <input type="tel" class="form-control" id="phoneNumber" 
                                           placeholder="700123456" required>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">
                                Send Verification Code
                            </button>
                        </form>
                        
                        <div id="verificationSection" class="mt-3" style="display: none;">
                            <div class="mb-3">
                                <label for="verificationCode" class="form-label">Verification Code</label>
                                <input type="text" class="form-control" id="verificationCode" 
                                       placeholder="123456" maxlength="6" required>
                            </div>
                            <button type="button" class="btn btn-success w-100" onclick="verifyPhoneCode()">
                                Verify & Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('phoneLoginModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form handler
    const phoneForm = document.getElementById('phoneLoginForm');
    phoneForm.addEventListener('submit', handlePhoneNumberSubmission);
    
    return document.getElementById('phoneLoginModal');
}

/**
 * Handle phone number submission
 */
function handlePhoneNumberSubmission(e) {
    e.preventDefault();
    
    const phoneNumber = document.getElementById('phoneNumber').value;
    if (!phoneNumber || phoneNumber.length < 9) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // Mock SMS sending
    showNotification('Verification code sent! (This is a demo)', 'success');
    document.getElementById('verificationSection').style.display = 'block';
}

/**
 * Verify phone code (mock)
 */
function verifyPhoneCode() {
    const code = document.getElementById('verificationCode').value;
    if (code === '123456') {
        showNotification('Phone verification successful!', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('phoneLoginModal'));
        modal.hide();
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        showNotification('Invalid verification code. Try 123456 for demo.', 'error');
    }
}

/**
 * Initialize UI enhancements
 */
function initializeUIEnhancements() {
    // Animate login card entrance
    const loginCard = document.querySelector('.login-card');
    loginCard.style.opacity = '0';
    loginCard.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        loginCard.style.transition = 'all 0.6s ease';
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0)';
    }, 100);
    
    // Add focus effects to form inputs
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.style.transform = 'scale(1)';
        });
    });
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('passwordToggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

/**
 * Initialize remember me functionality
 */
function initializeRememberMe() {
    // Load saved email if exists
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        document.getElementById('email').value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }
    
    // Auto-focus appropriate field
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (savedEmail) {
        passwordInput.focus();
    } else {
        emailInput.focus();
    }
}

/**
 * Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Enter key submits form
        if (e.key === 'Enter' && (e.target.matches('#email') || e.target.matches('#password'))) {
            const form = document.getElementById('loginForm');
            const submitEvent = new Event('submit');
            form.dispatchEvent(submitEvent);
        }
        
        // Escape key clears form
        if (e.key === 'Escape') {
            clearForm();
        }
        
        // Ctrl/Cmd + K focuses search (if implemented)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('email').focus();
        }
    });
}

/**
 * Clear form fields
 */
function clearForm() {
    const form = document.getElementById('loginForm');
    form.reset();
    
    // Remove validation classes
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });
}

/**
 * Set button loading state
 */
function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('btn-loading');
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing In...';
    } else {
        button.disabled = false;
        button.classList.remove('btn-loading');
        button.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Sign In';
    }
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast alert alert-${getAlertClass(type)} alert-dismissible fade show`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas ${getIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

/**
 * Get alert class for notification type
 */
function getAlertClass(type) {
    const classes = {
        success: 'success',
        error: 'danger',
        warning: 'warning',
        info: 'info'
    };
    return classes[type] || 'info';
}

/**
 * Get icon for notification type
 */
function getIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

/**
 * Handle forgotten password
 */
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('forgot-password')) {
        e.preventDefault();
        handleForgotPassword();
    }
});

function handleForgotPassword() {
    const email = document.getElementById('email').value;
    
    if (!email) {
        showNotification('Please enter your email address first', 'warning');
        document.getElementById('email').focus();
        return;
    }
    
    // Mock password reset
    showNotification(`Password reset link sent to ${email} (demo)`, 'success');
    
    // In a real implementation, you would call:
    // await fetch('/api/auth/forgot-password', { method: 'POST', ... })
}

/**
 * Handle social media login errors
 */
window.addEventListener('message', function(e) {
    if (e.origin !== window.location.origin) return;
    
    if (e.data.type === 'OAUTH_ERROR') {
        showNotification('Authentication failed. Please try again.', 'error');
    } else if (e.data.type === 'OAUTH_SUCCESS') {
        showNotification('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
});

/**
 * Form autofill detection and styling
 */
function detectAutofill() {
    const inputs = document.querySelectorAll('.form-control');
    
    inputs.forEach(input => {
        // Check for autofill on load
        setTimeout(() => {
            if (input.value) {
                input.classList.add('has-value');
            }
        }, 100);
        
        // Monitor for autofill changes
        input.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
}

/**
 * Handle network connectivity
 */
function handleNetworkStatus() {
    window.addEventListener('online', function() {
        showNotification('Connection restored', 'success');
    });
    
    window.addEventListener('offline', function() {
        showNotification('No internet connection. Please check your network.', 'warning');
    });
}

/**
 * Initialize all functionality when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    detectAutofill();
    handleNetworkStatus();
    
    // Add CSS for notifications and animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .fade-out {
            animation: fadeOut 0.3s ease forwards;
        }
        
        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        
        .form-floating > .form-control.has-value,
        .form-floating > .form-control:-webkit-autofill {
            padding-top: 1.625rem;
            padding-bottom: 0.625rem;
        }
        
        .form-floating > .form-control.has-value ~ label,
        .form-floating > .form-control:-webkit-autofill ~ label {
            opacity: 0.65;
            transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
        }
    `;
    document.head.appendChild(style);
});

/**
 * Analytics tracking (mock)
 */
function trackLoginAttempt(method = 'email') {
    console.log(`Login attempt tracked: ${method}`);
    
    // Mock analytics event
    if (window.gtag) {
        window.gtag('event', 'login_attempt', {
            method: method,
            page_location: window.location.href
        });
    }
}

/**
 * Security features
 */
function initializeSecurity() {
    // Detect if user is on mobile for biometric auth (future feature)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && 'credentials' in navigator) {
        // Add biometric login option (WebAuthn)
        console.log('Biometric authentication available');
    }
    
    // Rate limiting (client-side tracking)
    let loginAttempts = parseInt(sessionStorage.getItem('loginAttempts') || '0');
    
    document.getElementById('loginForm').addEventListener('submit', function() {
        loginAttempts++;
        sessionStorage.setItem('loginAttempts', loginAttempts.toString());
        
        if (loginAttempts > 5) {
            showNotification('Too many login attempts. Please wait before trying again.', 'error');
            setTimeout(() => {
                sessionStorage.removeItem('loginAttempts');
            }, 300000); // 5 minutes
        }
    });
}

// Initialize security features
document.addEventListener('DOMContentLoaded', initializeSecurity);