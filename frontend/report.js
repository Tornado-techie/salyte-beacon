/**
 * Community Reporting JavaScript for Salyte Beacon
 * Handles report submission, file uploads, map integration, and report management
 * Version: 2.0
 */

// Global variables
let reportMap;
let selectedLocation = null;
let uploadedPhotos = [];
let allReports = [];
let filteredReports = [];
let currentPage = 1;
let reportsPerPage = 12;
let isOnline = navigator.onLine;

// Initialize community reporting on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeCommunityReporting();
});

/**
 * Initialize all community reporting functionality
 */
function initializeCommunityReporting() {
    // Setup event listeners
    setupEventListeners();
    
    // Initialize form functionality
    initializeReportForm();
    
    // Initialize map
    initializeLocationMap();
    
    // Setup file upload
    setupFileUpload();
    
    // Load existing reports
    loadReports();
    
    // Update statistics
    updateStatistics();
    
    // Setup offline handling
    setupOfflineHandling();
    
    // Setup auto-save
    setupAutoSave();
    
    console.log('Community Reporting initialized successfully');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Form submission
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', handleFormSubmission);
    }

    // Report type selection
    const reportTypeCards = document.querySelectorAll('.report-type-card');
    reportTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            selectReportType(this.dataset.type);
        });
    });

    // Filter controls
    const filterSelects = document.querySelectorAll('.reports-filters select');
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });

    // Photo upload
    const photoUploadArea = document.getElementById('photoUploadArea');
    const photoInput = document.getElementById('photoInput');
    
    if (photoUploadArea && photoInput) {
        photoUploadArea.addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', handleFileSelection);
        
        // Drag and drop
        photoUploadArea.addEventListener('dragover', handleDragOver);
        photoUploadArea.addEventListener('dragleave', handleDragLeave);
        photoUploadArea.addEventListener('drop', handleDrop);
    }

    // Search functionality
    const searchInput = document.getElementById('reportSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Anonymous checkbox toggle
    const anonymousCheckbox = document.getElementById('anonymousSubmission');
    if (anonymousCheckbox) {
        anonymousCheckbox.addEventListener('change', toggleContactFields);
    }

    // Emergency button
    const emergencyBtn = document.getElementById('emergencyBtn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', callEmergency);
    }

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreReports);
    }

    // Modal close events
    setupModalEventListeners();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
    // Success modal buttons
    const trackBtn = document.getElementById('trackReportBtn');
    const shareBtn = document.getElementById('shareReportBtn');
    const anotherBtn = document.getElementById('submitAnotherBtn');
    
    if (trackBtn) trackBtn.addEventListener('click', trackReport);
    if (shareBtn) shareBtn.addEventListener('click', shareReport);
    if (anotherBtn) anotherBtn.addEventListener('click', submitAnotherReport);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.getElementById('reportForm');
            if (form && !document.querySelector('.modal.show')) {
                e.preventDefault();
                handleFormSubmission({ target: form, preventDefault: () => {} });
            }
        }
        
        // Escape to clear form
        if (e.key === 'Escape' && !document.querySelector('.modal.show')) {
            clearForm();
        }
    });
}

/**
 * Initialize report form
 */
function initializeReportForm() {
    // Set incident date to current time
    const incidentDateInput = document.getElementById('incidentDate');
    if (incidentDateInput) {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        incidentDateInput.value = localDateTime;
    }

    // Setup form validation
    setupFormValidation();
    
    // Load saved form data
    loadSavedFormData();
    
    // Setup character counters
    setupCharacterCounters();
}

/**
 * Setup character counters for text areas
 */
function setupCharacterCounters() {
    const textareas = document.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
        const maxLength = textarea.getAttribute('maxlength');
        const counter = document.createElement('div');
        counter.className = 'character-counter text-muted small mt-1';
        counter.textContent = `0 / ${maxLength}`;
        textarea.parentNode.appendChild(counter);
        
        textarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            counter.textContent = `${currentLength} / ${maxLength}`;
            counter.className = currentLength > maxLength * 0.9 
                ? 'character-counter text-warning small mt-1' 
                : 'character-counter text-muted small mt-1';
        });
    });
}

/**
 * Setup form validation
 */
function setupFormValidation() {
    const form = document.getElementById('reportForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                validateField(this);
            }
        });
    });

    // Custom validation rules
    const emailInput = document.getElementById('reporterEmail');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailPattern.test(this.value)) {
                this.setCustomValidity('Please enter a valid email address');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    const phoneInput = document.getElementById('reporterPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            const phonePattern = /^[\+]?[\d\s\-\(\)]+$/;
            if (this.value && !phonePattern.test(this.value)) {
                this.setCustomValidity('Please enter a valid phone number');
            } else {
                this.setCustomValidity('');
            }
        });
    }
}

/**
 * Validate individual form field
 */
function validateField(field) {
    const isValid = field.checkValidity();
    
    if (isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        hideFieldError(field);
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        showFieldError(field, field.validationMessage);
    }
    
    return isValid;
}

/**
 * Show field error message
 */
function showFieldError(field, message) {
    let errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        field.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

/**
 * Hide field error message
 */
function hideFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * Toggle contact fields based on anonymous submission
 */
function toggleContactFields() {
    const anonymousCheckbox = document.getElementById('anonymousSubmission');
    const contactFields = document.querySelectorAll('.contact-field');
    
    if (anonymousCheckbox && anonymousCheckbox.checked) {
        contactFields.forEach(field => {
            field.style.display = 'none';
            const input = field.querySelector('input');
            if (input) {
                input.removeAttribute('required');
            }
        });
    } else {
        contactFields.forEach(field => {
            field.style.display = 'block';
            const input = field.querySelector('input[data-required]');
            if (input) {
                input.setAttribute('required', 'required');
            }
        });
    }
}

/**
 * Initialize location map
 */
function initializeLocationMap() {
    const mapContainer = document.getElementById('locationMap');
    if (!mapContainer) return;

    try {
        // Initialize Leaflet map for location selection
        reportMap = L.map('locationMap', {
            center: [-1.2921, 36.8219], // Nairobi
            zoom: 10
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(reportMap);

        // Handle map clicks for location selection
        reportMap.on('click', function(e) {
            selectLocationOnMap(e.latlng);
        });

        // Try to get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const userLocation = [position.coords.latitude, position.coords.longitude];
                reportMap.setView(userLocation, 12);
                
                // Add user location marker
                const userIcon = L.divIcon({
                    html: '<div style="background: #007bff; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });
                
                L.marker(userLocation, { icon: userIcon, isPermanent: true })
                    .addTo(reportMap)
                    .bindPopup('Your current location');
            }, function(error) {
                console.warn('Geolocation error:', error);
                showNotification('Could not get your location. Please select manually on the map.', 'warning');
            });
        }

        // Add search control
        addMapSearchControl();

    } catch (error) {
        console.error('Error initializing location map:', error);
        mapContainer.innerHTML = '<p class="text-center text-muted p-3">Map not available. Please enter coordinates manually.</p>';
    }
}

/**
 * Add search control to map
 */
function addMapSearchControl() {
    const searchControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function() {
            const container = L.DomUtil.create('div', 'leaflet-control-search');
            container.innerHTML = `
                <input type="text" placeholder="Search location..." id="mapSearchInput" class="form-control form-control-sm">
                <button type="button" id="mapSearchBtn" class="btn btn-sm btn-primary">
                    <i class="fas fa-search"></i>
                </button>
            `;
            
            L.DomEvent.disableClickPropagation(container);
            
            const searchInput = container.querySelector('#mapSearchInput');
            const searchBtn = container.querySelector('#mapSearchBtn');
            
            searchBtn.addEventListener('click', () => searchLocation(searchInput.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchLocation(searchInput.value);
                }
            });
            
            return container;
        }
    });
    
    reportMap.addControl(new searchControl());
}

