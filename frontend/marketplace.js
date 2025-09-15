/**
 * Marketplace JavaScript for Salyte Beacon
 * Handles product display, filtering, search, and comparison functionality
 */

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let productsPerPage = 12;
let compareList = [];
let maxCompareItems = 4;

// Initialize marketplace on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeMarketplace();
});

/**
 * Initialize all marketplace functionality
 */
function initializeMarketplace() {
    // Load initial products
    loadProducts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize filters
    initializeFilters();
    
    // Setup price range slider
    setupPriceRange();
    
    // Initialize search functionality
    initializeSearch();
    
    console.log('Marketplace initialized successfully');
}

/**
 * Load products from API or mock data
 */
async function loadProducts() {
    try {
        // Show loading state
        showLoading();
        
        // Fetch products from API
        const response = await fetch('/api/sensors');
        
        if (response.ok) {
            allProducts = await response.json();
        } else {
            // Fallback to mock data
            allProducts = getMockProducts();
        }
        
        filteredProducts = [...allProducts];
        renderProducts();
        updateResultsCount();
        
    } catch (error) {
        console.error('Error loading products:', error);
        allProducts = getMockProducts();
        filteredProducts = [...allProducts];
        renderProducts();
        updateResultsCount();
    } finally {
        hideLoading();
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const heroSearchInput = document.getElementById('heroSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (heroSearchInput) {
        heroSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Filter controls
    const filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
    
    const filterRadios = document.querySelectorAll('.filter-group input[type="radio"]');
    filterRadios.forEach(radio => {
        radio.addEventListener('change', applyFilters);
    });
    
    // Sort control
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
    
    // Category and price filters
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const vendorFilter = document.getElementById('vendorFilter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyFilters);
    if (vendorFilter) vendorFilter.addEventListener('change', applyFilters);
}

/**
 * Handle search functionality
 */
function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (query === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.type.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.vendor.toLowerCase().includes(query)
        );
    }
    
    currentPage = 1;
    renderProducts();
    updateResultsCount();
}

/**
 * Apply filters to products
 */
function applyFilters() {
    let filtered = [...allProducts];
    
    // Category filter
    const selectedCategories = getSelectedCheckboxValues('.filter-group input[value^="filter-"]:checked');
    if (selectedCategories.length > 0) {
        const categories = selectedCategories.map(val => val.replace('filter-', ''));
        filtered = filtered.filter(product => categories.includes(product.type));
    }
    
    // Price range filter
    const priceRange = document.getElementById('priceRangeSlider');
    if (priceRange) {
        const maxPrice = parseFloat(priceRange.value);
        filtered = filtered.filter(product => product.price <= maxPrice);
    }
    
    // Category dropdown filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.value) {
        filtered = filtered.filter(product => product.type === categoryFilter.value);
    }
    
    // Price dropdown filter
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter && priceFilter.value) {
        const [min, max] = priceFilter.value.includes('-') 
            ? priceFilter.value.split('-').map(Number)
            : [parseFloat(priceFilter.value.replace('+', '')), Infinity];
        
        filtered = filtered.filter(product => 
            product.price >= min && (max === Infinity || product.price <= max)
        );
    }
    
    // Vendor filter
    const vendorFilter = document.getElementById('vendorFilter');
    if (vendorFilter && vendorFilter.value) {
        filtered = filtered.filter(product => product.vendor === vendorFilter.value);
    }
    
    // Rating filter
    const selectedRating = document.querySelector('input[name="rating"]:checked');
    if (selectedRating) {
        const minRating = parseFloat(selectedRating.value);
        filtered = filtered.filter(product => product.rating >= minRating);
    }
    
    // Availability filters
    const inStockOnly = document.getElementById('filter-in-stock');
    if (inStockOnly && inStockOnly.checked) {
        filtered = filtered.filter(product => product.inStock);
    }
    
    const fastShippingOnly = document.getElementById('filter-fast-shipping');
    if (fastShippingOnly && fastShippingOnly.checked) {
        filtered = filtered.filter(product => product.fastShipping);
    }
    
    filteredProducts = filtered;
    currentPage = 1;
    renderProducts();
    updateResultsCount();
}

/**
 * Handle sorting
 */
function handleSort(event) {
    const sortBy = event.target.value;
    
    switch (sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
        case 'relevance':
        default:
            // Keep original order or implement relevance scoring
            break;
    }
    
    renderProducts();
}

