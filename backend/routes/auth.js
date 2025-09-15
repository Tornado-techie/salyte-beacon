/**
 * Authentication Routes for Salyte Beacon
 * Handles user registration, login, password reset, and profile management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import User model
const User = require('../models/user.js');

// Import middleware
const { auth } = require('../middleware/auth');
const ratelimiter = require('../middleware/ratelimiter');

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup', ratelimiter(5, 15), async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, role, location, newsletter } = req.body;
        
        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'First name, last name, email, and password are required'
            });
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                message: 'Please provide a valid email address'
            });
        }
        
        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Weak password',
                message: 'Password must be at least 8 characters long'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create new user
        const newUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim(),
            password: hashedPassword,
            role: role || 'individual',
            location: location?.trim(),
            preferences: {
                newsletter: newsletter || false,
                emailNotifications: true,
                dataSharing: false
            },
            profile: {
                isComplete: false,
                lastUpdated: new Date()
            }
        });
        
        // Save user to database
        await newUser.save();
        
        // Generate JWT token
        const payload = {
            userId: newUser._id,
            email: newUser.email,
            role: newUser.role
        };
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'salyte-beacon-secret-key',
            { expiresIn: '7d' }
        );
        
        // Response (don't send password)
        const userResponse = {
            id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
            isVerified: newUser.isVerified,
            createdAt: newUser.createdAt
        };
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: userResponse,
            token: token
        });
        
        // Log successful registration
        console.log(`✅ New user registered: ${email} (${role})`);
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'Unable to create account. Please try again.'
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', ratelimiter(10, 15), async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }
        
        // Check if account is locked
        if (user.loginAttempts >= 5) {
            const lockTime = new Date(user.lastLoginAttempt.getTime() + 30 * 60 * 1000); // 30 minutes
            if (new Date() < lockTime) {
                return res.status(423).json({
                    error: 'Account locked',
                    message: 'Too many failed login attempts. Please try again later.'
                });
            }
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Increment failed login attempts
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            user.lastLoginAttempt = new Date();
            await user.save();
            
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }
        
        // Reset login attempts on successful login
        user.loginAttempts = 0;
        user.lastLogin = new Date();
        await user.save();
        
        // Generate JWT token
        const tokenExpiry = rememberMe ? '30d' : '7d';
        const payload = {
            userId: user._id,
            email: user.email,
            role: user.role
        };
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'salyte-beacon-secret-key',
            { expiresIn: tokenExpiry }
        );
        
        // Response (don't send password)
        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            lastLogin: user.lastLogin
        };
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token: token
        });
        
        // Log successful login
        console.log(`✅ User logged in: ${email}`);
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'Unable to process login. Please try again.'
        });
    }
});

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email is available for registration
 * @access  Public
 */
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: 'Missing email',
                message: 'Email is required'
            });
        }
        
        // Check if email exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        res.json({
            available: !existingUser,
            email: email.toLowerCase()
        });
        
    } catch (error) {
        console.error('Email check error:', error);
        res.status(500).json({
            error: 'Email check failed',
            message: 'Unable to verify email availability'
        });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', ratelimiter(3, 60), async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: 'Missing email',
                message: 'Email is required'
            });
        }
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account with this email exists, a password reset link has been sent.'
            });
        }
        
        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id, purpose: 'password-reset' },
            process.env.JWT_SECRET || 'salyte-beacon-secret-key',
            { expiresIn: '1h' }
        );
        
        // Save reset token to user (in production, you'd send email here)
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();
        
        // Mock email sending (in production, integrate with email service)
        console.log(`📧 Password reset requested for: ${email}`);
        console.log(`🔗 Reset link: http://localhost:3000/reset-password?token=${resetToken}`);
        
        res.json({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent.'
        });
        
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            error: 'Password reset failed',
            message: 'Unable to process password reset request'
        });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password with token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Reset token and new password are required'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Weak password',
                message: 'Password must be at least 8 characters long'
            });
        }
        
        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'salyte-beacon-secret-key');
        } catch (jwtError) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Password reset token is invalid or expired'
            });
        }
        
        // Find user and check token
        const user = await User.findById(decoded.userId);
        if (!user || user.passwordResetToken !== token) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Password reset token is invalid or expired'
            });
        }
        
        // Check token expiration
        if (new Date() > user.passwordResetExpires) {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Password reset token has expired'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Update password and clear reset token
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.loginAttempts = 0; // Reset login attempts
        await user.save();
        
        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
        
        console.log(`🔐 Password reset successful for user: ${user.email}`);
        
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            error: 'Password reset failed',
            message: 'Unable to reset password. Please try again.'
        });
    }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
    try {
        // User is attached to req by auth middleware
        const user = await User.findById(req.user.userId).select('-password -passwordResetToken');
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User profile not found'
            });
        }
        
        res.json({
            success: true,
            user: user
        });
        
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: 'Profile fetch failed',
            message: 'Unable to fetch user profile'
        });
    }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, location, preferences } = req.body;
        
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User profile not found'
            });
        }
        
        // Update allowed fields
        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (phone !== undefined) user.phone = phone?.trim();
        if (location !== undefined) user.location = location?.trim();
        if (preferences) user.preferences = { ...user.preferences, ...preferences };
        
        user.profile.lastUpdated = new Date();
        user.profile.isComplete = !!(user.firstName && user.lastName && user.phone && user.location);
        
        await user.save();
        
        // Return updated user (without password)
        const updatedUser = await User.findById(user._id).select('-password -passwordResetToken');
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });
        
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Profile update failed',
            message: 'Unable to update profile. Please try again.'
        });
    }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Missing passwords',
                message: 'Current and new passwords are required'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Weak password',
                message: 'New password must be at least 8 characters long'
            });
        }
        
        // Get user with password
        const user = await User.findById(req.user.userId).select('+password');
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                error: 'Invalid password',
                message: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        
        // Update password
        user.password = hashedNewPassword;
        await user.save();
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
        
        console.log(`🔐 Password changed for user: ${user.email}`);
        
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            error: 'Password change failed',
            message: 'Unable to change password. Please try again.'
        });
    }
});

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', auth, async (req, res) => {
    try {
        const { password, confirmation } = req.body;
        
        if (!password || confirmation !== 'DELETE_MY_ACCOUNT') {
            return res.status(400).json({
                error: 'Invalid confirmation',
                message: 'Password and confirmation text required'
            });
        }
        
        // Get user with password
        const user = await User.findById(req.user.userId).select('+password');
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid password',
                message: 'Password is incorrect'
            });
        }
        
        // Delete user account
        await User.findByIdAndDelete(req.user.userId);
        
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
        
        console.log(`🗑️ Account deleted for user: ${user.email}`);
        
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({
            error: 'Account deletion failed',
            message: 'Unable to delete account. Please try again.'
        });
    }
});

module.exports = router;

console.log("AUTH ROUTE DIR:", __dirname);
console.log("Looking for:", require('path').join(__dirname, "../models/user.js"));
