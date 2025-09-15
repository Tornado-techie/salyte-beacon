/**
 * Cartomap JavaScript for Salyte Beacon
 * Handles interactive map functionality, layer management, and data visualization
 */

// Global variables
let map;
let layerGroups = {};
let currentMarkers = [];
let userLocation = null;
let isFullscreen = false;
let isSatelliteView = false;
let selectedPoint = null;

// Layer configuration
const layerConfig = {
    waterQuality: { name: 'Water Quality Points', color: '#0d6efd', enabled: true },
    contaminated: { name: 'Contaminated Areas', color: '#dc3545', enabled: true },
    safeBoreholes: { name: 'Safe Boreholes', color: '#198754', enabled: true },
    activeProjects: { name: 'Active Projects', color: '#ffc107', enabled: false },
    treatmentPlants: { name: 'Treatment Plants', color: '#0dcaf0', enabled: false }
};

// Initialize map on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
});

/**
 * Initialize the interactive map
 */
function initializeMap() {
    try {
        // Initialize Leaflet map centered on Nairobi
        map = L.map('map', {
            center: [-1.2921, 36.8219], // Nairobi coordinates
            zoom: 10,
            zoomControl: false // We'll add custom controls
        });

        // Add default tile layer
        const defaultLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        });
        defaultLayer.addTo(map);

        // Initialize layer groups
        initializeLayerGroups();

        // Load initial data
        loadMapData();

        // Setup event listeners
        setupMapEventListeners();

        // Initialize location services
        initializeLocationServices();

        // Setup sidebar functionality
        setupSidebarFunctionality();

        // Load user's current location
        getCurrentLocation();

        console.log('Interactive map initialized successfully');

    } catch (error) {
        console.error('Error initializing map:', error);
        showNotification('Failed to initialize map. Please refresh the page.', 'error');
    }
}

/**
 * Initialize layer groups for different data types
 */
function initializeLayerGroups() {
    Object.keys(layerConfig).forEach(layerId => {
        layerGroups[layerId] = L.layerGroup();
        if (layerConfig[layerId].enabled) {
            layerGroups[layerId].addTo(map);
        }
    });
}

/**
 * Load map data from API or use mock data
 */
async function loadMapData() {
    try {
        showMapLoading(true);

        // Try to fetch real data from API
        const response = await fetch('/api/map/data');
        let mapData;

        if (response.ok) {
            mapData = await response.json();
        } else {
            // Use mock data if API fails
            mapData = getMockMapData();
        }

        // Process and display data
        processMapData(mapData);
        updateStatistics(mapData);

    } catch (error) {
        console.error('Error loading map data:', error);
        // Use mock data as fallback
        const mockData = getMockMapData();
        processMapData(mockData);
        updateStatistics(mockData);
    } finally {
        showMapLoading(false);
    }
}

/**
 * Process and display map data
 */
function processMapData(data) {
    // Clear existing markers
    currentMarkers = [];
    Object.values(layerGroups).forEach(layer => layer.clearLayers());

    // Process each data point
    data.features.forEach(feature => {
        const { geometry, properties } = feature;
        const [lng, lat] = geometry.coordinates;
        const marker = createMarker(lat, lng, properties);
        
        if (marker) {
            currentMarkers.push(marker);
            
            // Add to appropriate layer group
            const layerId = getLayerIdFromProperties(properties);
            if (layerGroups[layerId]) {
                layerGroups[layerId].addLayer(marker);
            }
        }
    });

    console.log(`Loaded ${currentMarkers.length} water points on map`);
}

/**
 * Create a marker for a water point
 */
function createMarker(lat, lng, properties) {
    const { name, type, quality, lastUpdated, description, testResults } = properties;
    
    // Create custom icon based on quality
    const icon = createCustomIcon(quality, type);
    
    // Create marker
    const marker = L.marker([lat, lng], { icon: icon });
    
    // Create popup content
    const popupContent = createPopupContent(properties);
    marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
    });

    // Add click event
    marker.on('click', function(e) {
        selectWaterPoint(properties, e.latlng);
    });

    return marker;
}

/**
 * Create custom icon based on water quality and type
 */
