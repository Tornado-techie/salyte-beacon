/**
 * Knowledge Hub JavaScript for Salyte Beacon
 * Handles article search, filtering, categorization, and offline functionality
 */

// Global variables
let allArticles = [];
let filteredArticles = [];
let currentCategory = 'all';
let offlineArticles = [];
let searchTimeout;
let currentPage = 1;
let articlesPerPage = 10;

// Initialize knowledge hub on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeKnowledgeHub();
});

/**
 * Initialize all knowledge hub functionality
 */
function initializeKnowledgeHub() {
    // Load articles data
    loadArticles();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize search functionality
    initializeSearch();
    
    // Setup offline functionality
    setupOfflineMode();
    
    // Initialize category navigation
    initializeCategoryNavigation();
    
    // Load bookmarks
    loadBookmarks();
    
    console.log('Knowledge Hub initialized successfully');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search functionality
    const searchInputs = document.querySelectorAll('#searchInput, #heroSearchInput');
    searchInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', debounce(handleSearch, 300));
        }
    });

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', handleSort);
    }

    // Category clicks
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            filterByCategory(category);
        });
    });

    // Category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            filterByCategory(category);
        });
    });

    // Offline mode toggle
    const offlineToggle = document.getElementById('offlineMode');
    if (offlineToggle) {
        offlineToggle.addEventListener('change', toggleOfflineMode);
        // Load offline status
        offlineToggle.checked = localStorage.getItem('offlineModeEnabled') === 'true';
    }
}

/**
 * Load articles from API or mock data
 */
async function loadArticles() {
    try {
        showLoadingState(true);

        // Try to fetch from API
        const response = await fetch('/api/articles');
        
        if (response.ok) {
            allArticles = await response.json();
        } else {
            // Use mock data
            allArticles = getMockArticles();
        }

        filteredArticles = [...allArticles];
        renderArticles();
        updateArticleCounts();

    } catch (error) {
        console.error('Error loading articles:', error);
        allArticles = getMockArticles();
        filteredArticles = [...allArticles];
        renderArticles();
        updateArticleCounts();
    } finally {
        showLoadingState(false);
    }
}

/**
 * Handle search functionality
 */
function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (query === '') {
        filteredArticles = [...allArticles];
    } else {
        filteredArticles = allArticles.filter(article => 
            article.title.toLowerCase().includes(query) ||
            article.excerpt.toLowerCase().includes(query) ||
            article.category.toLowerCase().includes(query) ||
            (article.tags && article.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    }
    
    currentPage = 1;
    renderArticles();
    updateSearchResults(query);
}

/**
 * Handle sorting
 */
function handleSort(event) {
    const sortBy = event.target.value;
    
    switch (sortBy) {
        case 'newest':
            filteredArticles.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
            break;
        case 'oldest':
            filteredArticles.sort((a, b) => new Date(a.publishedDate) - new Date(b.publishedDate));
            break;
        case 'popular':
            filteredArticles.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
            break;
        case 'updated':
            filteredArticles.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            break;
        case 'relevance':
        default:
            // Keep current order or implement relevance scoring
            break;
    }
    
    renderArticles();
}

/**
 * Filter articles by category
 */
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active category in sidebar
    updateActiveCategoryItem(category);
    
    if (category === 'all' || !category) {
        filteredArticles = [...allArticles];
    } else {
        filteredArticles = allArticles.filter(article => 
            article.category.toLowerCase() === category.toLowerCase()
        );
    }
    
    currentPage = 1;
    renderArticles();
    scrollToArticles();
}

/**
 * Update active category item in sidebar
 */
function updateActiveCategoryItem(category) {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === category) {
            item.classList.add('active');
        }
    });
}

/**
 * Render articles list
 */
function renderArticles() {
    const articlesList = document.getElementById('articlesList');
    if (!articlesList) return;

    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    const articlesToShow = filteredArticles.slice(startIndex, endIndex);

    if (articlesToShow.length === 0) {
        articlesList.innerHTML = `
            <div class="no-articles-message text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>No articles found</h4>
                <p class="text-muted">Try adjusting your search terms or browse by category</p>
                <button class="btn btn-primary" onclick="clearSearch()">
                    <i class="fas fa-undo me-2"></i>Clear Search
                </button>
            </div>
        `;
        return;
    }

    const articlesHTML = articlesToShow.map(article => createArticleItem(article)).join('');
    articlesList.innerHTML = articlesHTML;

    // Update pagination if needed
    updatePagination();
}