/**
 * Search for location on map
 */
async function searchLocation(query) {
    if (!query.trim()) return;
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ke&limit=5`);
        const results = await response.json();
        
        if (results.length > 0) {
            const result = results[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            
            reportMap.setView([lat, lng], 15);
            selectLocationOnMap({ lat, lng });
            
            showNotification(`Found: ${result.display_name}`, 'success');
        } else {
            showNotification('Location not found. Try a different search term.', 'warning');
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Search failed. Please try again.', 'error');
    }
}

/**
 * Select location on map
 */
function selectLocationOnMap(latlng) {
    selectedLocation = latlng;
    
    // Update form fields
    document.getElementById('latitude').value = latlng.lat.toFixed(6);
    document.getElementById('longitude').value = latlng.lng.toFixed(6);
    
    // Update coordinates display
    const coordsDisplay = document.getElementById('selectedCoords');
    if (coordsDisplay) {
        coordsDisplay.textContent = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
    }
    
    // Clear existing location markers and add new one
    reportMap.eachLayer(layer => {
        if (layer instanceof L.Marker && !layer.options.isPermanent) {
            reportMap.removeLayer(layer);
        }
    });
    
    const marker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            html: '<div style="background: #dc3545; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(reportMap);
    
    marker.bindPopup('Selected incident location').openPopup();
    
    // Reverse geocode to get address
    reverseGeocode(latlng.lat, latlng.lng);
    
    showNotification('Location selected successfully', 'success');
}

/**
 * Reverse geocode coordinates to get address
 */
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        const result = await response.json();
        
        if (result && result.address) {
            const locationName = document.getElementById('locationName');
            const county = document.getElementById('county');
            
            if (locationName && !locationName.value) {
                locationName.value = result.address.suburb || result.address.neighbourhood || result.address.village || '';
            }
            
            if (county) {
                const countyName = result.address.county || result.address.state_district || '';
                if (countyName) {
                    // Try to match with existing options
                    const options = Array.from(county.options);
                    const matchingOption = options.find(option => 
                        option.text.toLowerCase().includes(countyName.toLowerCase()) ||
                        countyName.toLowerCase().includes(option.text.toLowerCase())
                    );
                    
                    if (matchingOption) {
                        county.value = matchingOption.value;
                    }
                }
            }
        }
    } catch (error) {
        console.warn('Reverse geocoding failed:', error);
    }
}

/**
 * Select report type
 */
function selectReportType(type) {
    // Clear previous selections
    document.querySelectorAll('.report-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select new type
    const selectedCard = document.querySelector(`[data-type="${type}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Update radio button
    const radioButton = document.getElementById(`type-${type}`);
    if (radioButton) {
        radioButton.checked = true;
    }
    
    // Update form based on type
    updateFormBasedOnType(type);
    
    // Save to localStorage
    saveFormData();
}

/**
 * Update form fields based on report type
 */
function updateFormBasedOnType(type) {
    const severitySelect = document.getElementById('severity');
    const descriptionField = document.getElementById('description');
    
    // Update placeholder text based on type
    const placeholders = {
        contamination: 'Describe the contamination details, symptoms noticed, possible sources, any affected people...',
        shortage: 'Describe the water shortage situation, duration, affected areas, impact on daily activities...',
        quality: 'Describe the water quality issues, taste, odor, color, appearance, or any changes noticed...',
        infrastructure: 'Describe the infrastructure problems, broken equipment, leaks, maintenance issues...'
    };
    
    if (descriptionField) {
        descriptionField.placeholder = placeholders[type] || 'Provide detailed description of the issue';
    }
    
    // Auto-suggest severity for critical types
    if (type === 'contamination' && severitySelect) {
        severitySelect.value = 'high';
        showNotification('High severity suggested for contamination reports', 'info');
    }
    
    // Show relevant fields
    updateRelevantFields(type);
}

/**
 * Update relevant fields based on report type
 */
function updateRelevantFields(type) {
    const affectedPeopleField = document.getElementById('affectedPeopleField');
    const additionalInfoField = document.getElementById('additionalInfoField');
    
    if (type === 'contamination' || type === 'shortage') {
        if (affectedPeopleField) {
            affectedPeopleField.style.display = 'block';
            affectedPeopleField.querySelector('input').setAttribute('required', 'required');
        }
    } else {
        if (affectedPeopleField) {
            affectedPeopleField.style.display = 'none';
            affectedPeopleField.querySelector('input').removeAttribute('required');
        }
    }
}

/**
 * Setup file upload functionality
 */
function setupFileUpload() {
    const photoUploadArea = document.getElementById('photoUploadArea');
    const photoInput = document.getElementById('photoInput');
    
    if (!photoUploadArea || !photoInput) return;
    
    // File input change handler
    photoInput.addEventListener('change', handleFileSelection);
    
    // Update upload area text
    updateUploadAreaText();
}

/**
 * Update upload area text based on uploaded photos
 */
function updateUploadAreaText() {
    const uploadText = document.querySelector('#photoUploadArea .upload-text');
    if (!uploadText) return;
    
    if (uploadedPhotos.length === 0) {
        uploadText.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-2x mb-2"></i>
            <p class="mb-1"><strong>Click to upload photos</strong> or drag and drop</p>
            <small class="text-muted">Maximum 5 photos, 10MB each (JPG, PNG, HEIC)</small>
        `;
    } else {
        uploadText.innerHTML = `
            <i class="fas fa-images fa-2x mb-2"></i>
            <p class="mb-1"><strong>${uploadedPhotos.length}/5 photos uploaded</strong></p>
            <small class="text-muted">Click to add more photos</small>
        `;
    }
}

/**
 * Handle file selection
 */
function handleFileSelection(e) {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    processFiles(files);
    
    // Clear input to allow selecting the same file again
    e.target.value = '';
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

/**
 * Handle drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

/**
 * Process uploaded files
 */
function processFiles(files) {
    const maxFiles = 5;
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
    
    // Check if adding these files would exceed the limit
    if (uploadedPhotos.length + files.length > maxFiles) {
        showNotification(`Maximum ${maxFiles} photos allowed. You can upload ${maxFiles - uploadedPhotos.length} more.`, 'warning');
        return;
    }
    
    const validFiles = [];
    
    files.forEach(file => {
        // Check file size
        if (file.size > maxFileSize) {
            showNotification(`${file.name} is too large (max 10MB)`, 'error');
            return;
        }
        
        // Check file type
        if (!allowedTypes.includes(file.type.toLowerCase())) {
            showNotification(`${file.name} is not a supported image format`, 'error');
            return;
        }
        
        // Check for duplicates
        const isDuplicate = uploadedPhotos.some(photo => 
            photo.name === file.name && photo.size === file.size
        );
        
        if (isDuplicate) {
            showNotification(`${file.name} is already uploaded`, 'warning');
            return;
        }
        
        validFiles.push(file);
    });
    
    // Process valid files
    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoData = {
                id: Date.now() + Math.random(),
                file: file,
                dataUrl: e.target.result,
                name: file.name,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            
            uploadedPhotos.push(photoData);
            updatePhotoPreview();
            updateUploadAreaText();
            saveFormData(); // Auto-save
        };
        reader.readAsDataURL(file);
    });
    
    if (validFiles.length > 0) {
        showNotification(`${validFiles.length} photo(s) added successfully`, 'success');
    }
}

/**
 * Update photo preview
 */
function updatePhotoPreview() {
    const previewContainer = document.getElementById('photoPreview');
    if (!previewContainer) return;
    
    if (uploadedPhotos.length === 0) {
        previewContainer.style.display = 'none';
        return;
    }
    
    previewContainer.style.display = 'grid';
    
    const previewHTML = uploadedPhotos.map((photo, index) => `
        <div class="photo-preview-item" data-photo-id="${photo.id}">
            <img src="${photo.dataUrl}" alt="${photo.name}" loading="lazy">
            <div class="photo-overlay">
                <button type="button" class="photo-remove-btn" onclick="removePhoto('${photo.id}')" title="Remove photo">
                    <i class="fas fa-times"></i>
                </button>
                <div class="photo-info">
                    <small>${formatFileSize(photo.size)}</small>
                </div>
            </div>
            <div class="photo-name">
                ${photo.name.length > 20 ? photo.name.substring(0, 20) + '...' : photo.name}
            </div>
        </div>
    `).join('');
    
    previewContainer.innerHTML = previewHTML;
}

/**
 * Remove photo from upload list
 */
function removePhoto(photoId) {
    uploadedPhotos = uploadedPhotos.filter(photo => photo.id != photoId);
    updatePhotoPreview();
    updateUploadAreaText();
    saveFormData(); // Auto-save
    showNotification('Photo removed', 'info');
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Handle form submission
 */
async function handleFormSubmission(e) {
    e.preventDefault();
    
    // Validate form
    const form = e.target;
    const formData = new FormData(form);
    
    if (!validateForm(form)) {
        showNotification('Please correct the errors in the form', 'error');
        scrollToFirstError();
        return;
    }
    
    // Check if report type is selected
    const reportType = formData.get('reportType');
    if (!reportType) {
        showNotification('Please select a report type', 'error');
        scrollToElement(document.querySelector('.report-types'));
        return;
    }
    
    // Check if location is selected
    if (!selectedLocation) {
        showNotification('Please select a location on the map', 'error');
        scrollToElement(document.getElementById('locationMap'));
        return;
    }
    
    // Prepare report data
    const reportData = {
        id: generateReportId(),
        trackingId: generateTrackingId(),
        type: reportType,
        title: generateReportTitle(reportType, formData.get('locationName')),
        locationName: formData.get('locationName'),
        county: formData.get('county'),
        latitude: parseFloat(formData.get('latitude')) || null,
        longitude: parseFloat(formData.get('longitude')) || null,
        severity: formData.get('severity'),
        affectedPeople: parseInt(formData.get('affected')) || 0,
        description: formData.get('description'),
        incidentDate: formData.get('incidentDate'),
        reporterName: formData.get('anonymousSubmission') === 'on' ? null : formData.get('reporterName'),
        reporterPhone: formData.get('anonymousSubmission') === 'on' ? null : formData.get('reporterPhone'),
        reporterEmail: formData.get('anonymousSubmission') === 'on' ? null : formData.get('reporterEmail'),
        isAnonymous: formData.get('anonymousSubmission') === 'on',
        allowFollowUp: formData.get('followUpConsent') === 'on',
        additionalInfo: formData.get('additionalInfo') || null,
        reportedElsewhere: formData.get('reportedElsewhere') === 'on',
        photos: uploadedPhotos.map(photo => ({
            id: photo.id,
            name: photo.name,
            size: photo.size,
            data: photo.dataUrl
        })),
        status: 'submitted',
        priority: calculatePriority(reportType, formData.get('severity')),
        submittedAt: new Date().toISOString(),
        coordinates: [selectedLocation.lat, selectedLocation.lng]
    };
    
    try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        setLoadingState(submitButton, true);
        
        // Submit to API or store locally if offline
        let result;
        if (isOnline) {
            result = await submitOnline(reportData);
        } else {
            result = await submitOffline(reportData);
        }
        
        // Show success modal
        showSuccessModal(result.trackingId);
        
        // Reset form
        resetForm();
        
        // Add to local reports for immediate display
        allReports.unshift(reportData);
        filteredReports = [...allReports];
        renderReports();
        updateStatistics();
        
        // Clear saved form data
        clearSavedFormData();
        
    } catch (error) {
        console.error('Error submitting report:', error);
        showNotification('Failed to submit report. Please try again.', 'error');
    } finally {
        const submitButton = form.querySelector('button[type="submit"]');
        setLoadingState(submitButton, false);
    }
}

/**
 * Submit report online
 */
async function submitOnline(reportData) {
    const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(reportData)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Submit report offline
 */
async function submitOffline(reportData) {
    // Store in localStorage for later sync
    const offlineReports = JSON.parse(localStorage.getItem('salyte_offline_reports') || '[]');
    offlineReports.push(reportData);
    localStorage.setItem('salyte_offline_reports', JSON.stringify(offlineReports));
    
    showNotification('Report saved offline. Will sync when connection is restored.', 'warning');
    
    return { trackingId: reportData.trackingId };
}

/**
 * Generate report ID
 */
function generateReportId() {
    return 'rpt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate report title
 */
function generateReportTitle(type, locationName) {
    const titles = {
        contamination: `Water Contamination in ${locationName}`,
        shortage: `Water Shortage in ${locationName}`,
        quality: `Water Quality Issues in ${locationName}`,
        infrastructure: `Infrastructure Problem in ${locationName}`
    };
    return titles[type] || `Water Issue in ${locationName}`;
}

/**
 * Calculate report priority
 */
function calculatePriority(type, severity) {
    if (type === 'contamination' || severity === 'high') {
        return 'urgent';
    } else if (severity === 'medium') {
        return 'high';
    }
    return 'normal';
}

/**
 * Scroll to first form error
 */
function scrollToFirstError() {
    const firstError = document.querySelector('.is-invalid');
    if (firstError) {
        scrollToElement(firstError);
    }
}

/**
 * Scroll to element with smooth behavior
 */
function scrollToElement(element) {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Validate entire form
 */
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Additional custom validations
    if (!selectedLocation) {
        isValid = false;
    }
    
    const reportType = form.querySelector('input[name="reportType"]:checked');
    if (!reportType) {
        isValid = false;
    }
    
    return isValid;
}

/**
 * Show success modal
 */
function showSuccessModal(trackingId) {
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    const trackingIdElement = document.getElementById('reportTrackingId');
    
    if (trackingIdElement) {
        trackingIdElement.textContent = trackingId;
    }
    
    // Update modal content based on online status
    const modalBody = document.querySelector('#successModal .modal-body');
    if (modalBody) {
        const statusMessage = isOnline 
            ? '<p class="text-success"><i class="fas fa-check-circle me-2"></i>Your report has been submitted successfully.</p>'
            : '<p class="text-warning"><i class="fas fa-wifi me-2"></i>Your report has been saved offline and will be submitted when internet connection is restored.</p>';
        
        modalBody.querySelector('.status-message').innerHTML = statusMessage;
    }
    
    modal.show();
}

/**
 * Generate tracking ID
 */
function generateTrackingId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    
    return `WR-${year}${month}${day}-${random}`;
}

/**
 * Reset form
 */
function resetForm() {
    const form = document.getElementById('reportForm');
    if (form) {
        form.reset();
    }
    
    // Clear selections
    document.querySelectorAll('.report-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Clear uploaded photos
    uploadedPhotos = [];
    updatePhotoPreview();
    updateUploadAreaText();
    
    // Clear location
    selectedLocation = null;
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    
    const coordsDisplay = document.getElementById('selectedCoords');
    if (coordsDisplay) {
        coordsDisplay.textContent = 'Click on map to select';
    }
    
    // Clear map markers
    if (reportMap) {
        reportMap.eachLayer(layer => {
            if (layer instanceof L.Marker && !layer.options.isPermanent) {
                reportMap.removeLayer(layer);
            }
        });
    }
    
    // Remove validation classes
    form.querySelectorAll('.is-valid, .is-invalid').forEach(element => {
        element.classList.remove('is-valid', 'is-invalid');
    });
    
    // Reset incident date
    const incidentDateInput = document.getElementById('incidentDate');
    if (incidentDateInput) {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        incidentDateInput.value = localDateTime;
    }
    
    // Show contact fields
    toggleContactFields();
}

/**
 * Load existing reports
 */
async function loadReports() {
    try {
        // Show loading state
        showLoadingState();
        
        // Try to load from API
        if (isOnline) {
            const response = await fetch('/api/reports');
            
            if (response.ok) {
                allReports = await response.json();
            } else {
                throw new Error('Failed to load reports from server');
            }
        } else {
            // Load from localStorage when offline
            const savedReports = localStorage.getItem('salyte_cached_reports');
            allReports = savedReports ? JSON.parse(savedReports) : [];
        }
        
        // Fallback to mock data if no reports available
        if (allReports.length === 0) {
            allReports = getMockReports();
        }
        
        // Add offline reports
        const offlineReports = JSON.parse(localStorage.getItem('salyte_offline_reports') || '[]');
        allReports = [...offlineReports, ...allReports];
        
        filteredReports = [...allReports];
        renderReports();
        updateLocationFilter();
        
        // Cache reports for offline use
        localStorage.setItem('salyte_cached_reports', JSON.stringify(allReports));
        
    } catch (error) {
        console.error('Error loading reports:', error);
        
        // Load cached reports
        const cachedReports = localStorage.getItem('salyte_cached_reports');
        allReports = cachedReports ? JSON.parse(cachedReports) : getMockReports();
        
        filteredReports = [...allReports];
        renderReports();
        
        showNotification('Using cached reports. Some data may be outdated.', 'warning');
    } finally {
        hideLoadingState();
    }
}

/**
 * Show loading state for reports
 */
function showLoadingState() {
    const reportsGrid = document.getElementById('reportsGrid');
    if (reportsGrid) {
        reportsGrid.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Loading reports...</p>
                </div>
            </div>
        `;
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Loading state will be replaced by rendered reports
}

/**
 * Update location filter options
 */
function updateLocationFilter() {
    const locationFilter = document.getElementById('locationFilter');
    if (!locationFilter) return;
    
    const counties = [...new Set(allReports.map(report => report.county))].filter(Boolean).sort();
    
    // Clear existing options except "All Locations"
    while (locationFilter.children.length > 1) {
        locationFilter.removeChild(locationFilter.lastChild);
    }
    
    // Add county options
    counties.forEach(county => {
        const option = document.createElement('option');
        option.value = county;
        option.textContent = county.charAt(0).toUpperCase() + county.slice(1);
        locationFilter.appendChild(option);
    });
}

/**
 * Handle search functionality
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredReports = [...allReports];
    } else {
        filteredReports = allReports.filter(report => 
            report.title.toLowerCase().includes(searchTerm) ||
            report.description.toLowerCase().includes(searchTerm) ||
            report.locationName.toLowerCase().includes(searchTerm) ||
            report.county.toLowerCase().includes(searchTerm) ||
            report.trackingId.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderReports();
}

/**
 * Apply filters to reports
 */
function applyFilters() {
    const typeFilter = document.getElementById('typeFilter')?.value;
    const statusFilter = document.getElementById('statusFilter')?.value;
    const severityFilter = document.getElementById('severityFilter')?.value;
    const locationFilter = document.getElementById('locationFilter')?.value;
    
    filteredReports = allReports.filter(report => {
        if (typeFilter && report.type !== typeFilter) return false;
        if (statusFilter && report.status !== statusFilter) return false;
        if (severityFilter && report.severity !== severityFilter) return false;
        if (locationFilter && report.county !== locationFilter) return false;
        
        return true;
    });
    
    currentPage = 1;
    renderReports();
    
    // Update results count
    updateResultsCount();
}

/**
 * Update results count display
 */
function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        const total = filteredReports.length;
        const showing = Math.min(currentPage * reportsPerPage, total);
        resultsCount.textContent = `Showing ${showing} of ${total} reports`;
    }
}

