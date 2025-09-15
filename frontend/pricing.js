/**
 * Pricing Page JavaScript for Salyte Beacon
 * Handles pricing toggle, plan selection, and interactive features
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize pricing page functionality
    initializePricingPage();
});

/**
 * Initialize all pricing page functionality
 */
function initializePricingPage() {
    // Pricing toggle functionality
    initializePricingToggle();
    
    // Plan selection handlers
    initializePlanSelection();
    
    // Scroll animations
    initializeScrollAnimations();
    
    // Feature comparison interactions
    initializeFeatureComparison();
    
    // FAQ enhancements
    initializeFAQEnhancements();
    
    // Contact sales functionality
    initializeContactSales();
    
    console.log('Pricing page initialized successfully');
}

/**
 * Initialize pricing toggle (Monthly/Annual)
 */
function initializePricingToggle() {
    const annualToggle = document.getElementById('annualToggle');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const annualPrices = document.querySelectorAll('.annual-price');
    
    // Define pricing data
    const pricingData = {
        basic: { monthly: 19, annual: 15 },
        premium: { monthly: 49, annual: 39 },
        enterprise: { monthly: 'Custom', annual: 'Custom' }
    };
    
    annualToggle.addEventListener('change', function() {
        const isAnnual = this.checked;
        
        // Toggle price visibility with animation
        monthlyPrices.forEach((price, index) => {
            const annualPrice = annualPrices[index];
            
            if (isAnnual) {
                // Fade out monthly, fade in annual
                price.style.opacity = '0';
                setTimeout(() => {
                    price.style.display = 'none';
                    annualPrice.style.display = 'inline';
                    setTimeout(() => {
                        annualPrice.style.opacity = '1';
                    }, 50);
                }, 200);
            } else {
                // Fade out annual, fade in monthly
                annualPrice.style.opacity = '0';
                setTimeout(() => {
                    annualPrice.style.display = 'none';
                    price.style.display = 'inline';
                    setTimeout(() => {
                        price.style.opacity = '1';
                    }, 50);
                }, 200);
            }
        });
        
        // Add visual feedback
        const toggle = annualToggle.parentElement;
        toggle.classList.add('switching');
        setTimeout(() => {
            toggle.classList.remove('switching');
        }, 400);
        
        // Track the toggle event
        trackPricingToggle(isAnnual);
        
        // Show savings notification for annual
        if (isAnnual) {
            showNotification('Annual billing saves you 20%! 💰', 'success');
        }
    });
    
    // Initialize annual prices as hidden
    annualPrices.forEach(price => {
        price.style.opacity = '0';
        price.style.transition = 'opacity 0.2s ease';
    });
    
    monthlyPrices.forEach(price => {
        price.style.transition = 'opacity 0.2s ease';
    });
}

/**
 * Initialize plan selection functionality
 */
function initializePlanSelection() {
    // Add click handlers to all pricing cards
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
            // Optional: Add subtle sound effect
            playHoverSound();
        });
        
        // Add click handler to entire card
        card.addEventListener('click', function() {
            const button = this.querySelector('.btn');
            if (button) {
                button.click();
            }
        });
    });
    
    // Make plan selection globally available
    window.selectPlan = selectPlan;
    window.contactSales = contactSales;
}

/**
 * Handle plan selection
 */
function selectPlan(planType) {
    const isAnnual = document.getElementById('annualToggle').checked;
    const billingPeriod = isAnnual ? 'annual' : 'monthly';
    
    // Track plan selection
    trackPlanSelection(planType, billingPeriod);
    
    // Show selection feedback
    const card = event.target.closest('.pricing-card');
    if (card) {
        card.classList.add('selected');
        setTimeout(() => card.classList.remove('selected'), 2000);
    }
    
    // Handle different plan types
    switch (planType) {
        case 'free':
            handleFreePlan();
            break;
        case 'basic':
        case 'premium':
            handlePaidPlan(planType, billingPeriod);
            break;
        case 'enterprise':
            contactSales();
            break;
        default:
            console.warn('Unknown plan type:', planType);
    }
}