/**
 * Render products grid
 */
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-12">
                <div class="no-products-message text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>No products found</h4>
                    <p class="text-muted">Try adjusting your search criteria or filters</p>
                    <button class="btn btn-primary" onclick="clearAllFilters()">
                        <i class="fas fa-undo me-2"></i>Clear All Filters
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const productsHTML = productsToShow.map(product => createProductCard(product)).join('');
    productsGrid.innerHTML = productsHTML;
    
    // Update pagination
    updatePagination();
}

/**
 * Create individual product card HTML
 */
function createProductCard(product) {
    const isInCompare = compareList.some(item => item.id === product.id);
    const stockClass = product.inStock ? 'in-stock' : 'out-of-stock';
    const stockText = product.inStock ? 'In Stock' : 'Out of Stock';
    
    const starsHTML = generateStarsHTML(product.rating);
    
    return `
        <div class="col-lg-4 col-md-6 col-sm-12 mb-4">
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    ${product.imageUrl ? 
                        `<img src="${product.imageUrl}" alt="${product.name}" loading="lazy">` :
                        `<i class="fas fa-${getProductIcon(product.type)}"></i>`
                    }
                    <div class="stock-badge ${stockClass}">${stockText}</div>
                    <div class="vendor-badge">${product.vendor}</div>
                    ${product.discount ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                </div>
                
                <div class="product-content">
                    <div class="product-type">${product.type}</div>
                    <h5 class="product-title">${product.name}</h5>
                    <p class="product-description">${product.description}</p>
                    
                    <div class="product-rating">
                        <div class="stars">${starsHTML}</div>
                        <span class="rating-text">(${product.reviews || 0} reviews)</span>
                    </div>
                    
                    <div class="product-price">
                        <div>
                            <span class="price">${product.price.toFixed(2)}</span>
                            ${product.originalPrice ? 
                                `<span class="original-price">${product.originalPrice.toFixed(2)}</span>` : ''
                            }
                        </div>
                        ${product.fastShipping ? '<small class="text-success"><i class="fas fa-shipping-fast"></i> Fast Ship</small>' : ''}
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn btn-compare ${isInCompare ? 'active' : ''}" 
                                onclick="toggleCompare(${product.id})" 
                                title="Compare this product">
                            <i class="fas fa-balance-scale"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="viewProductDetails(${product.id})">
                            <i class="fas fa-info-circle me-1"></i>Details
                        </button>
                        <a href="${product.vendorLink}" 
                           class="btn btn-primary" 
                           target="_blank" 
                           rel="noopener"
                           ${!product.inStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart me-1"></i>Buy Now
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate stars HTML for rating
 */
function generateStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

/**
 * Get appropriate icon for product type
 */
function getProductIcon(type) {
    const icons = {
        'pH': 'tint',
        'TDS': 'flask',
        'Turbidity': 'eye',
        'Conductivity': 'bolt',
        'Chlorine': 'prescription-bottle',
        'Dissolved Oxygen': 'wind'
    };
    return icons[type] || 'flask';
}

/**
 * Toggle product in comparison list
 */
function toggleCompare(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingIndex = compareList.findIndex(item => item.id === productId);
    
    if (existingIndex >= 0) {
        // Remove from comparison
        compareList.splice(existingIndex, 1);
        showNotification(`${product.name} removed from comparison`, 'info');
    } else {
        // Add to comparison
        if (compareList.length >= maxCompareItems) {
            showNotification(`Maximum ${maxCompareItems} products can be compared`, 'warning');
            return;
        }
        
        compareList.push(product);
        showNotification(`${product.name} added to comparison`, 'success');
    }
    
    updateCompareButton();
    updateCompareButtons();
}

/**
 * Update floating compare button
 */
function updateCompareButton() {
    const floatingCompare = document.getElementById('floatingCompare');
    const compareCount = document.getElementById('compareCount');
    
    if (floatingCompare && compareCount) {
        compareCount.textContent = compareList.length;
        
        if (compareList.length > 0) {
            floatingCompare.style.display = 'block';
            floatingCompare.style.animation = 'slideInUp 0.5s ease';
        } else {
            floatingCompare.style.display = 'none';
        }
    }
}

/**
 * Update individual compare buttons
 */
function updateCompareButtons() {
    const compareButtons = document.querySelectorAll('.btn-compare');
    compareButtons.forEach(button => {
        const card = button.closest('.product-card');
        const productId = parseInt(card.dataset.productId);
        const isInCompare = compareList.some(item => item.id === productId);
        
        if (isInCompare) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

/**
 * View product details in modal
 */
function viewProductDetails(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modalTitle = document.getElementById('modalProductTitle');
    const modalBody = document.getElementById('modalProductBody');
    const buyButton = document.getElementById('modalBuyButton');
    
    if (modalTitle) modalTitle.textContent = product.name;
    if (buyButton) {
        buyButton.href = product.vendorLink;
        buyButton.style.display = product.inStock ? 'inline-block' : 'none';
    }
    
    if (modalBody) {
        const starsHTML = generateStarsHTML(product.rating);
        
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    ${product.imageUrl ? 
                        `<img src="${product.imageUrl}" alt="${product.name}" class="product-modal-image">` :
                        `<div class="text-center p-4 bg-light rounded">
                            <i class="fas fa-${getProductIcon(product.type)} fa-4x text-primary"></i>
                        </div>`
                    }
                </div>
                <div class="col-md-8">
                    <div class="product-type text-primary fw-bold">${product.type.toUpperCase()}</div>
                    <h4>${product.name}</h4>
                    <div class="product-rating mb-3">
                        <div class="stars text-warning">${starsHTML}</div>
                        <span class="ms-2">${product.rating.toFixed(1)} (${product.reviews || 0} reviews)</span>
                    </div>
                    <p class="text-muted">${product.description}</p>
                    <h5 class="text-primary">${product.price.toFixed(2)}</h5>
                    <p class="small"><strong>Vendor:</strong> ${product.vendor}</p>
                    <p class="small"><strong>Availability:</strong> 
                        <span class="badge bg-${product.inStock ? 'success' : 'danger'}">
                            ${product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </p>
                </div>
            </div>
            
            ${product.specifications ? `
                <div class="product-specs mt-4">
                    <h6>Technical Specifications</h6>
                    ${Object.entries(product.specifications).map(([key, value]) => `
                        <div class="spec-item">
                            <span class="spec-label">${key}:</span>
                            <span class="spec-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

/**
 * Show comparison modal
 */
function showComparison() {
    if (compareList.length < 2) {
        showNotification('Please select at least 2 products to compare', 'warning');
        return;
    }
    
    const compareHeader = document.getElementById('compareHeader');
    const compareBody = document.getElementById('compareBody');
    
    // Build header
    let headerHTML = '<th>Feature</th>';
    compareList.forEach(product => {
        headerHTML += `<th class="text-center">${product.name}</th>`;
    });
    compareHeader.innerHTML = headerHTML;
    
    // Build comparison rows
    const features = [
        { key: 'image', label: 'Product' },
        { key: 'price', label: 'Price' },
        { key: 'type', label: 'Type' },
        { key: 'rating', label: 'Rating' },
        { key: 'vendor', label: 'Vendor' },
        { key: 'inStock', label: 'Availability' }
    ];
    
    // Add specifications if available
    const allSpecs = new Set();
    compareList.forEach(product => {
        if (product.specifications) {
            Object.keys(product.specifications).forEach(spec => allSpecs.add(spec));
        }
    });
    
    allSpecs.forEach(spec => {
        features.push({ key: `spec_${spec}`, label: spec });
    });
    
    let bodyHTML = '';
    features.forEach(feature => {
        let rowHTML = `<tr><td><strong>${feature.label}</strong></td>`;
        
        compareList.forEach(product => {
            let value = '';
            
            switch (feature.key) {
                case 'image':
                    value = product.imageUrl ? 
                        `<img src="${product.imageUrl}" alt="${product.name}" class="compare-product-image">` :
                        `<i class="fas fa-${getProductIcon(product.type)} fa-2x text-primary"></i>`;
                    break;
                case 'price':
                    value = `${product.price.toFixed(2)}`;
                    break;
                case 'rating':
                    value = generateStarsHTML(product.rating) + ` ${product.rating.toFixed(1)}`;
                    break;
                case 'inStock':
                    value = `<span class="badge bg-${product.inStock ? 'success' : 'danger'}">
                        ${product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>`;
                    break;
                default:
                    if (feature.key.startsWith('spec_')) {
                        const specKey = feature.key.replace('spec_', '');
                        value = product.specifications?.[specKey] || 'N/A';
                    } else {
                        value = product[feature.key] || 'N/A';
                    }
            }
            
            rowHTML += `<td class="text-center">${value}</td>`;
        });
        
        rowHTML += '</tr>';
        bodyHTML += rowHTML;
    });
    
    compareBody.innerHTML = bodyHTML;
    
    const modal = new bootstrap.Modal(document.getElementById('compareModal'));
    modal.show();
}

/**
 * Clear comparison list
 */
function clearComparison() {
    compareList = [];
    updateCompareButton();
    updateCompareButtons();
    showNotification('Comparison list cleared', 'info');
}

/**
 * Search functionality
 */
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        handleSearch({ target: searchInput });
    }
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    // Clear checkboxes and radios
    const checkboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    const radios = document.querySelectorAll('.filter-group input[type="radio"]');
    radios.forEach(radio => radio.checked = false);
    
    // Clear dropdowns
    const selects = document.querySelectorAll('#categoryFilter, #priceFilter, #vendorFilter, #sortSelect');
    selects.forEach(select => select.value = '');
    
    // Reset price range
    const priceRange = document.getElementById('priceRangeSlider');
    if (priceRange) {
        priceRange.value = priceRange.max;
        updatePriceRangeValue();
    }
    
    // Clear search
    const searchInputs = document.querySelectorAll('#searchInput, #heroSearchInput');
    searchInputs.forEach(input => input.value = '');
    
    // Reset products
    filteredProducts = [...allProducts];
    currentPage = 1;
    renderProducts();
    updateResultsCount();
    
    showNotification('All filters cleared', 'info');
}

/**
 * Initialize filters
 */
function initializeFilters() {
    // Set up filter event listeners are already handled in setupEventListeners
    console.log('Filters initialized');
}

/**
 * Setup price range slider
 */
function setupPriceRange() {
    const priceRange = document.getElementById('priceRangeSlider');
    const priceValue = document.getElementById('priceRangeValue');
    
    if (priceRange && priceValue) {
        priceRange.addEventListener('input', function() {
            updatePriceRangeValue();
            applyFilters();
        });
        
        // Set initial value
        updatePriceRangeValue();
    }
}

/**
 * Update price range display value
 */
function updatePriceRangeValue() {
    const priceRange = document.getElementById('priceRangeSlider');
    const priceValue = document.getElementById('priceRangeValue');
    
    if (priceRange && priceValue) {
        priceValue.textContent = `${priceRange.value}`;
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    // Search button handlers
    const searchButtons = document.querySelectorAll('button[onclick="performSearch()"]');
    searchButtons.forEach(button => {
        button.addEventListener('click', performSearch);
    });
}

/**
 * Update results count display
 */
function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        const showing = Math.min(currentPage * productsPerPage, filteredProducts.length);
        const total = allProducts.length;
        resultsCount.textContent = `Showing ${showing} of ${filteredProducts.length} products (${total} total)`;
    }
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (!pagination) return;
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">Previous</a>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1); return false;">1</a></li>`;
        if (startPage > 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">Next</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

/**
 * Go to specific page
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
    
    // Scroll to top of products
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Get selected checkbox values
 */
function getSelectedCheckboxValues(selector) {
    const checkboxes = document.querySelectorAll(selector);
    return Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
}

/**
 * Show loading state
 */
function showLoading() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading products...</span>
                </div>
                <p class="mt-3">Loading water testing equipment...</p>
            </div>
        `;
    }
}

/**
 * Hide loading state
 */
function hideLoading() {
    // Loading state is replaced by renderProducts()
}

/**
 * Show notification
 */
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

/**
 * Get notification icon
 */
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
 * Debounce function for search
 */
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

/**
 * Mock products data
 */
function getMockProducts() {
    return [
        {
            id: 1,
            name: 'pH Meter Pro Digital',
            type: 'pH',
            description: 'Professional grade digital pH meter with automatic temperature compensation and calibration.',
            price: 89.99,
            originalPrice: 109.99,
            discount: 18,
            rating: 4.5,
            reviews: 128,
            vendor: 'Amazon',
            vendorLink: 'https://amazon.com/ph-meter-pro',
            imageUrl: '/assets/images/ph-meter-pro.jpg',
            inStock: true,
            fastShipping: true,
            dateAdded: '2025-01-10',
            specifications: {
                'Measurement Range': '0.00 - 14.00 pH',
                'Accuracy': '±0.01 pH',
                'Temperature Range': '0°C to 50°C',
                'Calibration': 'Automatic 3-point',
                'Display': 'LCD with backlight',
                'Power': '4 x AA batteries'
            }
        },
        {
            id: 2,
            name: 'TDS Tester Digital Pen',
            type: 'TDS',
            description: 'Compact digital TDS meter for measuring total dissolved solids in water with high accuracy.',
            price: 24.99,
            rating: 4.3,
            reviews: 89,
            vendor: 'Jumia',
            vendorLink: 'https://jumia.co.ke/tds-tester',
            imageUrl: '/assets/images/tds-tester.jpg',
            inStock: true,
            fastShipping: false,
            dateAdded: '2025-01-08',
            specifications: {
                'Measurement Range': '0-9990 ppm',
                'Accuracy': '±2%',
                'Temperature Compensation': 'Automatic',
                'Display': '3.5 digit LCD',
                'Power': '2 x 1.5V batteries'
            }
        },
        {
            id: 3,
            name: 'Turbidity Sensor Professional',
            type: 'Turbidity',
            description: 'High precision turbidity sensor for water clarity measurement in laboratory and field conditions.',
            price: 156.00,
            rating: 4.7,
            reviews: 45,
            vendor: 'Amazon',
            vendorLink: 'https://amazon.com/turbidity-sensor',
            imageUrl: '/assets/images/turbidity-sensor.jpg',
            inStock: true,
            fastShipping: true,
            dateAdded: '2025-01-05',
            specifications: {
                'Measurement Range': '0-1000 NTU',
                'Accuracy': '±5% or ±0.5 NTU',
                'Output Signal': '4-20mA',
                'Power Supply': '12-24V DC',
                'Material': 'Stainless Steel 316'
            }
        },
        {
            id: 4,
            name: 'Conductivity Meter Portable',
            type: 'Conductivity',
            description: 'Portable conductivity meter for measuring electrical conductivity and salinity in water samples.',
            price: 67.50,
            rating: 4.2,
            reviews: 67,
            vendor: 'eBay',
            vendorLink: 'https://ebay.com/conductivity-meter',
            imageUrl: '/assets/images/conductivity-meter.jpg',
            inStock: false,
            fastShipping: false,
            dateAdded: '2025-01-03',
            specifications: {
                'Conductivity Range': '0-200mS/cm',
                'TDS Range': '0-100ppt',
                'Salinity Range': '0-100ppt',
                'Accuracy': '±2% F.S.',
                'Temperature Range': '0-50°C'
            }
        },
        {
            id: 5,
            name: 'Chlorine Test Kit Professional',
            type: 'Chlorine',
            description: 'Complete chlorine testing kit for measuring free and total chlorine levels in water.',
            price: 45.99,
            rating: 4.4,
            reviews: 156,
            vendor: 'Amazon',
            vendorLink: 'https://amazon.com/chlorine-test-kit',
            imageUrl: '/assets/images/chlorine-kit.jpg',
            inStock: true,
            fastShipping: true,
            dateAdded: '2025-01-01',
            specifications: {
                'Free Chlorine Range': '0-3.5 mg/L',
                'Total Chlorine Range': '0-3.5 mg/L',
                'Method': 'DPD Colorimetric',
                'Test Quantity': '100 tests',
                'Accuracy': '±0.1 mg/L'
            }
        },
        {
            id: 6,
            name: 'Dissolved Oxygen Meter',
            type: 'Dissolved Oxygen',
            description: 'Digital dissolved oxygen meter with automatic temperature and salinity compensation.',
            price: 234.00,
            rating: 4.6,
            reviews: 34,
            vendor: 'AliExpress',
            vendorLink: 'https://aliexpress.com/do-meter',
            imageUrl: '/assets/images/do-meter.jpg',
            inStock: true,
            fastShipping: false,
            dateAdded: '2024-12-28',
            specifications: {
                'DO Range': '0-20.0 mg/L',
                'Accuracy': '±0.3 mg/L',
                'Temperature Range': '0-50°C',
                'Calibration': '1 or 2 point',
                'Memory': '500 data points',
                'Interface': 'USB'
            }
        }
        // Add more mock products as needed
    ];
}

// Make functions globally available
window.performSearch = performSearch;
window.clearAllFilters = clearAllFilters;
window.toggleCompare = toggleCompare;
window.viewProductDetails = viewProductDetails;
window.showComparison = showComparison;
window.clearComparison = clearComparison;
window.goToPage = goToPage;

// Auto-show comparison modal when compare button in floating element is clicked
document.addEventListener('click', function(e) {
    if (e.target.closest('[data-bs-target="#compareModal"]')) {
        showComparison();
    }
});

console.log('Marketplace JavaScript loaded successfully');