/**
 * Render reports grid
 */
function renderReports() {
    const reportsGrid = document.getElementById('reportsGrid');
    if (!reportsGrid) return;
    
    const startIndex = (currentPage - 1) * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    const reportsToShow = filteredReports.slice(startIndex, endIndex);
    
    if (reportsToShow.length === 0) {
        reportsGrid.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h4>No reports found</h4>
                    <p class="text-muted">Try adjusting your filters or submit the first report</p>
                    <button class="btn btn-primary" onclick="scrollToReportForm()">
                        <i class="fas fa-plus me-2"></i>Submit Report
                    </button>
                </div>
            </div>
        `;
        updateLoadMoreButton();
        updateResultsCount();
        return;
    }
    
    const reportsHTML = reportsToShow.map(report => createReportCard(report)).join('');
    reportsGrid.innerHTML = reportsHTML;
    
    updateLoadMoreButton();
    updateResultsCount();
}

/**
 * Create individual report card
 */
function createReportCard(report) {
    const statusBadge = `<span class="status-badge status-${report.status}">${report.status.toUpperCase().replace('-', ' ')}</span>`;
    const severityBadge = `<span class="severity-badge severity-${report.severity}">${report.severity.toUpperCase()}</span>`;
    const priorityIcon = report.priority === 'urgent' ? '<i class="fas fa-exclamation-triangle text-danger me-1"></i>' : '';
    const offlineIndicator = report.submittedAt && !isOnline ? '<i class="fas fa-wifi-slash text-warning" title="Submitted offline"></i>' : '';
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="report-card h-100" onclick="viewReportDetails('${report.id}')">
                <div class="report-header">
                    <div class="report-id d-flex align-items-center justify-content-between">
                        <span>Report #${report.trackingId}</span>
                        ${offlineIndicator}
                    </div>
                    <h5 class="report-title">${priorityIcon}${report.title}</h5>
                    <div class="report-location">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${report.locationName}, ${report.county.charAt(0).toUpperCase() + report.county.slice(1)}
                    </div>
                </div>
                <div class="report-body">
                    <p class="report-description">${truncateText(report.description, 100)}</p>
                    ${report.photos && report.photos.length > 0 ? `
                        <div class="report-photos-indicator">
                            <i class="fas fa-camera me-1"></i>
                            ${report.photos.length} photo${report.photos.length > 1 ? 's' : ''}
                        </div>
                    ` : ''}
                    ${report.affectedPeople > 0 ? `
                        <div class="affected-people">
                            <i class="fas fa-users me-1"></i>
                            ${report.affectedPeople} people affected
                        </div>
                    ` : ''}
                </div>
                <div class="report-footer">
                    <div class="report-badges">
                        ${statusBadge}
                        ${severityBadge}
                    </div>
                    <div class="report-date">
                        <i class="fas fa-calendar me-1"></i>
                        ${formatDate(report.submittedAt)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Load more reports
 */
function loadMoreReports() {
    currentPage++;
    const startIndex = (currentPage - 1) * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    const newReports = filteredReports.slice(startIndex, endIndex);
    
    if (newReports.length > 0) {
        const reportsGrid = document.getElementById('reportsGrid');
        const newReportsHTML = newReports.map(report => createReportCard(report)).join('');
        reportsGrid.insertAdjacentHTML('beforeend', newReportsHTML);
        
        updateLoadMoreButton();
        updateResultsCount();
    }
}

/**
 * Update load more button visibility
 */
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
    
    if (currentPage >= totalPages) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

/**
 * Update statistics
 */
function updateStatistics() {
    const stats = calculateReportStatistics(allReports);
    
    // Update hero stats
    updateStatElement('totalReports', stats.total);
    updateStatElement('resolvedReports', stats.resolved);
    updateStatElement('avgResponseTime', stats.avgResponseTime);
    updateStatElement('criticalReports', stats.critical);
    
    // Update category stats
    updateStatElement('contaminationReports', stats.contamination);
    updateStatElement('shortageReports', stats.shortage);
    updateStatElement('infrastructureReports', stats.infrastructure);
    updateStatElement('qualityReports', stats.quality);
    
    // Update trend indicators
    updateTrendIndicators(stats);
}

/**
 * Update individual stat element
 */
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        if (typeof value === 'number') {
            animateNumber(element, value);
        } else {
            element.textContent = value;
        }
    }
}

/**
 * Animate number counting up
 */
function animateNumber(element, targetValue) {
    const startValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const duration = 1000; // 1 second
    const startTime = Date.now();
    
    function updateNumber() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

/**
 * Update trend indicators
 */
function updateTrendIndicators(stats) {
    // This would typically compare with previous period data
    const trendElements = document.querySelectorAll('.trend-indicator');
    trendElements.forEach(element => {
        // Mock trend data - in real app, this would be calculated from historical data
        const isPositive = Math.random() > 0.5;
        const percentage = Math.floor(Math.random() * 20) + 1;
        
        element.className = `trend-indicator ${isPositive ? 'trend-up' : 'trend-down'}`;
        element.innerHTML = `
            <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
            ${percentage}%
        `;
    });
}

/**
 * Calculate report statistics
 */
function calculateReportStatistics(reports) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const stats = {
        total: reports.length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        critical: reports.filter(r => r.severity === 'high' || r.priority === 'urgent').length,
        contamination: reports.filter(r => r.type === 'contamination').length,
        shortage: reports.filter(r => r.type === 'shortage').length,
        infrastructure: reports.filter(r => r.type === 'infrastructure').length,
        quality: reports.filter(r => r.type === 'quality').length,
        recentReports: reports.filter(r => new Date(r.submittedAt) > lastMonth).length,
        avgResponseTime: calculateAverageResponseTime(reports)
    };
    
    return stats;
}

/**
 * Calculate average response time
 */
function calculateAverageResponseTime(reports) {
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.resolvedAt);
    
    if (resolvedReports.length === 0) return '24h';
    
    const totalResponseTime = resolvedReports.reduce((total, report) => {
        const submitted = new Date(report.submittedAt);
        const resolved = new Date(report.resolvedAt);
        return total + (resolved - submitted);
    }, 0);
    
    const avgResponseTime = totalResponseTime / resolvedReports.length;
    const hours = Math.floor(avgResponseTime / (1000 * 60 * 60));
    
    return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}

/**
 * Setup offline handling
 */
function setupOfflineHandling() {
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    updateConnectionStatus();
}

/**
 * Handle online event
 */
function handleOnline() {
    isOnline = true;
    updateConnectionStatus();
    syncOfflineReports();
    showNotification('Connection restored. Syncing offline data...', 'success');
}

/**
 * Handle offline event
 */
function handleOffline() {
    isOnline = false;
    updateConnectionStatus();
    showNotification('You are now offline. Reports will be saved locally.', 'warning');
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus() {
    const statusIndicator = document.getElementById('connectionStatus');
    if (statusIndicator) {
        if (isOnline) {
            statusIndicator.className = 'connection-status online';
            statusIndicator.innerHTML = '<i class="fas fa-wifi"></i> Online';
        } else {
            statusIndicator.className = 'connection-status offline';
            statusIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
        }
    }
}

/**
 * Sync offline reports
 */
async function syncOfflineReports() {
    const offlineReports = JSON.parse(localStorage.getItem('salyte_offline_reports') || '[]');
    
    if (offlineReports.length === 0) return;
    
    try {
        const syncPromises = offlineReports.map(async (report) => {
            try {
                await submitOnline(report);
                return report.id;
            } catch (error) {
                console.error('Failed to sync report:', report.id, error);
                return null;
            }
        });
        
        const syncedIds = await Promise.all(syncPromises);
        const successfulSyncs = syncedIds.filter(id => id !== null);
        
        if (successfulSyncs.length > 0) {
            // Remove synced reports from offline storage
            const remainingReports = offlineReports.filter(report => 
                !successfulSyncs.includes(report.id)
            );
            localStorage.setItem('salyte_offline_reports', JSON.stringify(remainingReports));
            
            showNotification(`${successfulSyncs.length} offline report(s) synced successfully`, 'success');
            
            // Reload reports to get updated data
            loadReports();
        }
        
    } catch (error) {
        console.error('Error syncing offline reports:', error);
        showNotification('Failed to sync some offline reports', 'error');
    }
}

/**
 * Setup auto-save functionality
 */
function setupAutoSave() {
    const form = document.getElementById('reportForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', debounce(saveFormData, 1000));
        input.addEventListener('input', debounce(saveFormData, 2000));
    });
    
    // Load saved data on startup
    loadSavedFormData();
}

/**
 * Save form data to localStorage
 */
function saveFormData() {
    const form = document.getElementById('reportForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {
        selectedLocation,
        uploadedPhotos: uploadedPhotos.map(photo => ({
            id: photo.id,
            name: photo.name,
            size: photo.size,
            dataUrl: photo.dataUrl
        })),
        formFields: {}
    };
    
    // Save form field values
    for (let [key, value] of formData.entries()) {
        data.formFields[key] = value;
    }
    
    // Save selected report type
    const selectedTypeCard = document.querySelector('.report-type-card.selected');
    if (selectedTypeCard) {
        data.reportType = selectedTypeCard.dataset.type;
    }
    
    try {
        localStorage.setItem('salyte_form_data', JSON.stringify(data));
    } catch (error) {
        console.warn('Could not save form data:', error);
    }
}

/**
 * Load saved form data from localStorage
 */
function loadSavedFormData() {
    try {
        const savedData = localStorage.getItem('salyte_form_data');
        if (!savedData) return;
        
        const data = JSON.parse(savedData);
        
        // Restore location
        if (data.selectedLocation) {
            selectLocationOnMap(data.selectedLocation);
        }
        
        // Restore photos
        if (data.uploadedPhotos && data.uploadedPhotos.length > 0) {
            uploadedPhotos = data.uploadedPhotos;
            updatePhotoPreview();
            updateUploadAreaText();
        }
        
        // Restore form fields
        if (data.formFields) {
            Object.entries(data.formFields).forEach(([key, value]) => {
                const field = document.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = value === field.value;
                    } else {
                        field.value = value;
                    }
                }
            });
        }
        
        // Restore report type
        if (data.reportType) {
            selectReportType(data.reportType);
        }
        
        showNotification('Previous form data restored', 'info');
        
    } catch (error) {
        console.warn('Could not load saved form data:', error);
    }
}

/**
 * Clear saved form data
 */
function clearSavedFormData() {
    localStorage.removeItem('salyte_form_data');
}

/**
 * Utility functions
 */

/**
 * Debounce function
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
 * Scroll to report form
 */
function scrollToReportForm() {
    const reportFormSection = document.getElementById('reportFormSection');
    if (reportFormSection) {
        reportFormSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Scroll to recent reports
 */
function scrollToRecentReports() {
    const recentReportsSection = document.getElementById('recentReportsSection');
    if (recentReportsSection) {
        recentReportsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Clear form with confirmation
 */
function clearForm() {
    if (confirm('Are you sure you want to clear the form? All entered data will be lost.')) {
        resetForm();
        clearSavedFormData();
        showNotification('Form cleared', 'info');
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
        const minutes = Math.floor((now - date) / (1000 * 60));
        return `${minutes}m ago`;
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
        const days = Math.floor(diffInHours / 24);
        return `${days}d ago`;
    }
    
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
}

/**
 * Set loading state for buttons
 */
function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || '<i class="fas fa-paper-plane me-2"></i>Submit Report';
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications of the same type
    document.querySelectorAll(`.notification.alert-${type === 'error' ? 'danger' : type}`).forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${getNotificationIcon(type)} me-2"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after specified duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
        notification.remove();
    });
}

/**
 * Get notification icon based on type
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
 * View report details
 */
function viewReportDetails(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) {
        showNotification('Report not found', 'error');
        return;
    }
    
    // Populate modal with report details
    populateReportDetailsModal(report);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('reportDetailsModal'));
    modal.show();
}

/**
 * Populate report details modal
 */
function populateReportDetailsModal(report) {
    const modal = document.getElementById('reportDetailsModal');
    if (!modal) return;
    
    // Update modal title
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Report #${report.trackingId}`;
    }
    
    // Update modal content
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="report-details">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <h5>${report.title}</h5>
                        <p class="text-muted mb-2">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${report.locationName}, ${report.county.charAt(0).toUpperCase() + report.county.slice(1)}
                        </p>
                        <p class="text-muted mb-0">
                            <i class="fas fa-calendar me-1"></i>
                            ${formatDetailedDate(report.submittedAt)}
                        </p>
                    </div>
                    <div class="col-md-6 text-md-end">
                        <span class="status-badge status-${report.status} mb-2">${report.status.toUpperCase().replace('-', ' ')}</span><br>
                        <span class="severity-badge severity-${report.severity}">${report.severity.toUpperCase()}</span>
                        ${report.priority === 'urgent' ? '<span class="priority-badge urgent ms-2">URGENT</span>' : ''}
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-12">
                        <h6>Description</h6>
                        <p class="report-description">${report.description}</p>
                    </div>
                </div>
                
                ${report.affectedPeople > 0 ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h6>Affected People</h6>
                            <p><i class="fas fa-users me-2"></i>${report.affectedPeople} people affected</p>
                        </div>
                    </div>
                ` : ''}
                
                ${report.coordinates ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h6>Location</h6>
                            <p>
                                <i class="fas fa-map-pin me-2"></i>
                                ${report.coordinates[0].toFixed(6)}, ${report.coordinates[1].toFixed(6)}
                                <button class="btn btn-sm btn-outline-primary ms-2" onclick="showReportOnMap(${report.coordinates[0]}, ${report.coordinates[1]})">
                                    <i class="fas fa-external-link-alt me-1"></i>View on Map
                                </button>
                            </p>
                        </div>
                    </div>
                ` : ''}
                
                ${report.photos && report.photos.length > 0 ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h6>Photos (${report.photos.length})</h6>
                            <div class="photo-gallery">
                                ${report.photos.map((photo, index) => `
                                    <div class="photo-item" onclick="viewPhotoFullscreen('${photo.data}', '${photo.name}')">
                                        <img src="${photo.data}" alt="${photo.name}" loading="lazy">
                                        <div class="photo-overlay">
                                            <i class="fas fa-expand"></i>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${report.additionalInfo ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h6>Additional Information</h6>
                            <p>${report.additionalInfo}</p>
                        </div>
                    </div>
                ` : ''}
                
                <div class="row">
                    <div class="col-12">
                        <h6>Report Information</h6>
                        <div class="report-meta-grid">
                            <div class="meta-item">
                                <strong>Report Type:</strong> ${report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                            </div>
                            <div class="meta-item">
                                <strong>Severity:</strong> ${report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                            </div>
                            <div class="meta-item">
                                <strong>Status:</strong> ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </div>
                            <div class="meta-item">
                                <strong>Submitted:</strong> ${formatDetailedDate(report.submittedAt)}
                            </div>
                            ${!report.isAnonymous && report.reporterName ? `
                                <div class="meta-item">
                                    <strong>Reporter:</strong> ${report.reporterName}
                                </div>
                            ` : `
                                <div class="meta-item">
                                    <strong>Reporter:</strong> Anonymous
                                </div>
                            `}
                            ${report.reportedElsewhere ? `
                                <div class="meta-item">
                                    <strong>Also Reported:</strong> Yes, reported to other authorities
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update modal footer buttons
    const modalFooter = modal.querySelector('.modal-footer');
    if (modalFooter) {
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-outline-primary" onclick="shareReport('${report.id}')">
                <i class="fas fa-share me-1"></i>Share
            </button>
            <button type="button" class="btn btn-outline-info" onclick="followReport('${report.id}')">
                <i class="fas fa-bell me-1"></i>Follow Updates
            </button>
            ${report.coordinates ? `
                <button type="button" class="btn btn-primary" onclick="showReportOnMap(${report.coordinates[0]}, ${report.coordinates[1]})">
                    <i class="fas fa-map-marker-alt me-1"></i>View Location
                </button>
            ` : ''}
        `;
    }
}

/**
 * Format detailed date
 */
function formatDetailedDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Show report location on map
 */
function showReportOnMap(lat, lng) {
    if (reportMap) {
        reportMap.setView([lat, lng], 16);
        
        // Add temporary marker
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: '<div style="background: #28a745; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
                iconSize: [15, 15],
                iconAnchor: [7.5, 7.5]
            })
        }).addTo(reportMap);
        
        marker.bindPopup('Report Location').openPopup();
        
        // Scroll to map
        scrollToElement(document.getElementById('locationMap'));
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reportDetailsModal'));
        if (modal) modal.hide();
        
        showNotification('Report location shown on map', 'success');
    } else {
        showNotification('Map not available', 'error');
    }
}

