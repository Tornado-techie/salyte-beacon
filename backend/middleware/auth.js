/**
 * Authentication Middleware for Salyte Beacon
 * JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware to authenticate JWT tokens
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.header('x-auth-token') ||
                     req.query.token;
        
        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No token provided'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salyte-beacon-secret-key');
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'User not found'
            });
        }
        
        // Attach user to request
        req.user = decoded;
        req.userDoc = user;
        
        // Update user activity
        if (user.activity) {
            user.activity.lastActive = new Date();
            await user.save();
        }
        
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Token is malformed or invalid'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Please log in again'
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Authentication error',
            message: 'Unable to authenticate request'
        });
    }
};

/**
 * Optional authentication middleware
 * Continues even if no token is provided
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.header('x-auth-token') ||
                     req.query.token;
        
        if (!token) {
            req.user = null;
            req.userDoc = null;
            return next();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salyte-beacon-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (user) {
            req.user = decoded;
            req.userDoc = user;
            
            // Update user activity
            if (user.activity) {
                user.activity.lastActive = new Date();
                await user.save();
            }
        }
        
        next();
        
    } catch (error) {
        // Continue without authentication for optional auth
        req.user = null;
        req.userDoc = null;
        next();
    }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access this resource'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access forbidden',
                message: 'Insufficient permissions for this resource'
            });
        }
        
        next();
    };
};

/**
 * Permission-based authorization middleware
 */
const requirePermission = (resource, action) => {
    return async (req, res, next) => {
        if (!req.userDoc) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access this resource'
            });
        }
        
        const hasPermission = req.userDoc.hasPermission(resource, action);
        
        if (!hasPermission) {
            return res.status(403).json({
                error: 'Permission denied',
                message: `You don't have ${action} permission for ${resource}`
            });
        }
        
        next();
    };
};

/**
 * API quota middleware
 */
const checkApiQuota = async (req, res, next) => {
    if (!req.userDoc) {
        // Allow anonymous requests with basic rate limiting
        return next();
    }
    
    try {
        await req.userDoc.updateApiUsage();
        
        if (req.userDoc.apiUsage.quotaExceeded) {
            return res.status(429).json({
                error: 'Quota exceeded',
                message: 'API usage limit reached. Please upgrade your subscription or try again later.',
                quota: {
                    daily: req.userDoc.apiUsage.dailyRequests,
                    subscription: req.userDoc.subscription.type
                }
            });
        }
        
        next();
        
    } catch (error) {
        console.error('API quota check error:', error);
        next(); // Continue on error to avoid blocking requests
    }
};

/**
 * Email verification required middleware
 */
const requireEmailVerification = (req, res, next) => {
    if (!req.userDoc) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }
    
    if (!req.userDoc.isVerified) {
        return res.status(403).json({
            error: 'Email verification required',
            message: 'Please verify your email address to access this feature'
        });
    }
    
    next();
};

/**
 * Rate limiting by user ID
 */
const userRateLimit = (maxRequests = 60, windowMinutes = 60) => {
    const requestCounts = new Map();
    
    return (req, res, next) => {
        const userId = req.user?.userId || req.ip;
        const now = Date.now();
        const windowStart = now - (windowMinutes * 60 * 1000);
        
        // Clean old entries
        for (const [key, data] of requestCounts.entries()) {
            if (data.resetTime < now) {
                requestCounts.delete(key);
            }
        }
        
        // Get or create user request data
        let userRequests = requestCounts.get(userId);
        if (!userRequests || userRequests.resetTime < now) {
            userRequests = {
                count: 0,
                resetTime: now + (windowMinutes * 60 * 1000)
            };
            requestCounts.set(userId, userRequests);
        }
        
        // Check rate limit
        if (userRequests.count >= maxRequests) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Too many requests. Limit: ${maxRequests} per ${windowMinutes} minutes`,
                resetTime: userRequests.resetTime
            });
        }
        
        // Increment counter
        userRequests.count += 1;
        
        // Add headers
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': maxRequests - userRequests.count,
            'X-RateLimit-Reset': Math.ceil(userRequests.resetTime / 1000)
        });
        
        next();
    };
};

module.exports = {
    auth,
    optionalAuth,
    authorize,
    requirePermission,
    checkApiQuota,
    requireEmailVerification,
    userRateLimit
};