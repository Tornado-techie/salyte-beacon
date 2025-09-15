/**
 * Database Configuration for Salyte Beacon
 * Handles MongoDB connection and configuration
 */

const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Database configuration object
 */
const dbConfig = {
    // MongoDB connection URL - use environment variable or default to local
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/salyte_beacon',
    
    // Connection options for MongoDB
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maximum number of connections in the connection pool
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
    // bufferMaxEntries: 0, // Disable mongoose buffering (removed, not supported)
        bufferCommands: false, // Disable mongoose buffering
    },
    
    // Different database names for different environments
    databases: {
        development: 'salyte_beacon_dev',
        test: 'salyte_beacon_test',
        production: 'salyte_beacon_prod'
    }
};

/**
 * Get database URI based on environment
 */
function getDatabaseURI() {
    const env = process.env.NODE_ENV || 'development';
    const baseURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = dbConfig.databases[env];
    
    // If MONGODB_URI is provided (like from MongoDB Atlas), use it as is
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv')) {
        return process.env.MONGODB_URI;
    }
    
    // Otherwise, construct URI with environment-specific database name
    return `${baseURI}/${dbName}`;
}

/**
 * Connect to MongoDB database
 */
async function connectDB() {
    try {
        const mongoURI = getDatabaseURI();
        
        console.log(`🔄 Connecting to MongoDB...`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        
        // Connect to MongoDB
        const conn = await mongoose.connect(mongoURI, dbConfig.options);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        
        // Set up connection event listeners
        setupConnectionListeners();
        
        return conn;
        
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        
        // In development, provide helpful connection tips
        if (process.env.NODE_ENV === 'development') {
            console.log('\n💡 Development Tips:');
            console.log('   - Make sure MongoDB is running locally');
            console.log('   - Check if MongoDB service is started');
            console.log('   - Verify connection string in .env file');
            console.log('   - For MongoDB Atlas, ensure network access is configured\n');
        }
        
        // Exit process with failure
        process.exit(1);
    }
}

/**
 * Set up MongoDB connection event listeners
 */
function setupConnectionListeners() {
    const db = mongoose.connection;
    
    // Connection events
    db.on('connected', () => {
        console.log('🔗 Mongoose connected to MongoDB');
    });
    
    db.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err);
    });
    
    db.on('disconnected', () => {
        console.log('🔌 Mongoose disconnected from MongoDB');
    });
    
    // Handle application termination
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts
}

/**
 * Gracefully close database connection
 */
async function gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during database shutdown:', error);
        process.exit(1);
    }
}

/**
 * Check database connection status
 */
function isConnected() {
    return mongoose.connection.readyState === 1;
}

/**
 * Get database connection info
 */
function getConnectionInfo() {
    const conn = mongoose.connection;
    return {
        readyState: conn.readyState,
        host: conn.host,
        port: conn.port,
        name: conn.name,
        collections: Object.keys(conn.collections)
    };
}

/**
 * Initialize database with default data (for development)
 */
async function initializeDatabase() {
    try {
        if (!isConnected()) {
            throw new Error('Database not connected');
        }
        
        console.log('🔄 Initializing database with sample data...');
        
        // Import models
        const User = require('../models/user');
        const Report = require('../models/Report');
        const Sensor = require('../models/Sensor');
        const DataPoint = require('../models/DataPoint');
        
        // Check if we already have data
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('📊 Database already has data, skipping initialization');
            return;
        }
        
        // Create sample data
        await createSampleData();
        
        console.log('✅ Database initialized with sample data');
        
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
    }
}

/**
 * Create sample data for development
 */