function createCustomIcon(quality, type) {
    const colorMap = {
        safe: '#198754',
        moderate: '#ffc107',
        unsafe: '#dc3545',
        unknown: '#6c757d'
    };

    const color = colorMap[quality] || colorMap.unknown;
    
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="water-marker ${quality}" style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

/**
 * Create popup content for water point
 */
function createPopupContent(properties) {
    const { name, type, quality, lastUpdated, description, testResults, peopleServed } = properties;
    
    const qualityBadge = `<span class="quality-badge ${quality}">${quality.toUpperCase()}</span>`;
    
    let testResultsHTML = '';
    if (testResults) {
        testResultsHTML = `
            <div class="test-results mt-2">
                <strong>Test Results:</strong><br>
                ${testResults.pH ? `pH: ${testResults.pH}<br>` : ''}
                ${testResults.tds ? `TDS: ${testResults.tds} ppm<br>` : ''}
                ${testResults.turbidity ? `Turbidity: ${testResults.turbidity} NTU<br>` : ''}
            </div>
        `;
    }

    return `
        <div class="water-point-popup">
            <h6>${name}</h6>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Status:</strong> ${qualityBadge}</p>
            ${peopleServed ? `<p><strong>People Served:</strong> ${peopleServed}</p>` : ''}
            ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
            ${testResultsHTML}
            <p class="small text-muted">Last Updated: ${new Date(lastUpdated).toLocaleDateString()}</p>
            <button class="btn btn-primary btn-sm w-100 mt-2" onclick="viewPointDetails('${properties.id}')">
                View Details
            </button>
        </div>
    `;
}

/**
 * Get layer ID from properties
 */
function getLayerIdFromProperties(properties) {
    const { type, quality } = properties;
    
    if (type === 'borehole' && quality === 'safe') return 'safeBoreholes';
    if (quality === 'unsafe' || properties.contaminated) return 'contaminated';
    if (type === 'treatment_plant') return 'treatmentPlants';
    if (properties.isProject) return 'activeProjects';
    
    return 'waterQuality';
}

/**
 * Setup map event listeners
 */
function setupMapEventListeners() {
    // Map click event for adding new points
    map.on('click', function(e) {
        if (map.addPointMode) {
            handleMapClickForAddPoint(e);
        }
    });

    // Layer toggle event listeners
    const layerCheckboxes = document.querySelectorAll('.layer-controls input[type="checkbox"]');
    layerCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleLayer(this.id, this.checked);
        });
    });

    // Filter event listeners
    const filterSelects = document.querySelectorAll('.filter-controls select');
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });

    // Search functionality
    const locationSearch = document.getElementById('locationSearch');
    if (locationSearch) {
        locationSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchLocation();
            }
        });
    }
}

/**
 * Toggle layer visibility
 */
function toggleLayer(layerId, isVisible) {
    const layerKey = layerId.replace('Layer', '');
    
    if (layerGroups[layerKey]) {
        if (isVisible) {
            layerGroups[layerKey].addTo(map);
        } else {
            map.removeLayer(layerGroups[layerKey]);
        }
        
        layerConfig[layerKey].enabled = isVisible;
        console.log(`${layerConfig[layerKey].name} layer ${isVisible ? 'enabled' : 'disabled'}`);
    }
}

/**
 * Apply filters to map data
 */
function applyFilters() {
    const dateRange = document.getElementById('dateRange').value;
    const qualityFilter = document.getElementById('qualityFilter').value;
    const sourceFilter = document.getElementById('sourceFilter').value;

    // Clear existing markers
    Object.values(layerGroups).forEach(layer => layer.clearLayers());

    // Filter markers based on criteria
    const filteredMarkers = currentMarkers.filter(marker => {
        const properties = marker.properties || {};
        
        // Date filter
        if (dateRange && dateRange !== 'all') {
            const cutoffDate = getDateFromFilter(dateRange);
            const markerDate = new Date(properties.lastUpdated);
            if (markerDate < cutoffDate) return false;
        }
        
        // Quality filter
        if (qualityFilter && qualityFilter !== 'all') {
            if (properties.quality !== qualityFilter) return false;
        }
        
        // Source type filter
        if (sourceFilter && sourceFilter !== 'all') {
            if (properties.type !== sourceFilter) return false;
        }
        
        return true;
    });

    // Re-add filtered markers to appropriate layers
    filteredMarkers.forEach(marker => {
        const layerId = getLayerIdFromProperties(marker.properties);
        if (layerGroups[layerId] && layerConfig[layerId].enabled) {
            layerGroups[layerId].addLayer(marker);
        }
    });

    console.log(`Applied filters: ${filteredMarkers.length} markers visible`);
}