/**
 * View photo in fullscreen
 */
function viewPhotoFullscreen(photoData, photoName) {
    // Create fullscreen photo modal
    const fullscreenModal = document.createElement('div');
    fullscreenModal.className = 'photo-fullscreen-modal';
    fullscreenModal.innerHTML = `
        <div class="fullscreen-backdrop" onclick="closePhotoFullscreen()">
            <div class="fullscreen-content">
                <button class="fullscreen-close" onclick="closePhotoFullscreen()">&times;</button>
                <img src="${photoData}" alt="${photoName}" class="fullscreen-image">
                <div class="fullscreen-caption">${photoName}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(fullscreenModal);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Add escape key listener
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closePhotoFullscreen();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
}

/**
 * Close photo fullscreen
 */
function closePhotoFullscreen() {
    const modal = document.querySelector('.photo-fullscreen-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Track report functionality
 */
function trackReport() {
    const trackingId = document.getElementById('reportTrackingId')?.textContent;
    if (!trackingId) {
        showNotification('No tracking ID available', 'error');
        return;
    }
    
    // Show tracking modal
    showTrackingModal(trackingId);
}

/**
 * Show tracking modal
 */
function showTrackingModal(trackingId) {
    const trackingModal = document.createElement('div');
    trackingModal.className = 'modal fade';
    trackingModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Track Report #${trackingId}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="tracking-info">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            You can track your report status using the tracking ID: <strong>${trackingId}</strong>
                        </div>
                        
                        <div class="tracking-options">
                            <h6>How to track your report:</h6>
                            <ul>
                                <li>Bookmark this page and check back regularly</li>
                                <li>Call our hotline: <strong>+254-XXX-XXXX</strong> and provide your tracking ID</li>
                                <li>Visit our office with your tracking ID</li>
                                <li>Follow us on social media for general updates</li>
                            </ul>
                        </div>
                        
                        <div class="contact-info mt-4">
                            <h6>Contact Information:</h6>
                            <p><i class="fas fa-phone me-2"></i>Emergency Hotline: <strong>911</strong></p>
                            <p><i class="fas fa-phone me-2"></i>Water Department: <strong>+254-XXX-XXXX</strong></p>
                            <p><i class="fas fa-envelope me-2"></i>Email: <strong>reports@salyte.ke</strong></p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="copyTrackingId('${trackingId}')">
                        <i class="fas fa-copy me-1"></i>Copy Tracking ID
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(trackingModal);
    const modal = new bootstrap.Modal(trackingModal);
    modal.show();
    
    // Remove modal from DOM when hidden
    trackingModal.addEventListener('hidden.bs.modal', () => {
        trackingModal.remove();
    });
}

/**
 * Copy tracking ID to clipboard
 */
function copyTrackingId(trackingId) {
    navigator.clipboard.writeText(trackingId).then(() => {
        showNotification('Tracking ID copied to clipboard', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = trackingId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Tracking ID copied to clipboard', 'success');
    });
}

/**
 * Submit another report
 */
function submitAnotherReport() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('successModal'));
    if (modal) modal.hide();
    
    setTimeout(() => {
        scrollToReportForm();
        showNotification('Ready to submit another report', 'info');
    }, 300);
}

/**
 * Share report functionality
 */
function shareReport(reportId) {
    const report = reportId ? allReports.find(r => r.id === reportId) : null;
    const trackingId = report ? report.trackingId : document.getElementById('reportTrackingId')?.textContent;
    
    if (!trackingId) {
        showNotification('No report information available for sharing', 'error');
        return;
    }
    
    const shareData = {
        title: `Water Report #${trackingId}`,
        text: `I've reported a water issue in my area. Track the report status with ID: ${trackingId}`,
        url: `${window.location.origin}?track=${trackingId}`
    };
    
    if (navigator.share) {
        // Use native sharing if available
        navigator.share(shareData).catch(error => {
            console.log('Error sharing:', error);
            showShareModal(shareData);
        });
    } else {
        // Show custom share modal
        showShareModal(shareData);
    }
}