async function createSampleData() {
    const bcrypt = require('bcryptjs');
    
    // Import models
    const User = require('../models/user');
    const Sensor = require('../models/Sensor');
    const DataPoint = require('../models/DataPoint');
    const Report = require('../models/Report');
    
    // Create sample users
    const sampleUsers = [
        {
            name: 'John Doe',
            email: 'john@example.com',
            password: await bcrypt.hash('password123', 10),
            role: 'individual',
            location: 'Nairobi, Kenya'
        },
        {
            name: 'Water Authority',
            email: 'admin@waterauth.gov',
            password: await bcrypt.hash('admin123', 10),
            role: 'government',
            location: 'Nairobi, Kenya'
        }
    ];
    
    const users = await User.insertMany(sampleUsers);
    console.log(`📝 Created ${users.length} sample users`);
    
    // Create sample sensors
    const sampleSensors = [
        {
            name: 'pH Meter Pro',
            type: 'pH',
            price: 89.99,
            vendorLink: 'https://amazon.com/ph-meter',
            description: 'Professional pH meter for water testing'
        },
        {
            name: 'TDS Digital Tester',
            type: 'TDS',
            price: 24.99,
            vendorLink: 'https://jumia.co.ke/tds-meter',
            description: 'Digital TDS meter for measuring dissolved solids'
        },
        {
            name: 'Turbidity Sensor',
            type: 'Turbidity',
            price: 156.50,
            vendorLink: 'https://amazon.com/turbidity-sensor',
            description: 'Accurate turbidity measurement device'
        }
    ];
    
    const sensors = await Sensor.insertMany(sampleSensors);
    console.log(`🔬 Created ${sensors.length} sample sensors`);
    
    // Create sample data points
    const sampleDataPoints = [];
    const locations = [
        { lat: -1.2921, lng: 36.8219, name: 'Nairobi Central' },
        { lat: -1.3031, lng: 36.8073, name: 'Karen' },
        { lat: -1.2741, lng: 36.8160, name: 'Westlands' }
    ];
    
    for (let i = 0; i < 50; i++) {
        const location = locations[i % locations.length];
        const sensor = sensors[i % sensors.length];
        
        let value;
        switch (sensor.type) {
            case 'pH':
                value = 6.5 + Math.random() * 2; // pH between 6.5-8.5
                break;
            case 'TDS':
                value = 100 + Math.random() * 400; // TDS between 100-500 ppm
                break;
            case 'Turbidity':
                value = Math.random() * 10; // Turbidity between 0-10 NTU
                break;
            default:
                value = Math.random() * 100;
        }
        
        sampleDataPoints.push({
            sensorId: sensor._id,
            value: Math.round(value * 100) / 100,
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            },
            locationName: location.name
        });
    }
    
    const dataPoints = await DataPoint.insertMany(sampleDataPoints);
    console.log(`📊 Created ${dataPoints.length} sample data points`);
    
    // Create sample reports
    const sampleReports = [
        {
            user: users[0]._id,
            location: {
                type: 'Point',
                coordinates: [36.8219, -1.2921]
            },
            locationName: 'Nairobi River',
            description: 'Water has strange smell and color. Possible contamination.',
            status: 'pending',
            category: 'contamination'
        },
        {
            user: users[1]._id,
            location: {
                type: 'Point',
                coordinates: [36.8073, -1.3031]
            },
            locationName: 'Karen Borehole',
            description: 'Borehole water tested safe for consumption.',
            status: 'resolved',
            category: 'safe-source'
        }
    ];
    
    const reports = await Report.insertMany(sampleReports);
    console.log(`📋 Created ${reports.length} sample reports`);
}

/**
 * Clear all data from database (for testing)
 */
async function clearDatabase() {
    try {
        if (!isConnected()) {
            throw new Error('Database not connected');
        }
        
        console.log('🧹 Clearing database...');
        
        // Drop all collections
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
        
        console.log('✅ Database cleared');
        
    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
        throw error;
    }
}

/**
 * Database health check
 */
async function healthCheck() {
    try {
        // Simple ping to check if database is responsive
        await mongoose.connection.db.admin().ping();
        
        const info = getConnectionInfo();
        return {
            status: 'healthy',
            connected: isConnected(),
            info: info,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            status: 'unhealthy',
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Export functions and configuration
module.exports = {
    connectDB,
    isConnected,
    getConnectionInfo,
    initializeDatabase,
    clearDatabase,
    healthCheck,
    gracefulShutdown,
    dbConfig
};