/**
 * Get date cutoff from filter value
 */
function getDateFromFilter(filter) {
    const now = new Date();
    switch (filter) {
        case 'week':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case 'quarter':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case 'year':
            return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
            return new Date(0); // Beginning of time
    }
}

/**
 * Search for location
 */
async function searchLocation() {
    const query = document.getElementById('locationSearch').value.trim();
    if (!query) return;

    try {
        // Mock geocoding - in production, use a real geocoding service
        const locations = getMockLocations();
        const location = locations.find(loc => 
            loc.name.toLowerCase().includes(query.toLowerCase())
        );

        if (location) {
            map.setView([location.lat, location.lng], 12);
            showNotification(`Found: ${location.name}`, 'success');
        } else {
            showNotification('Location not found', 'warning');
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        showNotification('Search failed. Please try again.', 'error');
    }
}

/**
 * Go to specific location
 */
function goToLocation(lat, lng, zoom = 12) {
    map.setView([lat, lng], zoom);
    
    // Add temporary marker
    const tempMarker = L.marker([lat, lng]).addTo(map);
    setTimeout(() => {
        map.removeLayer(tempMarker);
    }, 3000);
}

/**
 * Get current user location
 */
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('User location obtained:', userLocation);
            },
            function(error) {
                console.log('Geolocation error:', error.message);
            }
        );
    }
}

/**
 * Center map on user location
 */
function centerOnUser() {
    if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 14);
        
        // Add user location marker
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div style="background: #007bff; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,123,255,0.5);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        
        const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
        setTimeout(() => map.removeLayer(userMarker), 5000);
        
        showNotification('Centered on your location', 'success');
    } else {
        getCurrentLocation();
        showNotification('Location not available. Please allow location access.', 'warning');
    }
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    const mapContainer = document.querySelector('.map-container');
    
    if (!document.fullscreenElement) {
        mapContainer.requestFullscreen().then(() => {
            isFullscreen = true;
            document.querySelector('[onclick="toggleFullscreen()"] i').className = 'fas fa-compress';
            setTimeout(() => map.invalidateSize(), 100);
        });
    } else {
        document.exitFullscreen().then(() => {
            isFullscreen = false;
            document.querySelector('[onclick="toggleFullscreen()"] i').className = 'fas fa-expand';
            setTimeout(() => map.invalidateSize(), 100);
        });
    }
}

/**
 * Toggle satellite view
 */
function toggleSatellite() {
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });

    if (!isSatelliteView) {
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        satelliteLayer.addTo(map);
        isSatelliteView = true;
        document.querySelector('[onclick="toggleSatellite()"] i').className = 'fas fa-map';
    } else {
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        streetLayer.addTo(map);
        isSatelliteView = false;
        document.querySelector('[onclick="toggleSatellite()"] i').className = 'fas fa-satellite';
    }
}

/**
 * Setup sidebar functionality
 */
function setupSidebarFunctionality() {
    // Mobile sidebar toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('mapSidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', toggleMobileSidebar);
    }
}

/**
 * Toggle sidebar (desktop)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('mapSidebar');
    const toggleIcon = document.querySelector('.sidebar-toggle i');
    
    sidebar.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleIcon.className = 'fas fa-chevron-right';
    } else {
        toggleIcon.className = 'fas fa-chevron-left';
    }
    
    // Resize map after animation
    setTimeout(() => map.invalidateSize(), 300);
}

/**
 * Toggle mobile sidebar
 */
function toggleMobileSidebar() {
    const sidebar = document.getElementById('mapSidebar');
    sidebar.classList.toggle('show');
    
    // Close sidebar when clicking outside
    if (sidebar.classList.contains('show')) {
        document.addEventListener('click', closeSidebarOnOutsideClick);
    }
}