/**
 * Create individual article item HTML
 */
function createArticleItem(article) {
    const isBookmarked = isArticleBookmarked(article.id);
    const isOffline = isArticleOffline(article.id);
    
    return `
        <div class="article-item" data-article-id="${article.id}">
            <div class="article-header">
                <h4 class="article-title" onclick="openArticle('${article.id}')">${article.title}</h4>
                <span class="article-category">${article.category}</span>
            </div>
            <p class="article-excerpt">${article.excerpt}</p>
            <div class="article-meta">
                <div class="article-meta-left">
                    <span><i class="fas fa-calendar me-1"></i>${formatDate(article.publishedDate)}</span>
                    <span><i class="fas fa-clock me-1"></i>${article.readTime} min read</span>
                    <span><i class="fas fa-download me-1"></i>${article.downloads || 0}</span>
                    ${article.difficulty ? `<span><i class="fas fa-signal me-1"></i>${article.difficulty}</span>` : ''}
                </div>
                <div class="article-actions">
                    <button class="btn btn-outline-secondary btn-sm" onclick="toggleBookmark('${article.id}')" title="Bookmark">
                        <i class="fas fa-bookmark${isBookmarked ? '' : '-o'}"></i>
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="toggleOfflineArticle('${article.id}')" title="Save offline">
                        <i class="fas fa-download${isOffline ? ' text-success' : ''}"></i>
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="shareArticle('${article.id}')" title="Share">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="openArticle('${article.id}')">
                        Read More
                    </button>
                </div>
            </div>
            ${article.tags ? `
                <div class="article-tags mt-2">
                    ${article.tags.map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Open article in modal
 */
function openArticle(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;

    const modal = new bootstrap.Modal(document.getElementById('articleModal'));
    const modalTitle = document.getElementById('articleTitle');
    const modalBody = document.getElementById('articleContent');

    modalTitle.textContent = article.title;
    
    // Load full article content
    loadArticleContent(articleId).then(content => {
        modalBody.innerHTML = content;
    });

    modal.show();

    // Track article view
    trackArticleView(articleId);
}

/**
 * Load full article content
 */
async function loadArticleContent(articleId) {
    try {
        // Try to load from offline storage first
        const offlineContent = getOfflineArticleContent(articleId);
        if (offlineContent) {
            return offlineContent;
        }

        // Fetch from API
        const response = await fetch(`/api/articles/${articleId}`);
        if (response.ok) {
            const articleData = await response.json();
            return articleData.content;
        }
        
        // Return mock content
        return getMockArticleContent(articleId);
        
    } catch (error) {
        console.error('Error loading article content:', error);
        return getMockArticleContent(articleId);
    }
}

/**
 * Search knowledge base from hero section
 */
function searchKnowledgeBase() {
    const heroInput = document.getElementById('heroSearchInput');
    const mainInput = document.getElementById('searchInput');
    
    if (heroInput && mainInput) {
        mainInput.value = heroInput.value;
        handleSearch({ target: mainInput });
        
        // Scroll to articles section
        scrollToArticles();
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    // Search button click handlers
    const searchButtons = document.querySelectorAll('button[onclick="searchKnowledgeBase()"]');
    searchButtons.forEach(button => {
        button.addEventListener('click', searchKnowledgeBase);
    });

    // Enter key in hero search
    const heroSearch = document.getElementById('heroSearchInput');
    if (heroSearch) {
        heroSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchKnowledgeBase();
            }
        });
    }
}

/**
 * Initialize category navigation
 */
function initializeCategoryNavigation() {
    // Update category counts
    updateArticleCounts();
    
    // Set initial active category
    updateActiveCategoryItem('water-testing');
}

/**
 * Update article counts in categories
 */
function updateArticleCounts() {
    const categories = [
        'water-testing', 'water-treatment', 'quality-standards', 
        'community-guides', 'emergency-response', 'equipment-guides', 
        'policy-regulations', 'case-studies'
    ];
    
    categories.forEach(category => {
        const count = allArticles.filter(article => 
            article.category.toLowerCase().replace(/\s+/g, '-') === category
        ).length;
        
        const categoryElement = document.querySelector(`[data-category="${category}"] small`);
        if (categoryElement) {
            categoryElement.textContent = `(${count} articles)`;
        }
    });
}

/**
 * Setup offline functionality
 */
