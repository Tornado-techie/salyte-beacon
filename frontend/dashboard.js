/**
 * Dashboard JavaScript for Salyte Beacon
 * Handles charts, maps, real-time data, and dashboard interactions
 * Version: 1.0
 */

// Global variables
let dashboardMap;
let waterQualityChart;
let issueDistributionChart;
let countyAnalysisChart;
let dashboardData = {
    stations: [],
    reports: [],
    metrics: {},
    parameters: {}
};
let updateInterval;
let isRealTimeEnabled = true;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

/**
 * Initialize all dashboard functionality
 */
function initializeDashboard() {
    // Setup event listeners
    setupEventListeners();
    
    // Initialize map
    initializeDashboardMap();
    
    // Load initial data
    loadDashboardData();
    
    // Initialize charts
    initializeCharts();
    
    // Setup real-time updates
    setupRealTimeUpdates();
    
    // Load recent reports
    loadRecentReports();
    
    // Load action items
    loadActionItems();
    
    console.log('Dashboard initialized successfully');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Refresh data button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboardData);
    }
    
    // Export dashboard button
    const exportBtn = document.getElementById('exportDashboard');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDashboardReport);
    }
    
    // Time frame selectors
    const trendTimeframe = document.getElementById('trendTimeframe');
    if (trendTimeframe) {
        trendTimeframe.addEventListener('change', updateWaterQualityChart);
    }
    
    // Map view toggles
    const mapViewRadios = document.querySelectorAll('input[name="mapView"]');
    mapViewRadios.forEach(radio => {
        radio.addEventListener('change', updateMapView);
    });
    
    // County metric selector
    const countyMetric = document.getElementById('countyMetric');
    if (countyMetric) {
        countyMetric.addEventListener('change', updateCountyAnalysis);
    }
    
    // Parameter station selector
    const parameterStation = document.getElementById('parameterStation');
    if (parameterStation) {
        parameterStation.addEventListener('change', updateWaterParameters);
    }
    
    // Action items filters
    const filterCritical = document.getElementById('filterCritical');
    const markAllRead = document.getElementById('markAllRead');
    
    if (filterCritical) {
        filterCritical.addEventListener('click', filterCriticalActions);
    }
    
    if (markAllRead) {
        markAllRead.addEventListener('click', markAllActionsRead);
    }
}

/**
 * Initialize dashboard map
 */