/**
 * Close sidebar when clicking outside
 */
function closeSidebarOnOutsideClick(e) {
    const sidebar = document.getElementById('mapSidebar');
    const toggle = document.getElementById('mobileMenuToggle');
    
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('show');
        document.removeEventListener('click', closeSidebarOnOutsideClick);
    }
}

/**
 * Show/hide map loading
 */
function showMapLoading(show) {
    const loadingElement = document.getElementById('mapLoading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Update statistics in sidebar
 */
function updateStatistics(data) {
    const stats = calculateStatistics(data);
    
    document.getElementById('safePointsCount').textContent = stats.safe || 0;
    document.getElementById('moderatePointsCount').textContent = stats.moderate || 0;
    document.getElementById('unsafePointsCount').textContent = stats.unsafe || 0;
    document.getElementById('activeProjectsCount').textContent = stats.projects || 0;
}

/**
 * Calculate statistics from map data
 */
function calculateStatistics(data) {
    const stats = {
        safe: 0,
        moderate: 0,
        unsafe: 0,
        projects: 0
    };

    data.features.forEach(feature => {
        const { quality, isProject } = feature.properties;
        
        if (isProject) {
            stats.projects++;
        } else {
            stats[quality] = (stats[quality] || 0) + 1;
        }
    });

    return stats;
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('dateRange').value = 'week';
    document.getElementById('qualityFilter').value = '';
    document.getElementById('sourceFilter').value = '';
    
    // Reload all data
    loadMapData();
    
    showNotification('Filters reset', 'info');
}

/**
 * Add water point functionality
 */
function addWaterPoint() {
    const modal = new bootstrap.Modal(document.getElementById('addPointModal'));
    
    // Enable add point mode
    map.addPointMode = true;
    map.getContainer().style.cursor = 'crosshair';
    
    // Clear previous coordinates
    document.getElementById('pointLat').value = '';
    document.getElementById('pointLng').value = '';
    
    showNotification('Click on the map to select location', 'info');
    modal.show();
    
    // Reset cursor when modal is closed
    document.getElementById('addPointModal').addEventListener('hidden.bs.modal', function() {
        map.addPointMode = false;
        map.getContainer().style.cursor = '';
    });
}

/**
 * Handle map click for adding point
 */
function handleMapClickForAddPoint(e) {
    const { lat, lng } = e.latlng;
    
    document.getElementById('pointLat').value = lat.toFixed(6);
    document.getElementById('pointLng').value = lng.toFixed(6);
    
    // Add temporary marker
    if (window.tempAddMarker) {
        map.removeLayer(window.tempAddMarker);
    }
    
    window.tempAddMarker = L.marker([lat, lng]).addTo(map);
    
    showNotification('Location selected! Fill in the details.', 'success');
}

/**
 * Submit new water point
 */
async function submitWaterPoint() {
    const form = document.getElementById('addPointForm');
    const formData = new FormData(form);
    
    const pointData = {
        name: formData.get('pointName'),
        type: formData.get('pointType'),
        quality: formData.get('qualityStatus'),
        latitude: parseFloat(formData.get('pointLat')),
        longitude: parseFloat(formData.get('pointLng')),
        description: formData.get('pointDescription'),
        testResults: {
            pH: formData.get('phValue') ? parseFloat(formData.get('phValue')) : null,
            tds: formData.get('tdsValue') ? parseFloat(formData.get('tdsValue')) : null,
            turbidity: formData.get('turbidityValue') ? parseFloat(formData.get('turbidityValue')) : null
        }
    };

    try {
        const response = await fetch('/api/map/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pointData)
        });

        if (response.ok) {
            showNotification('Water point added successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addPointModal'));
            modal.hide();
            
            // Clear temp marker
            if (window.tempAddMarker) {
                map.removeLayer(window.tempAddMarker);
                delete window.tempAddMarker;
            }
            
            // Reload map data
            loadMapData();
            
        } else {
            throw new Error('Failed to save water point');
        }
        
    } catch (error) {
        console.error('Error submitting water point:', error);
        showNotification('Failed to add water point. Please try again.', 'error');
    }
}