function setupOfflineMode() {
    // Load offline articles from localStorage
    const savedOfflineArticles = localStorage.getItem('offlineArticles');
    if (savedOfflineArticles) {
        try {
            offlineArticles = JSON.parse(savedOfflineArticles);
        } catch (error) {
            console.error('Error loading offline articles:', error);
            offlineArticles = [];
        }
    }
}

/**
 * Toggle offline mode
 */
function toggleOfflineMode() {
    const offlineToggle = document.getElementById('offlineMode');
    const isEnabled = offlineToggle.checked;
    
    localStorage.setItem('offlineModeEnabled', isEnabled);
    
    if (isEnabled) {
        showNotification('Offline mode enabled. Articles can now be saved for offline reading.', 'success');
    } else {
        showNotification('Offline mode disabled.', 'info');
    }
}

/**
 * Toggle article offline status
 */
function toggleOfflineArticle(articleId) {
    if (!articleId) return;
    
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;
    
    const isCurrentlyOffline = isArticleOffline(articleId);
    
    if (isCurrentlyOffline) {
        // Remove from offline storage
        removeArticleFromOffline(articleId);
        showNotification(`${article.title} removed from offline storage`, 'info');
    } else {
        // Add to offline storage
        addArticleToOffline(articleId);
        showNotification(`${article.title} saved for offline reading`, 'success');
    }
    
    // Re-render articles to update UI
    renderArticles();
}

/**
 * Add article to offline storage
 */
async function addArticleToOffline(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;
    
    try {
        // Load full content
        const content = await loadArticleContent(articleId);
        
        const offlineArticle = {
            id: articleId,
            title: article.title,
            content: content,
            savedDate: new Date().toISOString(),
            category: article.category,
            readTime: article.readTime
        };
        
        // Add to offline articles array
        const existingIndex = offlineArticles.findIndex(a => a.id === articleId);
        if (existingIndex >= 0) {
            offlineArticles[existingIndex] = offlineArticle;
        } else {
            offlineArticles.push(offlineArticle);
        }
        
        // Save to localStorage
        localStorage.setItem('offlineArticles', JSON.stringify(offlineArticles));
        
    } catch (error) {
        console.error('Error saving article offline:', error);
        showNotification('Failed to save article offline', 'error');
    }
}

/**
 * Remove article from offline storage
 */
function removeArticleFromOffline(articleId) {
    offlineArticles = offlineArticles.filter(a => a.id !== articleId);
    localStorage.setItem('offlineArticles', JSON.stringify(offlineArticles));
}

/**
 * Check if article is saved offline
 */
function isArticleOffline(articleId) {
    return offlineArticles.some(a => a.id === articleId);
}

/**
 * Get offline article content
 */
function getOfflineArticleContent(articleId) {
    const offlineArticle = offlineArticles.find(a => a.id === articleId);
    return offlineArticle ? offlineArticle.content : null;
}

/**
 * Bookmark functionality
 */
function toggleBookmark(articleId) {
    const bookmarks = getBookmarks();
    const isBookmarked = bookmarks.includes(articleId);
    
    if (isBookmarked) {
        removeBookmark(articleId);
    } else {
        addBookmark(articleId);
    }
    
    renderArticles();
}

/**
 * Add article to bookmarks
 */
function addBookmark(articleId) {
    const bookmarks = getBookmarks();
    if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId);
        localStorage.setItem('articleBookmarks', JSON.stringify(bookmarks));
        
        const article = allArticles.find(a => a.id === articleId);
        if (article) {
            showNotification(`${article.title} bookmarked`, 'success');
        }
    }
}

/**
 * Remove article from bookmarks
 */
function removeBookmark(articleId) {
    const bookmarks = getBookmarks();
    const updatedBookmarks = bookmarks.filter(id => id !== articleId);
    localStorage.setItem('articleBookmarks', JSON.stringify(updatedBookmarks));
    
    const article = allArticles.find(a => a.id === articleId);
    if (article) {
        showNotification(`${article.title} removed from bookmarks`, 'info');
    }
}

/**
 * Get bookmarks from localStorage
 */
function getBookmarks() {
    try {
        const bookmarks = localStorage.getItem('articleBookmarks');
        return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        return [];
    }
}

/**
 * Check if article is bookmarked
 */
function isArticleBookmarked(articleId) {
    return getBookmarks().includes(articleId);
}

/**
 * Load and display bookmarks
 */
