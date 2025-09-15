/**
 * Sign Up Page JavaScript for Salyte Beacon
 * Handles user registration, form validation, and password strength checking
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize signup page functionality
    initializeSignupPage();
});

/**
 * Initialize all signup page functionality
 */
function initializeSignupPage() {
    // Form validation and submission
    initializeFormValidation();
    
    // Password strength checking
    initializePasswordStrength();
    
    // OAuth handlers
    initializeOAuthHandlers();
    
    // UI enhancements
    initializeUIEnhancements();
    
    // Email availability checking
    initializeEmailValidation();
    
    // Terms and conditions
    initializeTermsHandlers();
    
    console.log('Signup page initialized successfully');
}

/**
 * Initialize form validation and submission
 */
function initializeFormValidation() {
    const signupForm = document.getElementById('signupForm');
    const inputs = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        role: document.getElementById('role'),
        location: document.getElementById('location'),
        agreeTerms: document.getElementById('agreeTerms')
    };
    
    // Add real-time validation listeners
    Object.keys(inputs).forEach(key => {
        if (inputs[key]) {
            inputs[key].addEventListener('input', () => validateField(key, inputs[key]));
            inputs[key].addEventListener('blur', () => validateField(key, inputs[key]));
        }
    });
    
    // Form submission handler
    signupForm.addEventListener('submit', handleFormSubmission);
    
    /**
     * Validate individual form fields
     */
    function validateField(fieldName, field) {
        let isValid = true;
        let message = '';
        
        switch (fieldName) {
            case 'firstName':
            case 'lastName':
                isValid = field.value.trim().length >= 2;
                message = `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(field.value.trim());
                message = 'Please enter a valid email address';
                if (isValid) {
                    checkEmailAvailability(field.value.trim());
                }
                break;
                
            case 'phone':
                if (field.value.trim()) {
                    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                    isValid = phoneRegex.test(field.value.replace(/\s/g, ''));
                    message = 'Please enter a valid phone number';
                }
                break;
                
            case 'password':
                isValid = field.value.length >= 8;
                message = 'Password must be at least 8 characters long';
                if (inputs.confirmPassword.value) {
                    validateField('confirmPassword', inputs.confirmPassword);
                }
                break;
                
            case 'confirmPassword':
                isValid = field.value === inputs.password.value;
                message = 'Passwords do not match';
                break;
                
            case 'role':
                isValid = field.value !== '';
                message = 'Please select your role';
                break;
                
            case 'agreeTerms':
                isValid = field.checked;
                message = 'You must agree to the terms and conditions';
                break;
        }
        
        // Apply validation styles
        if (fieldName === 'agreeTerms') {
            // Handle checkbox validation differently
            if (!isValid) {
                field.classList.add('is-invalid');
                showFieldError(field, message);
            } else {
                field.classList.remove('is-invalid');
                hideFieldError(field);
            }
        } else {
            if (field.value && isValid) {
                setFieldSuccess(field);
            } else if (field.value && !isValid) {
                setFieldError(field, message);
            } else {
                clearFieldValidation(field);
            }
        }
        
        return isValid;
    }
    
    /**
     * Handle form submission
     */
    function handleFormSubmission(e) {
        e.preventDefault();
        
        // Validate all fields
        let isFormValid = true;
        Object.keys(inputs).forEach(key => {
            if (inputs[key] && !validateField(key, inputs[key])) {
                isFormValid = false;
            }
        });
        
        if (!isFormValid) {
            showNotification('Please correct the errors above', 'error');
            scrollToFirstError();
            return;
        }
        
        // Check password strength
        const strengthLevel = getPasswordStrength(inputs.password.value);
        if (strengthLevel < 3) {
            showNotification('Please choose a stronger password', 'warning');
            inputs.password.focus();
            return;
        }
        
        // Submit form
        submitSignupForm(getFormData());
    }
    
    /**
     * Get form data
     */
    function getFormData() {
        return {
            firstName: inputs.firstName.value.trim(),
            lastName: inputs.lastName.value.trim(),
            email: inputs.email.value.trim(),
            phone: inputs.phone.value.trim(),
            password: inputs.password.value,
            role: inputs.role.value,
            location: inputs.location.value.trim(),
            newsletter: document.getElementById('newsletter').checked
        };
    }
}

/**
 * Initialize password strength checking
 */
function initializePasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = getPasswordStrength(password);
        updatePasswordStrengthUI(strength, password.length);
    });
    
    function updatePasswordStrengthUI(strength, length) {
        const strengthPercentage = (strength / 4) * 100;
        const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthClasses = ['strength-weak', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
        
        strengthFill.style.width = `${strengthPercentage}%`;
        strengthFill.className = `strength-fill ${strengthClasses[strength]}`;
        
        if (length === 0) {
            strengthText.textContent = 'Enter password';
            strengthText.className = 'strength-text';
        } else {
            strengthText.textContent = strengthLabels[strength];
            strengthText.className = `strength-text text-${strengthClasses[strength].replace('strength-', '')}`;
        }
    }
}

/**
 * Calculate password strength
 */
function getPasswordStrength(password) {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Common password patterns (reduce strength)
    const commonPatterns = [
        /^password/i,
        /^123456/,
        /^qwerty/i,
        /^admin/i,
        /^letmein/i
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password))) {
        strength = Math.max(0, strength - 2);
    }
    
    return Math.min(4, strength);
}

/**
 * Initialize OAuth handlers
 */
function initializeOAuthHandlers() {
    // OAuth handlers are defined globally for onclick attributes
    window.handleGoogleSignup = handleGoogleSignup;
    window.handlePhoneSignup = handlePhoneSignup;
}

/**
 * Handle Google OAuth signup
 */
function handleGoogleSignup() {
    showNotification('Google OAuth integration coming soon!', 'info');
    console.log('Initiating Google OAuth signup...');
    
    // Mock Google OAuth flow
    setTimeout(() => {
        showNotification('Google signup is currently in development', 'warning');
    }, 1000);
}

/**
 * Handle phone number signup
 */
function handlePhoneSignup() {
    // Redirect to phone login modal from login.js
    if (typeof handlePhoneLogin === 'function') {
        handlePhoneLogin();
    } else {
        showNotification('Phone signup feature coming soon!', 'info');
    }
}

/**
 * Check email availability
 */
function checkEmailAvailability(email) {
    // Debounce the email check
    clearTimeout(window.emailCheckTimeout);
    window.emailCheckTimeout = setTimeout(async () => {
        try {
            const response = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            const emailField = document.getElementById('email');
            
            if (data.available) {
                setFieldSuccess(emailField, 'Email is available');
            } else {
                setFieldError(emailField, 'This email is already registered');
            }
        } catch (error) {
            console.log('Email check failed:', error);
        }
    }, 500);
}

/**
 * Submit signup form
 */
async function submitSignupForm(formData) {
    const submitButton = document.querySelector('.signup-btn');
    
    try {
        // Show loading state
        setLoadingState(submitButton, true);
        
        // Show loading modal
        const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        loadingModal.show();
        
        // Submit to API
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (response.ok) {
            const data = await response.json();
            
            // Hide loading modal
            loadingModal.hide();
            
            // Success notification
            showNotification('Account created successfully! Please check your email for verification.', 'success');
            
            // Clear form
            document.getElementById('signupForm').reset();
            clearAllValidation();
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'login.html?message=signup_success';
            }, 2000);
            
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Signup failed');
        }
        
    } catch (error) {
        // Hide loading modal
        const loadingModal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (loadingModal) loadingModal.hide();
        
        // Reset loading state
        setLoadingState(submitButton, false);
        
        // Show error
        showNotification(error.message || 'Signup failed. Please try again.', 'error');
        console.error('Signup error:', error);
    }
}

/**
 * Initialize terms and conditions handlers
 */
function initializeTermsHandlers() {
    window.acceptTerms = function() {
        const agreeCheckbox = document.getElementById('agreeTerms');
        agreeCheckbox.checked = true;
        agreeCheckbox.classList.remove('is-invalid');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('termsModal'));
        modal.hide();
        
        showNotification('Terms accepted! You can now create your account.', 'success');
    };
}

/**
 * Toggle password visibility
 */
function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleIcon = document.getElementById(fieldId + 'Toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

// Make togglePassword globally available
window.togglePassword = togglePassword;

/**
 * UI Enhancement functions
 */
function initializeUIEnhancements() {
    // Animate signup card entrance
    const signupCard = document.querySelector('.signup-card');
    signupCard.style.opacity = '0';
    signupCard.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        signupCard.style.transition = 'all 0.6s ease';
        signupCard.style.opacity = '1';
        signupCard.style.transform = 'translateY(0)';
    }, 100);
    
    // Enhanced focus effects
    const inputs = document.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.form-floating').style.transform = 'scale(1.01)';
        });
        
        input.addEventListener('blur', function() {
            this.closest('.form-floating').style.transform = 'scale(1)';
        });
    });
    
    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 0 && !value.startsWith('254') && !value.startsWith('+')) {
            value = '254' + value;
        }
        if (value.length > 12) {
            value = value.substring(0, 12);
        }
        this.value = value;
    });
}

/**
 * Utility Functions
 */
function setFieldError(field, message) {
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
    showFieldError(field, message);
}

function setFieldSuccess(field, message = '') {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    hideFieldError(field);
    if (message) {
        showFieldSuccess(field, message);
    }
}

function clearFieldValidation(field) {
    field.classList.remove('is-valid', 'is-invalid');
    hideFieldError(field);
    hideFieldSuccess(field);
}

function showFieldError(field, message) {
    const feedback = field.parentNode.querySelector('.invalid-feedback') || 
                    field.closest('.form-check').querySelector('.invalid-feedback');
    if (feedback) {
        feedback.textContent = message;
        feedback.style.display = 'block';
    }
}

function hideFieldError(field) {
    const feedback = field.parentNode.querySelector('.invalid-feedback') ||
                    field.closest('.form-check').querySelector('.invalid-feedback');
    if (feedback) {
        feedback.style.display = 'none';
    }
}

function showFieldSuccess(field, message) {
    const feedback = field.parentNode.querySelector('.valid-feedback');
    if (feedback) {
        feedback.textContent = message;
        feedback.style.display = 'block';
    }
}

function hideFieldSuccess(field) {
    const feedback = field.parentNode.querySelector('.valid-feedback');
    if (feedback) {
        feedback.style.display = 'none';
    }
}

function clearAllValidation() {
    const fields = document.querySelectorAll('.form-control, .form-select, .form-check-input');
    fields.forEach(clearFieldValidation);
}

function scrollToFirstError() {
    const firstError = document.querySelector('.is-invalid');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
    }
}

function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating Account...';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-user-plus me-2"></i>Create Account';
    }
}

/**
 * Show notification (reuse from login.js)
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
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getAlertClass(type) {
    const classes = { success: 'success', error: 'danger', warning: 'warning', info: 'info' };
    return classes[type] || 'info';
}

function getIcon(type) {
    const icons = { 
        success: 'fa-check-circle', 
        error: 'fa-exclamation-circle', 
        warning: 'fa-exclamation-triangle', 
        info: 'fa-info-circle' 
    };
    return icons[type] || 'fa-info-circle';
}