/**
 * Handle free plan selection
 */
function handleFreePlan() {
    showNotification('Redirecting to free signup...', 'info');
    
    // Add loading state
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Getting Started...';
    button.disabled = true;
    
    setTimeout(() => {
        // Redirect to signup with free plan parameter
        window.location.href = 'signup.html?plan=free';
    }, 1500);
}

/**
 * Handle paid plan selection
 */
function handlePaidPlan(planType, billingPeriod) {
    const planDetails = {
        basic: {
            monthly: { price: 19, name: 'Basic Monthly' },
            annual: { price: 15, name: 'Basic Annual' }
        },
        premium: {
            monthly: { price: 49, name: 'Premium Monthly' },
            annual: { price: 39, name: 'Premium Annual' }
        }
    };
    
    const plan = planDetails[planType][billingPeriod];
    
    // Show trial notification
    showNotification(`Starting 14-day free trial for ${plan.name}`, 'success');
    
    // Add loading state
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Starting Trial...';
    button.disabled = true;
    
    setTimeout(() => {
        // Redirect to checkout or signup with plan parameters
        const params = new URLSearchParams({
            plan: planType,
            billing: billingPeriod,
            price: plan.price,
            trial: 'true'
        });
        window.location.href = `signup.html?${params.toString()}`;
    }, 1500);
}

/**
 * Handle contact sales
 */
function contactSales() {
    // Track contact sales interaction
    trackContactSales();
    
    // Create and show contact sales modal
    const modal = createContactSalesModal();
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

/**
 * Create contact sales modal
 */
function createContactSalesModal() {
    // Remove existing modal if present
    const existingModal = document.getElementById('contactSalesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal fade" id="contactSalesModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-handshake me-2"></i>Contact Sales Team
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Get in Touch</h6>
                                <form id="contactSalesForm">
                                    <div class="mb-3">
                                        <label for="companyName" class="form-label">Company Name</label>
                                        <input type="text" class="form-control" id="companyName" required>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="firstName" class="form-label">First Name</label>
                                                <input type="text" class="form-control" id="firstName" required>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="lastName" class="form-label">Last Name</label>
                                                <input type="text" class="form-control" id="lastName" required>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="email" class="form-label">Business Email</label>
                                        <input type="email" class="form-control" id="email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="phone" class="form-label">Phone Number</label>
                                        <input type="tel" class="form-control" id="phone">
                                    </div>
                                    <div class="mb-3">
                                        <label for="teamSize" class="form-label">Team Size</label>
                                        <select class="form-select" id="teamSize" required>
                                            <option value="">Select team size</option>
                                            <option value="1-10">1-10 people</option>
                                            <option value="11-50">11-50 people</option>
                                            <option value="51-200">51-200 people</option>
                                            <option value="201-1000">201-1000 people</option>
                                            <option value="1000+">1000+ people</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="message" class="form-label">How can we help?</label>
                                        <textarea class="form-control" id="message" rows="3" 
                                            placeholder="Tell us about your water monitoring needs..."></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">
                                        <i class="fas fa-paper-plane me-2"></i>Send Message
                                    </button>
                                </form>
                            </div>
                            <div class="col-md-6">
                                <h6>Why Choose Enterprise?</h6>
                                <ul class="list-unstyled">
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        Unlimited API access & white-label solutions
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        Dedicated customer success manager
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        Custom integrations & on-site training
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        99.9% SLA with priority support
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-check text-success me-2"></i>
                                        Multi-tenant setup & advanced security
                                    </li>
                                </ul>
                                
                                <div class="contact-info mt-4">
                                    <h6>Direct Contact</h6>
                                    <p class="small">
                                        <i class="fas fa-envelope text-primary me-2"></i>
                                        <strong>sales@salytebeacon.org</strong>
                                    </p>
                                    <p class="small">
                                        <i class="fas fa-phone text-primary me-2"></i>
                                        <strong>+254 700 123 456</strong>
                                    </p>
                                    <p class="small">
                                        <i class="fas fa-clock text-primary me-2"></i>
                                        Available Mon-Fri, 8 AM - 6 PM EAT
                                    </p>
                                </div>
                                
                                <div class="testimonial mt-4 p-3 bg-light rounded">
                                    <p class="small mb-2">"Salyte Beacon helped us monitor water quality across 50+ locations. The enterprise features are exactly what we needed."</p>
                                    <small class="text-muted">- Sarah M., Water Resources Manager</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submission handler
    const form = document.getElementById('contactSalesForm');
    form.addEventListener('submit', handleContactSalesSubmission);
    
    return document.getElementById('contactSalesModal');
}

/**
 * Handle contact sales form submission
 */
function handleContactSalesSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
    submitButton.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('contactSalesModal'));
        modal.hide();
        
        // Show success message
        showNotification('Thank you! Our sales team will contact you within 24 hours.', 'success');
        
        // Track form submission
        trackContactSalesFormSubmission(data);
        
        // Clear form
        e.target.reset();
    }, 2000);
}