function loadBookmarks() {
    // This could be implemented to show a bookmarks page/modal
    console.log('Bookmarks loaded:', getBookmarks().length);
}

/**
 * Share article
 */
function shareArticle(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;
    
    if (navigator.share) {
        // Use native Web Share API if available
        navigator.share({
            title: article.title,
            text: article.excerpt,
            url: `${window.location.origin}/knowledge/${articleId}`
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy link to clipboard
        const url = `${window.location.origin}/knowledge/${articleId}`;
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Article link copied to clipboard', 'success');
        }).catch(() => {
            showNotification('Unable to copy link', 'error');
        });
    }
}

/**
 * Download file functionality
 */
function downloadFile(filename) {
    // Mock file download
    showNotification(`Downloading ${filename}...`, 'info');
    
    // In a real implementation, this would trigger the actual download
    setTimeout(() => {
        showNotification(`${filename} download started`, 'success');
    }, 1000);
}

/**
 * Subscribe to newsletter
 */
function subscribeNewsletter() {
    const form = document.getElementById('newsletterForm');
    const formData = new FormData(form);
    
    const subscriptionData = {
        email: formData.get('newsletterEmail'),
        interests: formData.getAll('interests'),
        frequency: formData.get('newsletterFrequency')
    };
    
    // Mock API call
    setTimeout(() => {
        showNotification('Successfully subscribed to newsletter!', 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('newsletterModal'));
        modal.hide();
        
        form.reset();
    }, 1000);
}

/**
 * Focus search input
 */
function focusSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Show bookmarks
 */
function showBookmarks() {
    const bookmarks = getBookmarks();
    if (bookmarks.length === 0) {
        showNotification('No bookmarked articles yet', 'info');
        return;
    }
    
    const bookmarkedArticles = allArticles.filter(a => bookmarks.includes(a.id));
    
    // Filter to show only bookmarked articles
    filteredArticles = bookmarkedArticles;
    renderArticles();
    scrollToArticles();
    
    showNotification(`Showing ${bookmarkedArticles.length} bookmarked articles`, 'info');
}

/**
 * Utility functions
 */
