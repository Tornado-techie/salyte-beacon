/**
 * Index Page JavaScript for Salyte Beacon
 * Handles homepage interactions, animations, and user experience enhancements
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize homepage functionality
    initializeHomepage();
});

/**
 * Initialize all homepage functionality
 */
function initializeHomepage() {
    // Smooth scrolling for anchor links
    initializeSmoothScrolling();
    
    // Navbar scroll effects
    initializeNavbarEffects();
    
    // Feature cards hover effects
    initializeFeatureCards();
    
    // Loading animations
    initializeAnimations();
    
    // Statistics counter animation
    initializeCounters();
    
    console.log('Salyte Beacon Homepage initialized successfully');
}

/**
 * Initialize smooth scrolling for navigation links
 */
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Calculate offset for fixed navbar
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Initialize navbar scroll effects
 */
function initializeNavbarEffects() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove background opacity based on scroll position
        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll (optional)
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Add CSS transition for navbar
    navbar.style.transition = 'transform 0.3s ease, background-color 0.3s ease';
}

/**
 * Initialize feature cards interactions
 */
function initializeFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach((card, index) => {
        // Add staggered animation delay
        card.style.animationDelay = `${index * 0.2}s`;
        
        // Enhanced hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            
            // Add glow effect
            this.style.boxShadow = '0 25px 50px rgba(13, 110, 253, 0.25)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.08)';
        });
        
        // Click analytics (mock)
        card.addEventListener('click', function() {
            const featureName = this.querySelector('h4').textContent;
            trackFeatureInteraction(featureName);
        });
    });
}

/**
 * Initialize entrance animations
 */
function initializeAnimations() {
    // Intersection Observer for scroll-triggered animations
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
    
    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('.feature-card, .sdg-icon');
    elementsToAnimate.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
    
    // Add CSS for scroll animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .animate-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

/**
 * Initialize animated counters (placeholder for future stats)
 */
function initializeCounters() {
    // Mock statistics that could be added to the homepage
    const stats = {
        waterSourcesMonitored: 1250,
        communitiesServed: 85,
        testsCompleted: 5680
    };
    
    // Function to animate counters (for future use)
    function animateCounter(element, finalValue, duration = 2000) {
        let startValue = 0;
        let startTime = null;
        
        function animation(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            const currentValue = Math.floor(startValue + (finalValue - startValue) * progress);
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
    
    console.log('Statistics ready for animation:', stats);
}

/**
 * Track feature interactions (mock analytics)
 */
function trackFeatureInteraction(featureName) {
    console.log(`Feature interaction tracked: ${featureName}`);
    
    // Mock analytics event
    if (window.gtag) {
        window.gtag('event', 'feature_click', {
            'feature_name': featureName,
            'page_location': window.location.href
        });
    }
}

/**
 * Handle Get Started button click
 */
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn[href="login.html"]')) {
        // Add loading state to button
        const button = e.target.closest('.btn');
        const originalText = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
        button.disabled = true;
        
        // Simulate loading delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
});

/**
 * Add dynamic background particles effect (optional enhancement)
 */
function initializeParticleEffect() {
    const heroSection = document.querySelector('.hero-section');
    
    // Create particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    particlesContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;
    
    heroSection.appendChild(particlesContainer);
    
    // Create floating particles
    for (let i = 0; i < 50; i++) {
        createParticle(particlesContainer);
    }
}

/**
 * Create individual particle element
 */
function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 10 + 10;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        left: ${x}%;
        top: ${y}%;
        animation: float ${duration}s infinite ease-in-out;
    `;
    
    container.appendChild(particle);
    
    // Remove and recreate particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
            createParticle(container);
        }
    }, duration * 1000);
}

/**
 * Handle page visibility changes
 */
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Page hidden - pausing animations');
        // Pause any expensive animations when page is not visible
    } else {
        console.log('Page visible - resuming animations');
        // Resume animations when page becomes visible
    }
});

/**
 * Performance monitoring
 */
window.addEventListener('load', function() {
    // Log page load performance
    const loadTime = performance.now();
    console.log(`Homepage loaded in ${Math.round(loadTime)}ms`);
    
    // Track Core Web Vitals (mock)
    if ('web-vitals' in window) {
        // getCLS, getFID, getFCP, getLCP, getTTFB would be imported from web-vitals library
        console.log('Web Vitals tracking initialized');
    }
});