/**
 * Show share modal
 */
function showShareModal(shareData) {
    const shareModal = document.createElement('div');
    shareModal.className = 'modal fade';
    shareModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Share Report</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Share this report with others:</p>
                    <div class="input-group mb-3">
                        <input type="text" class="form-control" value="${shareData.url}" id="shareUrl" readonly>
                        <button class="btn btn-outline-primary" onclick="copyShareUrl()">Copy</button>
                    </div>
                    
                    <div class="share-buttons">
                        <button class="btn btn-success me-2" onclick="shareViaWhatsApp('${encodeURIComponent(shareData.text + ' ' + shareData.url)}')">
                            <i class="fab fa-whatsapp me-1"></i>WhatsApp
                        </button>
                        <button class="btn btn-info me-2" onclick="shareViaTwitter('${encodeURIComponent(shareData.text)}', '${encodeURIComponent(shareData.url)}')">
                            <i class="fab fa-twitter me-1"></i>Twitter
                        </button>
                        <button class="btn btn-primary" onclick="shareViaFacebook('${encodeURIComponent(shareData.url)}')">
                            <i class="fab fa-facebook me-1"></i>Facebook
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(shareModal);
    const modal = new bootstrap.Modal(shareModal);
    modal.show();
    
    // Remove modal from DOM when hidden
    shareModal.addEventListener('hidden.bs.modal', () => {
        shareModal.remove();
    });
}

