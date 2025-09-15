/**
 * Salyte Beacon Backend Server
 * Main server file handling all API routes and middleware
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import database connection
const { connectDB } = require('./config/db');

// Import route handlers
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const sensorRoutes = require('./routes/sensors');
const mapRoutes = require('./routes/map');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/report');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// ✅ CORS middleware (very important: place BEFORE routes)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static files middleware (serve frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/report', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Salyte Beacon API',
        version: '1.0.0',
        description: 'AI-powered water safety monitoring platform API',
        endpoints: {
            auth: {
                'POST /api/auth/login': 'User authentication',
                'POST /api/auth/signup': 'User registration',
                'POST /api/auth/check-email': 'Check email availability',
                'POST /api/auth/forgot-password': 'Password reset request'
            },
            chat: {
                'POST /api/chat': 'Send message to AI assistant',
                'GET /api/chat/history': 'Get chat history',
                'DELETE /api/chat/:id': 'Delete chat session'
            },
            sensors: {
                'GET /api/sensors': 'Get sensor marketplace data',
                'GET /api/sensors/:id': 'Get specific sensor details',
                'GET /api/sensors/search': 'Search sensors'
            },
            map: {
                'GET /api/map/data': 'Get map GeoJSON data',
                'GET /api/map/layers': 'Get available map layers',
                'POST /api/map/report': 'Report water quality data point'
            },
            dashboard: {
                'GET /api/dashboard/stats': 'Get dashboard statistics',
                'GET /api/dashboard/trends': 'Get trend data',
                'POST /api/dashboard/upload': 'Upload CSV data'
            },
            report: {
                'GET /api/report': 'Get community reports',
                'POST /api/report': 'Submit new report',
                'GET /api/report/:id': 'Get specific report'
            }
        }
    });
});

// Serve frontend for all non-API routes (SPA routing)
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve index.html for frontend routes
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // Database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
        return res.status(503).json({
            error: 'Database connection error',
            message: 'Unable to connect to database. Please try again later.'
        });
    }
    
    // Validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: error.message,
            details: error.errors
        });
    }
    
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Authentication error',
            message: 'Invalid or expired token'
        });
    }
    
    // File upload errors
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            error: 'File too large',
            message: 'File size exceeds 10MB limit'
        });
    }
    
    // Default server error
    res.status(error.status || 500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `API endpoint ${req.method} ${req.path} does not exist`,
        availableEndpoints: '/api/docs'
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Starting graceful shutdown...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Starting graceful shutdown...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    // Close server & exit process in production
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
🌊 Salyte Beacon Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Frontend: http://localhost:${PORT}
📚 API Docs: http://localhost:${PORT}/api/docs
💚 Health Check: http://localhost:${PORT}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    
    // Log available routes in development
    if (process.env.NODE_ENV === 'development') {
        console.log('🛣️  Available Routes:');
        console.log('   Frontend Routes:');
        console.log('   • / (Homepage)');
        console.log('   • /login (Login page)');
        console.log('   • /signup (Registration page)');
        console.log('   • /ai (AI Assistant)');
        console.log('   • /cartomap (Interactive Map)');
        console.log('   • /marketplace (Sensor Marketplace)');
        console.log('   • /knowledge (Knowledge Hub)');
        console.log('   • /dashboard (Data Dashboard)');
        console.log('   • /report (Community Reporting)');
        console.log('');
        console.log('   API Routes:');
        console.log('   • /api/auth/* (Authentication)');
        console.log('   • /api/chat/* (AI Chat)');
        console.log('   • /api/sensors/* (Sensor Data)');
        console.log('   • /api/map/* (Map Data)');
        console.log('   • /api/dashboard/* (Dashboard Data)');
        console.log('   • /api/report/* (Community Reports)');
    }
});

// Export app for testing
module.exports = app;