/**
 * Report safe source
 */
function reportSafeSource() {
    document.getElementById('qualityStatus').value = 'safe';
    addWaterPoint();
}

/**
 * Report contamination
 */
function reportContamination() {
    document.getElementById('qualityStatus').value = 'unsafe';
    addWaterPoint();
}

/**
 * Export map data
 */
function exportMapData() {
    const exportData = {
        timestamp: new Date().toISOString(),
        filters: {
            dateRange: document.getElementById('dateRange').value,
            quality: document.getElementById('qualityFilter').value,
            source: document.getElementById('sourceFilter').value
        },
        statistics: calculateStatistics({ features: currentMarkers.map(m => ({ properties: m.properties })) }),
        totalPoints: currentMarkers.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `salyte-map-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Map data exported successfully', 'success');
}

/**
 * View point details in modal
 */
function viewPointDetails(pointId) {
    const point = currentMarkers.find(m => m.properties && m.properties.id === pointId);
    if (!point) return;

    const modal = new bootstrap.Modal(document.getElementById('waterPointModal'));
    const modalBody = document.getElementById('waterPointDetails');
    
    const { properties } = point;
    const detailsHTML = createPointDetailsHTML(properties);
    
    modalBody.innerHTML = detailsHTML;
    modal.show();
}

/**
 * Create detailed HTML for point details modal
 */
function createPointDetailsHTML(properties) {
    const { name, type, quality, description, testResults, lastUpdated, peopleServed, coordinates } = properties;
    
    const qualityBadge = `<span class="quality-badge ${quality}">${quality.toUpperCase()}</span>`;
    
    let testResultsHTML = '';
    if (testResults) {
        testResultsHTML = `
            <div class="card mt-3">
                <div class="card-header"><h6 class="mb-0">Test Results</h6></div>
                <div class="card-body">
                    ${testResults.pH ? `<p><strong>pH:</strong> ${testResults.pH}</p>` : ''}
                    ${testResults.tds ? `<p><strong>TDS:</strong> ${testResults.tds} ppm</p>` : ''}
                    ${testResults.turbidity ? `<p><strong>Turbidity:</strong> ${testResults.turbidity} NTU</p>` : ''}
                    ${testResults.chlorine ? `<p><strong>Chlorine:</strong> ${testResults.chlorine} mg/L</p>` : ''}
                </div>
            </div>
        `;
    }

    return `
        <div class="water-point-details">
            <h5>${name}</h5>
            <div class="water-point-detail">
                <strong>Type:</strong> <span>${type}</span>
            </div>
            <div class="water-point-detail">
                <strong>Status:</strong> <span>${qualityBadge}</span>
            </div>
            ${peopleServed ? `
                <div class="water-point-detail">
                    <strong>People Served:</strong> <span>${peopleServed}</span>
                </div>
            ` : ''}
            <div class="water-point-detail">
                <strong>Coordinates:</strong> <span>${coordinates ? coordinates : 'N/A'}</span>
            </div>
            <div class="water-point-detail">
                <strong>Last Updated:</strong> <span>${new Date(lastUpdated).toLocaleString()}</span>
            </div>
            ${description ? `
                <div class="water-point-detail">
                    <strong>Description:</strong> <span>${description}</span>
                </div>
            ` : ''}
            ${testResultsHTML}
        </div>
    `;
}

/**
 * Get directions to selected point
 */
function getDirections() {
    if (!selectedPoint) {
        showNotification('No point selected', 'warning');
        return;
    }

    if (!userLocation) {
        showNotification('Location access required for directions', 'warning');
        getCurrentLocation();
        return;
    }

    // Open directions in default maps app
    const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${selectedPoint.lat},${selectedPoint.lng}`;
    window.open(url, '_blank');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast show position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
    toast.setAttribute('role', 'alert');
    
    const bgClass = type === 'error' ? 'bg-danger' : 
                   type === 'success' ? 'bg-success' : 
                   type === 'warning' ? 'bg-warning' : 'bg-info';
    
    toast.innerHTML = `
        <div class="toast-header ${bgClass} text-white">
            <i class="fas fa-bell me-2"></i>
            <strong class="me-auto">Salyte Beacon</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 4000);
}

/**
 * Mock map data for testing
 */
function getMockMapData() {
    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [36.8219, -1.2921] // Nairobi
                },
                properties: {
                    id: "wp001",
                    name: "Nairobi City Water Point",
                    type: "borehole",
                    quality: "safe",
                    description: "Community borehole serving central Nairobi",
                    lastUpdated: "2025-01-15T10:30:00Z",
                    peopleServed: 500,
                    testResults: {
                        pH: 7.2,
                        tds: 245,
                        turbidity: 0.8
                    },
                    coordinates: "-1.2921, 36.8219"
                }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [36.8300, -1.2800]
                },
                properties: {
                    id: "wp002",
                    name: "Kasarani Water Station",
                    type: "well",
                    quality: "moderate",
                    description: "Shallow well in Kasarani area",
                    lastUpdated: "2025-01-14T15:45:00Z",
                    peopleServed: 200,
                    testResults: {
                        pH: 6.8,
                        tds: 450,
                        turbidity: 2.1
                    },
                    coordinates: "-1.2800, 36.8300"
                }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [36.8100, -1.3000]
                },
                properties: {
                    id: "wp003",
                    name: "Kibera Community Source",
                    type: "spring",
                    quality: "unsafe",
                    description: "Natural spring requiring treatment",
                    lastUpdated: "2025-01-13T08:20:00Z",
                    peopleServed: 300,
                    contaminated: true,
                    testResults: {
                        pH: 5.9,
                        tds: 780,
                        turbidity: 15.2
                    },
                    coordinates: "-1.3000, 36.8100"
                }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [36.8500, -1.2700]
                },
                properties: {
                    id: "wp004",
                    name: "Eastlands Treatment Plant",
                    type: "treatment_plant",
                    quality: "safe",
                    description: "Municipal water treatment facility",
                    lastUpdated: "2025-01-15T12:00:00Z",
                    peopleServed: 5000,
                    testResults: {
                        pH: 7.5,
                        tds: 180,
                        turbidity: 0.3,
                        chlorine: 0.8
                    },
                    coordinates: "-1.2700, 36.8500"
                }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [36.8000, -1.2600]
                },
                properties: {
                    id: "wp005",
                    name: "Westlands Borehole Project",
                    type: "borehole",
                    quality: "unknown",
                    description: "New borehole under construction",
                    lastUpdated: "2025-01-10T09:15:00Z",
                    isProject: true,
                    peopleServed: 0,
                    coordinates: "-1.2600, 36.8000"
                }
            }
        ]
    };
}

/**
 * Mock locations for search
 */
function getMockLocations() {
    return [
        { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
        { name: "Mombasa", lat: -4.0435, lng: 39.6682 },
        { name: "Kisumu", lat: -0.0917, lng: 34.7680 },
        { name: "Eldoret", lat: 0.5143, lng: 35.2698 },
        { name: "Nakuru", lat: -0.3031, lng: 36.0800 }
    ];
}

// Initialize location services
function initializeLocationServices() {
    // Set up geolocation services
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            },
            function(error) {
                console.log('Location tracking error:', error.message);
            },
            {
                enableHighAccuracy: false,
                maximumAge: 300000, // 5 minutes
                timeout: 10000
            }
        );
    }
}

// Make functions globally available
window.toggleSidebar = toggleSidebar;
window.toggleMobileSidebar = toggleMobileSidebar;
window.searchLocation = searchLocation;
window.goToLocation = goToLocation;
window.centerOnUser = centerOnUser;
window.toggleFullscreen = toggleFullscreen;
window.toggleSatellite = toggleSatellite;
window.resetFilters = resetFilters;
window.addWaterPoint = addWaterPoint;
window.reportSafeSource = reportSafeSource;
window.reportContamination = reportContamination;
window.exportMapData = exportMapData;
window.submitWaterPoint = submitWaterPoint;
window.viewPointDetails = viewPointDetails;
window.getDirections = getDirections;

console.log('Cartomap JavaScript loaded successfully');