function initializeDashboardMap() {
    const mapContainer = document.getElementById('dashboardMap');
    if (!mapContainer) return;
    
    try {
        // Initialize Leaflet map
        dashboardMap = L.map('dashboardMap', {
            center: [-1.2921, 36.8219], // Nairobi
            zoom: 8
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(dashboardMap);
        
        // Load stations on map
        loadStationsOnMap();
        
    } catch (error) {
        console.error('Error initializing dashboard map:', error);
        mapContainer.innerHTML = '<p class="text-center text-muted p-4">Map not available</p>';
    }
}

/**
 * Load stations on map
 */
function loadStationsOnMap() {
    const stations = getMockStations();
    
    stations.forEach(station => {
        const markerColor = getMarkerColor(station.status, station.waterQuality);
        
        const marker = L.circleMarker([station.lat, station.lng], {
            radius: 8,
            fillColor: markerColor,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(dashboardMap);
        
        // Create popup content
        const popupContent = `
            <div class="station-popup">
                <h6>${station.name}</h6>
                <p><strong>Status:</strong> <span class="station-status ${station.status}">${station.status.toUpperCase()}</span></p>
                <p><strong>Water Quality:</strong> ${station.waterQuality}</p>
                <p><strong>pH Level:</strong> ${station.parameters.ph}</p>
                <p><strong>Last Updated:</strong> ${formatTime(station.lastUpdated)}</p>
                <button class="btn btn-sm btn-primary mt-1" onclick="viewStationDetails('${station.id}')">
                    View Details
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Store station data
        marker.stationData = station;
    });
}

/**
 * Get marker color based on status and water quality
 */
function getMarkerColor(status, quality) {
    if (status === 'offline') return '#6c757d';
    
    switch (quality.toLowerCase()) {
        case 'safe': return '#28a745';
        case 'warning': return '#ffc107';
        case 'critical': return '#dc3545';
        default: return '#17a2b8';
    }
}

/**
 * Update map view based on selected option
 */
function updateMapView(e) {
    const viewType = e.target.id;
    
    // Clear existing layers (except base map)
    dashboardMap.eachLayer(layer => {
        if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
            dashboardMap.removeLayer(layer);
        }
    });
    
    switch (viewType) {
        case 'stations':
            loadStationsOnMap();
            break;
        case 'reports':
            loadReportsOnMap();
            break;
        case 'heatmap':
            loadHeatmapView();
            break;
    }
}

/**
 * Load reports on map
 */
function loadReportsOnMap() {
    const reports = getMockReports();
    
    reports.forEach(report => {
        if (report.coordinates) {
            const markerColor = getSeverityColor(report.severity);
            
            const marker = L.marker([report.coordinates[0], report.coordinates[1]], {
                icon: L.divIcon({
                    html: `<div style="background: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(dashboardMap);
            
            const popupContent = `
                <div class="report-popup">
                    <h6>${report.title}</h6>
                    <p><strong>Type:</strong> ${report.type.charAt(0).toUpperCase() + report.type.slice(1)}</p>
                    <p><strong>Severity:</strong> ${report.severity.toUpperCase()}</p>
                    <p><strong>Status:</strong> ${report.status.toUpperCase()}</p>
                    <p><strong>Submitted:</strong> ${formatTime(report.submittedAt)}</p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        }
    });
}

/**
 * Load heatmap view
 */
function loadHeatmapView() {
    // This would typically use a heatmap library like Leaflet.heat
    // For now, we'll show a placeholder
    const center = dashboardMap.getCenter();
    
    const heatmapInfo = L.popup()
        .setLatLng(center)
        .setContent('Heatmap view coming soon - This will show water quality intensity across regions')
        .openOn(dashboardMap);
}

/**
 * Get severity color
 */
function getSeverityColor(severity) {
    const colors = {
        low: '#28a745',
        medium: '#ffc107',
        high: '#dc3545'
    };
    return colors[severity] || '#17a2b8';
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        showLoadingState();
        
        // In a real application, these would be API calls
        const [stationsData, reportsData, metricsData] = await Promise.all([
            loadStationsData(),
            loadReportsData(),
            loadMetricsData()
        ]);
        
        dashboardData.stations = stationsData;
        dashboardData.reports = reportsData;
        dashboardData.metrics = metricsData;
        
        updateMetricCards();
        hideLoadingState();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
        hideLoadingState();
    }
}

/**
 * Load stations data (mock)
 */
async function loadStationsData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return getMockStations();
}

/**
 * Load reports data (mock)
 */
async function loadReportsData() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockReports();
}

/**
 * Load metrics data (mock)
 */
async function loadMetricsData() {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
        totalStations: 245,
        safeStations: 187,
        alertStations: 34,
        criticalStations: 24,
        avgResponseTime: '18h',
        coveragePercentage: 76.3,
        trendsData: generateTrendData()
    };
}

/**
 * Update metric cards
 */
function updateMetricCards() {
    const metrics = dashboardData.metrics;
    
    animateCounterTo('totalStations', metrics.totalStations);
    animateCounterTo('safeStations', metrics.safeStations);
    animateCounterTo('alertStations', metrics.alertStations);
    animateCounterTo('criticalStations', metrics.criticalStations);
}

/**
 * Animate counter to target value
 */
function animateCounterTo(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1500;
    const startTime = Date.now();
    
    function updateCounter() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart(progress));
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

/**
 * Easing function for smooth animation
 */
function easeOutQuart(t) {
    return 1 - (--t) * t * t * t;
}

/**
 * Initialize charts
 */
function initializeCharts() {
    initializeWaterQualityChart();
    initializeIssueDistributionChart();
    initializeCountyAnalysisChart();
}

/**
 * Initialize water quality trends chart
 */
function initializeWaterQualityChart() {
    const ctx = document.getElementById('waterQualityChart');
    if (!ctx) return;
    
    const trendData = generateTrendData();
    
    waterQualityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [
                {
                    label: 'Safe Stations',
                    data: trendData.safe,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Warning Stations',
                    data: trendData.warning,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Critical Stations',
                    data: trendData.critical,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Number of Stations'
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

/**
 * Initialize issue distribution chart
 */
function initializeIssueDistributionChart() {
    const ctx = document.getElementById('issueDistributionChart');
    if (!ctx) return;
    
    issueDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Contamination', 'Infrastructure', 'Shortage', 'Quality'],
            datasets: [{
                data: [42, 28, 20, 10],
                backgroundColor: [
                    '#dc3545',
                    '#fd7e14',
                    '#ffc107',
                    '#17a2b8'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize county analysis chart
 */
function initializeCountyAnalysisChart() {
    const ctx = document.getElementById('countyAnalysisChart');
    if (!ctx) return;
    
    const countyData = getCountyData();
    
    countyAnalysisChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: countyData.labels,
            datasets: [{
                label: 'Water Quality Score',
                data: countyData.scores,
                backgroundColor: countyData.scores.map(score => {
                    if (score >= 80) return '#28a745';
                    if (score >= 60) return '#ffc107';
                    return '#dc3545';
                }),
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Quality Score: ' + context.parsed.y + '/100';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Counties'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Quality Score'
                    },
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

/**
 * Update water quality chart based on timeframe
 */
function updateWaterQualityChart() {
    const timeframe = document.getElementById('trendTimeframe').value;
    const newData = generateTrendData(parseInt(timeframe));
    
    waterQualityChart.data.labels = newData.labels;
    waterQualityChart.data.datasets[0].data = newData.safe;
    waterQualityChart.data.datasets[1].data = newData.warning;
    waterQualityChart.data.datasets[2].data = newData.critical;
    
    waterQualityChart.update('active');
}

/**
 * Update county analysis chart
 */
function updateCountyAnalysis() {
    const metric = document.getElementById('countyMetric').value;
    const newData = getCountyData(metric);
    
    countyAnalysisChart.data.labels = newData.labels;
    countyAnalysisChart.data.datasets[0].data = newData.scores;
    countyAnalysisChart.data.datasets[0].label = getMetricLabel(metric);
    
    countyAnalysisChart.update('active');
}

/**
 * Load recent reports
 */
function loadRecentReports() {
    const reportsContainer = document.getElementById('recentReportsList');
    if (!reportsContainer) return;
    
    const reports = getMockReports().slice(0, 5); // Get latest 5 reports
    
    if (reports.length === 0) {
        reportsContainer.innerHTML = '<p class="text-muted text-center">No recent reports</p>';
        return;
    }
    
    const reportsHTML = reports.map(report => `
        <div class="report-item slide-in">
            <div class="report-header">
                <div class="report-title">${report.title}</div>
                <span class="status-badge status-${report.severity}">${report.severity.toUpperCase()}</span>
            </div>
            <div class="report-location">
                <i class="fas fa-map-marker-alt me-1"></i>
                ${report.locationName}, ${report.county.charAt(0).toUpperCase() + report.county.slice(1)}
            </div>
            <div class="report-meta">
                <span class="text-muted">${formatTime(report.submittedAt)}</span>
                <span class="report-type">${report.type.charAt(0).toUpperCase() + report.type.slice(1)}</span>
            </div>
        </div>
    `).join('');
    
    reportsContainer.innerHTML = reportsHTML;
}

/**
 * Load action items
 */
function loadActionItems() {
    const tableBody = document.getElementById('actionItemsTable');
    if (!tableBody) return;
    
    const actionItems = getMockActionItems();
    
    const itemsHTML = actionItems.map(item => `
        <tr>
            <td>
                <span class="priority-badge ${item.priority}">${item.priority}</span>
            </td>
            <td>
                <div class="fw-semibold">${item.location}</div>
                <small class="text-muted">${item.coordinates}</small>
            </td>
            <td>
                <div>${item.issue}</div>
                <small class="text-muted">${item.description}</small>
            </td>
            <td>
                <div class="parameter-list">
                    ${item.parameters.map(param => `
                        <span class="badge bg-light text-dark me-1">${param}</span>
                    `).join('')}
                </div>
            </td>
            <td>
                <div>${formatTime(item.lastUpdated)}</div>
                <small class="text-muted">${item.duration} ago</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewStationDetails('${item.stationId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="acknowledgeAction('${item.id}')" title="Acknowledge">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="escalateAction('${item.id}')" title="Escalate">
                        <i class="fas fa-exclamation"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = itemsHTML;
}

/**
 * Setup real-time updates
 */
function setupRealTimeUpdates() {
    // Update every 30 seconds
    updateInterval = setInterval(() => {
        if (isRealTimeEnabled) {
            refreshDashboardData(false); // Silent refresh
        }
    }, 30000);
    
    // Add connection status indicator
    updateConnectionStatus();
}

/**
 * Refresh dashboard data
 */
async function refreshDashboardData(showLoading = true) {
    try {
        if (showLoading) {
            showRefreshingState();
        }
        
        // Reload all data
        await loadDashboardData();
        
        // Update charts
        updateWaterQualityChart();
        updateCountyAnalysis();
        
        // Reload reports and action items
        loadRecentReports();
        loadActionItems();
        
        // Update water parameters
        updateWaterParameters();
        
        // Update timestamp
        updateDataTimestamp();
        
        if (showLoading) {
            hideRefreshingState();
            showNotification('Dashboard data refreshed', 'success');
        }
        
    } catch (error) {
        console.error('Error refreshing dashboard data:', error);
        if (showLoading) {
            hideRefreshingState();
            showNotification('Failed to refresh data', 'error');
        }
    }
}

/**
 * Update water parameters
 */
function updateWaterParameters() {
    const station = document.getElementById('parameterStation').value;
    const parameters = getWaterParameters(station);
    
    // Update parameter displays (they're already in HTML, this would update values)
    // In a real app, this would fetch current parameter values
    console.log('Updated parameters for station:', station);
}

/**
 * View station details
 */
function viewStationDetails(stationId) {
    const station = getMockStations().find(s => s.id === stationId);
    if (!station) {
        showNotification('Station not found', 'error');
        return;
    }
    
    // Populate modal content
    const modalContent = document.getElementById('stationDetailsContent');
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="station-details">
                <div class="row mb-3">
                    <div class="col-md-6">
                        <h6>Station Information</h6>
                        <p><strong>Name:</strong> ${station.name}</p>
                        <p><strong>ID:</strong> ${station.id}</p>
                        <p><strong>Location:</strong> ${station.location}</p>
                        <p><strong>Coordinates:</strong> ${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Status</h6>
                        <p><strong>Operational Status:</strong> <span class="station-status ${station.status}">${station.status.toUpperCase()}</span></p>
                        <p><strong>Water Quality:</strong> ${station.waterQuality}</p>
                        <p><strong>Last Updated:</strong> ${formatTime(station.lastUpdated)}</p>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-12">
                        <h6>Current Parameters</h6>
                        <div class="parameter-grid">
                            <div class="parameter-item">
                                <div class="parameter-label">pH Level</div>
                                <div class="parameter-value">${station.parameters.ph}</div>
                                <div class="parameter-status ${getParameterStatus(station.parameters.ph, 'ph')}">${getParameterStatusText(station.parameters.ph, 'ph')}</div>
                            </div>
                            <div class="parameter-item">
                                <div class="parameter-label">Dissolved Oxygen</div>
                                <div class="parameter-value">${station.parameters.dissolvedOxygen} mg/L</div>
                                <div class="parameter-status ${getParameterStatus(station.parameters.dissolvedOxygen, 'do')}">${getParameterStatusText(station.parameters.dissolvedOxygen, 'do')}</div>
                            </div>
                            <div class="parameter-item">
                                <div class="parameter-label">Turbidity</div>
                                <div class="parameter-value">${station.parameters.turbidity} NTU</div>
                                <div class="parameter-status ${getParameterStatus(station.parameters.turbidity, 'turbidity')}">${getParameterStatusText(station.parameters.turbidity, 'turbidity')}</div>
                            </div>
                            <div class="parameter-item">
                                <div class="parameter-label">Temperature</div>
                                <div class="parameter-value">${station.parameters.temperature}°C</div>
                                <div class="parameter-status safe">Normal</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${station.alerts && station.alerts.length > 0 ? `
                    <div class="row">
                        <div class="col-12">
                            <h6>Active Alerts</h6>
                            <div class="alerts-list">
                                ${station.alerts.map(alert => `
                                    <div class="alert alert-${alert.severity === 'critical' ? 'danger' : 'warning'} d-flex align-items-center">
                                        <i class="fas fa-exclamation-triangle me-2"></i>
                                        <div>
                                            <strong>${alert.type}:</strong> ${alert.message}
                                            <br><small>Since: ${formatTime(alert.timestamp)}</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('stationDetailsModal'));
    modal.show();
}

/**
 * Get parameter status
 */
function getParameterStatus(value, type) {
    switch (type) {
        case 'ph':
            if (value >= 6.5 && value <= 8.5) return 'safe';
            if (value >= 6.0 && value <= 9.0) return 'warning';
            return 'critical';
        case 'do':
            if (value >= 6) return 'safe';
            if (value >= 4) return 'warning';
            return 'critical';
        case 'turbidity':
            if (value <= 1) return 'safe';
            if (value <= 4) return 'warning';
            return 'critical';
        default:
            return 'safe';
    }
}

/**
 * Get parameter status text
 */
function getParameterStatusText(value, type) {
    const status = getParameterStatus(value, type);
    switch (status) {
        case 'safe': return 'Normal';
        case 'warning': return 'Warning';
        case 'critical': return 'Critical';
        default: return 'Unknown';
    }
}

/**
 * Acknowledge action item
 */
function acknowledgeAction(actionId) {
    if (confirm('Mark this action item as acknowledged?')) {
        // In a real app, this would make an API call
        showNotification('Action item acknowledged', 'success');
        loadActionItems(); // Reload action items
    }
}

/**
 * Escalate action item
 */
function escalateAction(actionId) {
    if (confirm('Escalate this action item to higher priority?')) {
        // In a real app, this would make an API call
        showNotification('Action item escalated', 'warning');
        loadActionItems(); // Reload action items
    }
}

/**
 * Filter critical actions only
 */
function filterCriticalActions() {
    const table = document.getElementById('actionItemsTable');
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const priorityBadge = row.querySelector('.priority-badge');
        if (priorityBadge) {
            const priority = priorityBadge.classList.contains('critical');
            row.style.display = priority ? '' : 'none';
        }
    });
    
    showNotification('Showing critical actions only', 'info');
}

/**
 * Mark all actions as read
 */
function markAllActionsRead() {
    if (confirm('Mark all action items as read?')) {
        // In a real app, this would make an API call
        showNotification('All action items marked as read', 'success');
        loadActionItems(); // Reload action items
    }
}

/**
 * Export dashboard report
 */
function exportDashboardReport() {
    const exportBtn = document.getElementById('exportDashboard');
    const originalText = exportBtn.innerHTML;
    
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Generating...';
    exportBtn.disabled = true;
    
    setTimeout(() => {
        // Generate report data
        const reportData = {
            timestamp: new Date().toISOString(),
            metrics: dashboardData.metrics,
            stations: dashboardData.stations.length,
            reports: dashboardData.reports.length,
            summary: 'Dashboard report generated successfully'
        };
        
        // Create CSV content
        const csvContent = generateDashboardCSV(reportData);
        
        // Download file
        downloadCSV(csvContent, `salyte_dashboard_report_${formatDateForFilename(new Date())}.csv`);
        
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
        
        showNotification('Dashboard report exported successfully', 'success');
    }, 2000);
}

/**
 * Generate dashboard CSV
 */
function generateDashboardCSV(data) {
    const headers = [
        'Metric',
        'Value',
        'Status',
        'Last Updated'
    ];
    
    const rows = [
        ['Total Stations', data.metrics.totalStations, 'Active', new Date().toISOString()],
        ['Safe Stations', data.metrics.safeStations, 'Good', new Date().toISOString()],
        ['Alert Stations', data.metrics.alertStations, 'Warning', new Date().toISOString()],
        ['Critical Stations', data.metrics.criticalStations, 'Critical', new Date().toISOString()],
        ['Coverage Percentage', data.metrics.coveragePercentage + '%', 'Good', new Date().toISOString()]
    ];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Download CSV file
 */
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Show loading state
 */
function showLoadingState() {
    // Add loading skeletons to metric cards
    const metricCards = document.querySelectorAll('.metric-value');
    metricCards.forEach(card => {
        card.classList.add('loading-skeleton');
    });
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const metricCards = document.querySelectorAll('.metric-value');
    metricCards.forEach(card => {
        card.classList.remove('loading-skeleton');
    });
}

/**
 * Show refreshing state
 */
function showRefreshingState() {
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Refreshing...';
        refreshBtn.disabled = true;
    }
}

/**
 * Hide refreshing state
 */
function hideRefreshingState() {
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Refresh Data';
        refreshBtn.disabled = false;
    }
}

/**
 * Update connection status
 */
function updateConnectionStatus() {
    // This would typically check actual connection status
    const isOnline = navigator.onLine;
    
    // Update any connection indicators if they exist
    console.log('Connection status:', isOnline ? 'Online' : 'Offline');
}

/**
 * Update data timestamp
 */
function updateDataTimestamp() {
    const timestamps = document.querySelectorAll('.data-timestamp');
    const now = new Date();
    
    timestamps.forEach(timestamp => {
        timestamp.innerHTML = `<i class="fas fa-clock"></i> Last updated: ${formatTime(now.toISOString())}`;
    });
}

/**
 * Utility functions
 */

/**
 * Format time for display
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    
    if (diffInMinutes < 1) {
        return 'Just now';
    } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

/**
 * Format date for filename
 */
function formatDateForFilename(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
    `;
    
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
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
 * Mock data generators
 */

/**
 * Generate trend data
 */
function generateTrendData(days = 30) {
    const labels = [];
    const safe = [];
    const warning = [];
    const critical = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Generate realistic trending data
        const baseSafe = 180 + Math.random() * 20;
        const baseWarning = 30 + Math.random() * 15;
        const baseCritical = 15 + Math.random() * 20;
        
        safe.push(Math.floor(baseSafe));
        warning.push(Math.floor(baseWarning));
        critical.push(Math.floor(baseCritical));
    }
    
    return { labels, safe, warning, critical };
}

/**
 * Get county data
 */
function getCountyData(metric = 'quality') {
    const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Garissa'];
    
    let scores;
    switch (metric) {
        case 'reports':
            scores = [45, 32, 28, 38, 22, 18, 15, 12];
            break;
        case 'coverage':
            scores = [85, 72, 68, 78, 65, 60, 55, 42];
            break;
        default: // quality
            scores = [78, 85, 72, 80, 68, 75, 65, 58];
    }
    
    return { labels: counties, scores };
}

/**
 * Get metric label
 */
function getMetricLabel(metric) {
    const labels = {
        quality: 'Water Quality Score',
        reports: 'Number of Reports',
        coverage: 'Coverage Percentage'
    };
    return labels[metric] || 'Metric Value';
}

/**
 * Get water parameters for station
 */
function getWaterParameters(stationId) {
    // Mock parameter data
    return {
        ph: 7.2 + (Math.random() - 0.5) * 0.8,
        dissolvedOxygen: 8.5 + (Math.random() - 0.5) * 2,
        turbidity: 2.1 + (Math.random() - 0.5) * 1.5,
        temperature: 24 + (Math.random() - 0.5) * 4,
        conductivity: 450 + (Math.random() - 0.5) * 100,
        coliform: Math.floor(Math.random() * 3)
    };
}

/**
 * Get mock stations
 */
function getMockStations() {
    return [
        {
            id: 'station_001',
            name: 'Nairobi Central Station',
            location: 'Nairobi CBD',
            lat: -1.2921,
            lng: 36.8219,
            status: 'online',
            waterQuality: 'safe',
            lastUpdated: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            parameters: {
                ph: 7.2,
                dissolvedOxygen: 8.5,
                turbidity: 1.8,
                temperature: 23
            },
            alerts: []
        },
        {
            id: 'station_002',
            name: 'Mombasa Port Station',
            location: 'Mombasa Port',
            lat: -4.0435,
            lng: 39.6682,
            status: 'online',
            waterQuality: 'warning',
            lastUpdated: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            parameters: {
                ph: 8.8,
                dissolvedOxygen: 6.2,
                turbidity: 3.2,
                temperature: 26
            },
            alerts: [
                {
                    type: 'pH Level',
                    message: 'pH level above recommended range',
                    severity: 'warning',
                    timestamp: new Date(Date.now() - 1800000).toISOString()
                }
            ]
        },
        {
            id: 'station_003',
            name: 'Kisumu Lake Station',
            location: 'Lake Victoria',
            lat: -0.0917,
            lng: 34.7680,
            status: 'online',
            waterQuality: 'critical',
            lastUpdated: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
            parameters: {
                ph: 9.2,
                dissolvedOxygen: 3.8,
                turbidity: 6.5,
                temperature: 28
            },
            alerts: [
                {
                    type: 'Water Quality',
                    message: 'Multiple parameters exceed safe limits',
                    severity: 'critical',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                }
            ]
        }
    ];
}

/**
 * Get mock reports
 */
function getMockReports() {
    return [
        {
            id: 'rpt_001',
            trackingId: 'WR-20250115-1001',
            title: 'Water Contamination in Kibera',
            type: 'contamination',
            status: 'investigating',
            severity: 'high',
            locationName: 'Kibera Slum',
            county: 'nairobi',
            submittedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            coordinates: [-1.3167, 36.7833]
        },
        {
            id: 'rpt_002',
            trackingId: 'WR-20250114-1002',
            title: 'Broken Water Pipe',
            type: 'infrastructure',
            status: 'in-progress',
            severity: 'medium',
            locationName: 'Westlands Area',
            county: 'nairobi',
            submittedAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
            coordinates: [-1.2676, 36.8108]
        }
    ];
}

/**
 * Get mock action items
 */
function getMockActionItems() {
    return [
        {
            id: 'action_001',
            stationId: 'station_003',
            priority: 'critical',
            location: 'Kisumu Lake Station',
            coordinates: '-0.0917, 34.7680',
            issue: 'Water Quality Alert',
            description: 'Multiple parameters exceed safe limits',
            parameters: ['pH: 9.2', 'Turbidity: 6.5 NTU'],
            lastUpdated: new Date(Date.now() - 1800000).toISOString(),
            duration: '30 min'
        },
        {
            id: 'action_002',
            stationId: 'station_002',
            priority: 'high',
            location: 'Mombasa Port Station',
            coordinates: '-4.0435, 39.6682',
            issue: 'pH Level Warning',
            description: 'pH level above recommended range',
            parameters: ['pH: 8.8'],
            lastUpdated: new Date(Date.now() - 3600000).toISOString(),
            duration: '1 hour'
        }
    ];
}

// Make functions globally available
window.viewStationDetails = viewStationDetails;
window.acknowledgeAction = acknowledgeAction;
window.escalateAction = escalateAction;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

console.log('Dashboard JavaScript loaded successfully');