/**
 * Initialize scroll animations
 */
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe pricing cards
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        observer.observe(card);
    });
    
    // Observe other sections
    const sectionsToAnimate = document.querySelectorAll('.features-section, .faq-section, .cta-section');
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });
}

/**
 * Initialize feature comparison interactions
 */
function initializeFeatureComparison() {
    const table = document.querySelector('.features-table');
    if (!table) return;
    
    // Add hover effects to table rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });
    
    // Add tooltips to feature icons
    const checkIcons = table.querySelectorAll('.fa-check');
    const timesIcons = table.querySelectorAll('.fa-times');
    
    checkIcons.forEach(icon => {
        icon.title = 'Included in this plan';
        icon.style.cursor = 'help';
    });
    
    timesIcons.forEach(icon => {
        icon.title = 'Not available in this plan';
        icon.style.cursor = 'help';
    });
}

/**
 * Initialize FAQ enhancements
 */
function initializeFAQEnhancements() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const button = item.querySelector('.accordion-button');
        const collapse = item.querySelector('.accordion-collapse');
        
        // Add custom animation timing
        collapse.addEventListener('show.bs.collapse', function() {
            this.style.animationDuration = '0.3s';
            this.style.animationTimingFunction = 'ease-out';
        });
        
        collapse.addEventListener('hide.bs.collapse', function() {
            this.style.animationDuration = '0.2s';
            this.style.animationTimingFunction = 'ease-in';
        });
        
        // Track FAQ interactions
        button.addEventListener('click', function() {
            const faqTitle = this.textContent.trim();
            trackFAQInteraction(faqTitle);
        });
    });
    
    // Add "Was this helpful?" buttons to FAQ answers
    const faqBodies = document.querySelectorAll('.accordion-body');
    faqBodies.forEach((body, index) => {
        const helpfulHTML = `
            <div class="faq-feedback mt-3 pt-3 border-top">
                <small class="text-muted">Was this helpful?</small>
                <div class="btn-group btn-group-sm ms-2" role="group">
                    <button type="button" class="btn btn-outline-success btn-sm" 
                            onclick="handleFAQFeedback(${index}, true)">
                        <i class="fas fa-thumbs-up"></i> Yes
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm"
                            onclick="handleFAQFeedback(${index}, false)">
                        <i class="fas fa-thumbs-down"></i> No
                    </button>
                </div>
            </div>
        `;
        body.insertAdjacentHTML('beforeend', helpfulHTML);
    });
    
    // Make FAQ feedback handler globally available
    window.handleFAQFeedback = handleFAQFeedback;
}

/**
 * Handle FAQ feedback
 */