function scrollToArticles() {
    const articlesSection = document.querySelector('.recent-articles');
    if (articlesSection) {
        articlesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function clearSearch() {
    const searchInputs = document.querySelectorAll('#searchInput, #heroSearchInput');
    searchInputs.forEach(input => {
        if (input) input.value = '';
    });
    
    filteredArticles = [...allArticles];
    currentCategory = 'all';
    updateActiveCategoryItem('water-testing');
    renderArticles();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showLoadingState(show) {
    const articlesList = document.getElementById('articlesList');
    if (!articlesList) return;
    
    if (show) {
        articlesList.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading articles...</span>
                </div>
                <p>Loading knowledge base articles...</p>
            </div>
        `;
    }
}

function updateSearchResults(query) {
    if (query) {
        console.log(`Search results for "${query}": ${filteredArticles.length} articles found`);
    }
}

function updatePagination() {
    // Implement pagination if needed for large article lists
    // This is a placeholder for pagination functionality
}

function trackArticleView(articleId) {
    // Track article views for analytics
    console.log(`Article viewed: ${articleId}`);
    
    // In a real implementation, send to analytics service
    if (window.gtag) {
        window.gtag('event', 'article_view', {
            article_id: articleId,
            page_location: window.location.href
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

/**
 * Mock data functions
 */
function getMockArticles() {
    return [
        {
            id: 'art001',
            title: 'Complete Guide to Water Quality Testing',
            category: 'Water Testing',
            excerpt: 'Comprehensive methodology for testing pH, TDS, turbidity, and bacterial contamination in field conditions.',
            publishedDate: '2025-01-10',
            lastModified: '2025-01-12',
            readTime: 15,
            downloads: 2500,
            difficulty: 'Advanced',
            tags: ['pH Testing', 'TDS', 'Turbidity', 'Field Testing'],
            author: 'Dr. Sarah Johnson'
        },
        {
            id: 'art002',
            title: 'Household Water Treatment Methods',
            category: 'Water Treatment',
            excerpt: 'Practical solutions for improving water quality at home using affordable, locally available materials.',
            publishedDate: '2025-01-08',
            lastModified: '2025-01-10',
            readTime: 8,
            downloads: 4100,
            difficulty: 'Beginner',
            tags: ['Home Treatment', 'Filtration', 'Boiling', 'UV Treatment'],
            author: 'Michael Chen'
        },
        {
            id: 'art003',
            title: 'WHO Water Quality Standards Explained',
            category: 'Quality Standards',
            excerpt: 'Understanding international water quality standards and how to apply them in local contexts.',
            publishedDate: '2025-01-05',
            lastModified: '2025-01-07',
            readTime: 12,
            downloads: 1800,
            difficulty: 'Intermediate',
            tags: ['WHO Guidelines', 'Standards', 'Compliance', 'Regulations'],
            author: 'Dr. Patricia Williams'
        },
        {
            id: 'art004',
            title: 'Community Water Management Best Practices',
            category: 'Community Guides',
            excerpt: 'Strategies for effective community-based water resource management and sustainability.',
            publishedDate: '2025-01-03',
            lastModified: '2025-01-05',
            readTime: 20,
            downloads: 1200,
            difficulty: 'Intermediate',
            tags: ['Community', 'Management', 'Sustainability', 'Governance'],
            author: 'James Ochieng'
        },
        {
            id: 'art005',
            title: 'Emergency Water Purification Techniques',
            category: 'Emergency Response',
            excerpt: 'Critical water treatment methods for emergency situations and disaster response.',
            publishedDate: '2024-12-28',
            lastModified: '2025-01-02',
            readTime: 10,
            downloads: 890,
            difficulty: 'Intermediate',
            tags: ['Emergency', 'Disaster Response', 'Purification', 'Crisis Management'],
            author: 'Dr. Ahmed Hassan'
        }
    ];
}

function getMockArticleContent(articleId) {
    // Return mock article content based on ID
    const contentMap = {
        'art001': `
            <h2>Complete Guide to Water Quality Testing</h2>
            <p>Water quality testing is essential for ensuring safe drinking water and protecting public health. This comprehensive guide covers the fundamental parameters and methodologies for field testing.</p>
            
            <h3>Key Testing Parameters</h3>
            <h4>pH Testing</h4>
            <p>pH measures the acidity or alkalinity of water. The WHO recommends a pH range of 6.5-8.5 for drinking water.</p>
            <ul>
                <li>Use calibrated pH meters for accurate readings</li>
                <li>Perform three-point calibration before testing</li>
                <li>Test at consistent temperature conditions</li>
            </ul>
            
            <h4>Total Dissolved Solids (TDS)</h4>
            <p>TDS measures the concentration of dissolved substances in water. Levels below 1000 mg/L are generally acceptable.</p>
            
            <h4>Turbidity</h4>
            <p>Turbidity measures water clarity. The WHO standard is below 1 NTU for treated water supplies.</p>
            
            <h3>Testing Procedures</h3>
            <p>Follow these standardized procedures for consistent results...</p>
        `,
        'art002': `
            <h2>Household Water Treatment Methods</h2>
            <p>Safe drinking water is a fundamental human right, yet many households lack access to reliable treatment systems. This guide provides practical, affordable solutions.</p>
            
            <h3>Boiling</h3>
            <p>The most reliable method for killing bacteria, viruses, and parasites. Bring water to a rolling boil for at least one minute.</p>
            
            <h3>Solar Disinfection (SODIS)</h3>
            <p>Fill clear plastic bottles with water and expose to direct sunlight for 6 hours to kill most pathogens.</p>
            
            <h3>Sand Filtration</h3>
            <p>Construct a slow sand filter using locally available materials to remove physical contaminants and some pathogens.</p>
        `
    };
    
    return contentMap[articleId] || `
        <h2>Article Content</h2>
        <p>This is placeholder content for article ${articleId}. In a real implementation, this would be loaded from your content management system or database.</p>
        <p>The article would contain detailed information about water safety topics, complete with images, diagrams, and interactive elements to enhance learning.</p>
    `;
}

// Make functions globally available
window.searchKnowledgeBase = searchKnowledgeBase;
window.filterByCategory = filterByCategory;
window.toggleOfflineArticle = toggleOfflineArticle;
window.toggleBookmark = toggleBookmark;
window.shareArticle = shareArticle;
window.openArticle = openArticle;
window.downloadFile = downloadFile;
window.subscribeNewsletter = subscribeNewsletter;
window.focusSearch = focusSearch;
window.showBookmarks = showBookmarks;
window.clearSearch = clearSearch;

console.log('Knowledge Hub JavaScript loaded successfully');