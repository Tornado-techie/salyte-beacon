/**
 * User Model for Salyte Beacon
 * Defines user schema with authentication, profile, and preference fields
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    // Basic Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxLength: [50, 'First name cannot exceed 50 characters']
    },
    
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxLength: [50, 'Last name cannot exceed 50 characters']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    
    // Authentication
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    
    role: {
        type: String,
        enum: ['individual', 'organization', 'researcher', 'government', 'ngo', 'admin'],
        default: 'individual'
    },
    
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // Location and Profile
    location: {
        type: String,
        trim: true,
        maxLength: [100, 'Location cannot exceed 100 characters']
    },
    
    profile: {
        isComplete: {
            type: Boolean,
            default: false
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        bio: {
            type: String,
            maxLength: [500, 'Bio cannot exceed 500 characters']
        },
        organization: {
            type: String,
            maxLength: [100, 'Organization name cannot exceed 100 characters']
        },
        website: {
            type: String,
            match: [/^https?:\/\//, 'Please enter a valid URL']
        }
    },
    
    // User Preferences
    preferences: {
        newsletter: {
            type: Boolean,
            default: false
        },
        emailNotifications: {
            type: Boolean,
            default: true
        },
        dataSharing: {
            type: Boolean,
            default: false
        },
        language: {
            type: String,
            enum: ['en', 'sw', 'fr', 'es'],
            default: 'en'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        units: {
            type: String,
            enum: ['metric', 'imperial'],
            default: 'metric'
        }
    },
    
    // Security and Authentication
    loginAttempts: {
        type: Number,
        default: 0
    },
    
    lastLoginAttempt: {
        type: Date
    },
    
    lastLogin: {
        type: Date
    },
    
    passwordResetToken: {
        type: String,
        select: false
    },
    
    passwordResetExpires: {
        type: Date,
        select: false
    },
    
    emailVerificationToken: {
        type: String,
        select: false
    },
    
    emailVerificationExpires: {
        type: Date,
        select: false
    },
    
    // Activity Tracking
    activity: {
        lastActive: {
            type: Date,
            default: Date.now
        },
        totalLogins: {
            type: Number,
            default: 0
        },
        chatSessions: {
            type: Number,
            default: 0
        },
        reportsSubmitted: {
            type: Number,
            default: 0
        },
        dataPointsContributed: {
            type: Number,
            default: 0
        }
    },
    
    // Subscription and Permissions
    subscription: {
        type: {
            type: String,
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: 'free'
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        autoRenew: {
            type: Boolean,
            default: false
        }
    },
    
    permissions: [{
        resource: {
            type: String,
            required: true
        },
        actions: [{
            type: String,
            enum: ['read', 'write', 'delete', 'admin']
        }],
        granted: {
            type: Date,
            default: Date.now
        },
        grantedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // API Usage (for rate limiting and analytics)
    apiUsage: {
        dailyRequests: {
            type: Number,
            default: 0
        },
        monthlyRequests: {
            type: Number,
            default: 0
        },
        lastRequestDate: {
            type: Date
        },
        quotaExceeded: {
            type: Boolean,
            default: false
        }
    },
    
    // GDPR and Privacy
    privacy: {
        dataProcessingConsent: {
            type: Boolean,
            default: false
        },
        marketingConsent: {
            type: Boolean,
            default: false
        },
        consentDate: {
            type: Date
        },
        dataRetentionPeriod: {
            type: Number, // days
            default: 365
        }
    },
    
    // Metadata
    metadata: {
        registrationSource: {
            type: String,
            enum: ['web', 'mobile', 'api', 'social', 'referral'],
            default: 'web'
        },
        referralCode: {
            type: String
        },
        utmSource: {
            type: String
        },
        utmMedium: {
            type: String
        },
        utmCampaign: {
            type: String
        },
        ipAddress: {
            type: String
        },
        userAgent: {
            type: String
        }
    }
    
}, {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'users'
});

// Indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'activity.lastActive': -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ location: 'text', 'profile.organization': 'text' });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
    if (!this.createdAt) return 0;
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for subscription status
userSchema.virtual('isSubscriptionActive').get(function() {
    if (this.subscription.type === 'free') return true;
    if (!this.subscription.endDate) return false;
    return new Date() < this.subscription.endDate;
});

// Pre-save middleware
userSchema.pre('save', function(next) {
    // Update profile completion status
    this.profile.isComplete = !!(
        this.firstName &&
        this.lastName &&
        this.email &&
        this.phone &&
        this.location
    );
    
    // Update last updated timestamp
    if (this.isModified() && !this.isNew) {
        this.profile.lastUpdated = new Date();
    }
    
    // Increment total logins if lastLogin is being set
    if (this.isModified('lastLogin') && !this.isNew) {
        this.activity.totalLogins += 1;
    }
    
    next();
});

// Instance methods
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    
    // Remove sensitive fields
    delete user.password;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpires;
    
    return user;
};

userSchema.methods.hasPermission = function(resource, action) {
    if (this.role === 'admin') return true;
    
    const permission = this.permissions.find(p => p.resource === resource);
    return permission && permission.actions.includes(action);
};

userSchema.methods.updateApiUsage = function() {
    const today = new Date();
    const isNewDay = !this.apiUsage.lastRequestDate || 
                     this.apiUsage.lastRequestDate.toDateString() !== today.toDateString();
    
    if (isNewDay) {
        this.apiUsage.dailyRequests = 1;
    } else {
        this.apiUsage.dailyRequests += 1;
    }
    
    this.apiUsage.monthlyRequests += 1;
    this.apiUsage.lastRequestDate = today;
    this.activity.lastActive = today;
    
    // Check quota based on subscription
    const quotaLimits = {
        free: { daily: 100, monthly: 1000 },
        basic: { daily: 500, monthly: 10000 },
        premium: { daily: 2000, monthly: 50000 },
        enterprise: { daily: Infinity, monthly: Infinity }
    };
    
    const userQuota = quotaLimits[this.subscription.type];
    this.apiUsage.quotaExceeded = this.apiUsage.dailyRequests > userQuota.daily || 
                                  this.apiUsage.monthlyRequests > userQuota.monthly;
    
    return this.save();
};

userSchema.methods.resetMonthlyUsage = function() {
    this.apiUsage.monthlyRequests = 0;
    this.apiUsage.quotaExceeded = false;
    return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getActiveUsers = function(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.find({ 'activity.lastActive': { $gte: cutoffDate } });
};

userSchema.statics.getUserStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
                activeUsers: {
                    $sum: {
                        $cond: [
                            {
                                $gte: [
                                    '$activity.lastActive',
                                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalUsers: 1,
                verifiedUsers: 1,
                activeUsers: 1,
                verificationRate: {
                    $multiply: [{ $divide: ['$verifiedUsers', '$totalUsers'] }, 100]
                },
                activityRate: {
                    $multiply: [{ $divide: ['$activeUsers', '$totalUsers'] }, 100]
                }
            }
        }
    ]);
    
    return stats[0] || {
        totalUsers: 0,
        verifiedUsers: 0,
        activeUsers: 0,
        verificationRate: 0,
        activityRate: 0
    };
};

// Create and export the model
const User = mongoose.model('User', userSchema);

module.exports = User;