function handleFAQFeedback(faqIndex, wasHelpful) {
    const feedback = wasHelpful ? 'positive' : 'negative';
    const message = wasHelpful ? 
        'Thank you for your feedback! 😊' : 
        'Thanks for letting us know. We\'ll improve this answer.';
    
    showNotification(message, wasHelpful ? 'success' : 'info');
    
    // Disable the feedback buttons after selection
    const faqBody = document.querySelectorAll('.accordion-body')[faqIndex];
    const buttons = faqBody.querySelectorAll('.faq-feedback button');
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent.includes(wasHelpful ? 'Yes' : 'No')) {
            btn.classList.remove('btn-outline-success', 'btn-outline-danger');
            btn.classList.add(wasHelpful ? 'btn-success' : 'btn-danger');
        }
    });
    
    // Track FAQ feedback
    trackFAQFeedback(faqIndex, feedback);
}

/**
 * Initialize contact sales functionality
 */
function initializeContactSales() {
    // Add click tracking to all "Contact Sales" elements
    const contactButtons = document.querySelectorAll('button[onclick*="contactSales"], a[onclick*="contactSales"]');
    contactButtons.forEach(button => {
        button.addEventListener('click', function() {
            trackContactSales(this.textContent.trim());
        });
    });
}

/**
 * Utility Functions
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
        top: 90px;
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
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

function getAlertClass(type) {
    const classes = {
        success: 'success',
        error: 'danger',
        warning: 'warning',
        info: 'info'
    };
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

function playHoverSound() {
    // Optional: Play subtle hover sound
    // This would require audio files and user permission
    console.log('Hover sound triggered');
}

/**
 * Analytics Tracking Functions (Mock)
 */
function trackPricingToggle(isAnnual) {
    console.log('Pricing toggle:', isAnnual ? 'Annual' : 'Monthly');
    
    if (window.gtag) {
        window.gtag('event', 'pricing_toggle', {
            billing_period: isAnnual ? 'annual' : 'monthly'
        });
    }
}

function trackPlanSelection(planType, billingPeriod) {
    console.log('Plan selected:', planType, billingPeriod);
    
    if (window.gtag) {
        window.gtag('event', 'plan_selection', {
            plan_type: planType,
            billing_period: billingPeriod
        });
    }
}

function trackContactSales(context = 'general') {
    console.log('Contact sales clicked:', context);
    
    if (window.gtag) {
        window.gtag('event', 'contact_sales', {
            context: context
        });
    }
}

function trackContactSalesFormSubmission(data) {
    console.log('Contact sales form submitted:', data);
    
    if (window.gtag) {
        window.gtag('event', 'contact_sales_form_submit', {
            company_size: data.teamSize
        });
    }
}

function trackFAQInteraction(faqTitle) {
    console.log('FAQ clicked:', faqTitle);
    
    if (window.gtag) {
        window.gtag('event', 'faq_interaction', {
            faq_title: faqTitle
        });
    }
}

function trackFAQFeedback(faqIndex, feedback) {
    console.log('FAQ feedback:', faqIndex, feedback);
    
    if (window.gtag) {
        window.gtag('event', 'faq_feedback', {
            faq_index: faqIndex,
            feedback: feedback
        });
    }
}

/**
 * Page Performance and Accessibility
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add loading animation completion
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);
    
    // Initialize tooltips for accessibility
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Add keyboard navigation for pricing cards
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach((card, index) => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Select ${card.querySelector('h3').textContent} plan`);
        
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const button = this.querySelector('.btn');
                if (button) button.click();
            }
        });
    });
});

/**
 * Handle page visibility changes for performance
 */
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause any animations or timers when page is not visible
        console.log('Page hidden - pausing animations');
    } else {
        // Resume when page becomes visible
        console.log('Page visible - resuming animations');
    }
});

/**
 * Add pricing card selection state management
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add selected state styling
    const style = document.createElement('style');
    style.textContent = `
        .pricing-card.selected {
            border-color: var(--success-color) !important;
            box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.25) !important;
            animation: pulseSuccess 0.6s ease;
        }
        
        @keyframes pulseSuccess {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .form-check.switching {
            animation: switchPulse 0.4s ease;
        }
        
        @keyframes switchPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .notification-toast.fade-out {
            animation: slideOutRight 0.3s ease forwards;
        }
        
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
        
        @keyframes slideOutRight {
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});