/**
 * Copy share URL
 */
function copyShareUrl() {
    const urlInput = document.getElementById('shareUrl');
    urlInput.select();
    document.execCommand('copy');
    showNotification('Link copied to clipboard', 'success');
}

/**
 * Share via WhatsApp
 */
function shareViaWhatsApp(text) {
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

/**
 * Share via Twitter
 */
function shareViaTwitter(text, url) {
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

/**
 * Share via Facebook
 */
function shareViaFacebook(url) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

/**
 * Follow report functionality
 */
function followReport(reportId) {
    const report = reportId ? allReports.find(r => r.id === reportId) : null;
    const trackingId = report ? report.trackingId : document.getElementById('reportTrackingId')?.textContent;
    
    if (!trackingId) {
        showNotification('No report information available', 'error');
        return;
    }
    
    // Show follow modal
    showFollowModal(trackingId);
}

/**
 * Show follow modal
 */
function showFollowModal(trackingId) {
    const followModal = document.createElement('div');
    followModal.className = 'modal fade';
    followModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Follow Report Updates</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Stay updated on the progress of report <strong>#${trackingId}</strong></p>
                    
                    <form id="followForm">
                        <div class="mb-3">
                            <label for="followEmail" class="form-label">Email Address</label>
                            <input type="email" class="form-control" id="followEmail" required>
                            <div class="form-text">We'll send you updates via email</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="followPhone" class="form-label">Phone Number (optional)</label>
                            <input type="tel" class="form-control" id="followPhone">
                            <div class="form-text">For SMS notifications on critical updates</div>
                        </div>
                        
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="followConsent" required>
                            <label class="form-check-label" for="followConsent">
                                I consent to receive updates about this report
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="subscribeToUpdates('${trackingId}')">
                        <i class="fas fa-bell me-1"></i>Follow Updates
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(followModal);
    const modal = new bootstrap.Modal(followModal);
    modal.show();
    
    // Remove modal from DOM when hidden
    followModal.addEventListener('hidden.bs.modal', () => {
        followModal.remove();
    });
}

/**
 * Subscribe to report updates
 */
function subscribeToUpdates(trackingId) {
    const form = document.getElementById('followForm');
    const email = document.getElementById('followEmail').value;
    const phone = document.getElementById('followPhone').value;
    const consent = document.getElementById('followConsent').checked;
    
    if (!form.checkValidity() || !consent) {
        form.classList.add('was-validated');
        return;
    }
    
    // Mock subscription - in real app, this would call an API
    setTimeout(() => {
        showNotification('Successfully subscribed to updates!', 'success');
        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
        if (modal) modal.hide();
    }, 500);
}

/**
 * Call emergency services
 */
function callEmergency() {
    if (confirm('This will open your phone app to call emergency services. Continue?')) {
        showNotification('Opening emergency services...', 'info');
        setTimeout(() => {
            window.location.href = 'tel:911';
        }, 1000);
    }
}

/**
 * Mock functions for testing
 */
function getMockReports() {
    const mockReports = [
        {
            id: 'rpt_001',
            trackingId: 'WR-20250115-1001',
            title: 'Water Contamination in Kibera',
            type: 'contamination',
            status: 'investigating',
            severity: 'high',
            priority: 'urgent',
            locationName: 'Kibera Slum',
            county: 'nairobi',
            description: 'Strange smell and color in community borehole water. Several residents reporting stomach issues after drinking the water. The water appears brownish and has a metallic taste.',
            submittedAt: '2025-01-15T08:30:00Z',
            coordinates: [-1.3167, 36.7833],
            affectedPeople: 150,
            isAnonymous: false,
            reporterName: 'John Kamau',
            photos: [
                { name: 'contaminated_water.jpg', size: 2048576, data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...' }
            ]
        },
        {
            id: 'rpt_002',
            trackingId: 'WR-20250114-1002',
            title: 'Broken Water Pipe in Westlands',
            type: 'infrastructure',
            status: 'in-progress',
            severity: 'medium',
            priority: 'high',
            locationName: 'Westlands Area',
            county: 'nairobi',
            description: 'Main water pipe burst along Waiyaki Way causing flooding and water shortage in the area. The burst pipe is approximately 2 meters from the main road.',
            submittedAt: '2025-01-14T15:45:00Z',
            coordinates: [-1.2676, 36.8108],
            affectedPeople: 75,
            isAnonymous: true,
            photos: [
                { name: 'burst_pipe1.jpg', size: 1536789, data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...' },
                { name: 'burst_pipe2.jpg', size: 1789234, data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...' }
            ]
        },
        {
            id: 'rpt_003',
            trackingId: 'WR-20250113-1003',
            title: 'Water Shortage in Eastleigh',
            type: 'shortage',
            status: 'resolved',
            severity: 'high',
            priority: 'urgent',
            locationName: 'Eastleigh Estate',
            county: 'nairobi',
            description: 'No water supply for 3 days affecting over 200 households. Residents are forced to buy water from vendors at high prices.',
            submittedAt: '2025-01-13T09:15:00Z',
            resolvedAt: '2025-01-14T16:30:00Z',
            coordinates: [-1.2833, 36.8500],
            affectedPeople: 200,
            isAnonymous: false,
            reporterName: 'Mary Wanjiku',
            additionalInfo: 'This is the third time this month that water supply has been cut off in this area.'
        },
        {
            id: 'rpt_004',
            trackingId: 'WR-20250112-1004',
            title: 'Poor Water Quality in Karen',
            type: 'quality',
            status: 'submitted',
            severity: 'low',
            priority: 'normal',
            locationName: 'Karen Estate',
            county: 'nairobi',
            description: 'Water from taps has unusual taste and odor. Not clear if it\'s safe for consumption.',
            submittedAt: '2025-01-12T14:20:00Z',
            coordinates: [-1.3197, 36.6854],
            affectedPeople: 25,
            isAnonymous: false,
            reporterName: 'David Otieno',
            reporterEmail: 'david.otieno@email.com',
            reporterPhone: '+254712345678'
        }
    ];
    
    return mockReports;
}

/**
 * Initialize export functionality
 */
function initializeExportFunctionality() {
    const exportBtn = document.getElementById('exportReportsBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReports);
    }
}

/**
 * Export reports to CSV
 */
function exportReports() {
    if (filteredReports.length === 0) {
        showNotification('No reports to export', 'warning');
        return;
    }
    
    const headers = [
        'Tracking ID',
        'Title',
        'Type',
        'Status',
        'Severity',
        'Location',
        'County',
        'Description',
        'Affected People',
        'Submitted Date',
        'Reporter'
    ];
    
    const csvContent = [
        headers.join(','),
        ...filteredReports.map(report => [
            report.trackingId,
            `"${report.title.replace(/"/g, '""')}"`,
            report.type,
            report.status,
            report.severity,
            `"${report.locationName.replace(/"/g, '""')}"`,
            report.county,
            `"${report.description.replace(/"/g, '""')}"`,
            report.affectedPeople || 0,
            new Date(report.submittedAt).toLocaleDateString(),
            report.isAnonymous ? 'Anonymous' : (report.reporterName || 'N/A')
        ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salyte_water_reports_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showNotification(`Exported ${filteredReports.length} reports to CSV`, 'success');
}

// Make functions globally available
window.scrollToReportForm = scrollToReportForm;
window.scrollToRecentReports = scrollToRecentReports;
window.clearForm = clearForm;
window.removePhoto = removePhoto;
window.loadMoreReports = loadMoreReports;
window.trackReport = trackReport;
window.submitAnotherReport = submitAnotherReport;
window.shareReport = shareReport;
window.followReport = followReport;
window.viewReportDetails = viewReportDetails;
window.showReportOnMap = showReportOnMap;
window.viewPhotoFullscreen = viewPhotoFullscreen;
window.closePhotoFullscreen = closePhotoFullscreen;
window.copyTrackingId = copyTrackingId;
window.copyShareUrl = copyShareUrl;
window.shareViaWhatsApp = shareViaWhatsApp;
window.shareViaTwitter = shareViaTwitter;
window.shareViaFacebook = shareViaFacebook;
window.subscribeToUpdates = subscribeToUpdates;
window.callEmergency = callEmergency;
window.exportReports = exportReports;

// Initialize export functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeExportFunctionality();
});

console.log('Salyte Beacon Community Reporting JavaScript loaded successfully - v2.0');