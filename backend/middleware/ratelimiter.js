const rateLimit = require('express-rate-limit');

/**
 * Rate limiter middleware
 * @param {number} maxRequests - number of allowed requests
 * @param {number} windowMinutes - time window in minutes
 */
function rateLimiter(maxRequests, windowMinutes) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // convert minutes to ms
    max: maxRequests,
    message: {
      error: 'Too many requests',
      message: `You can only make ${maxRequests} requests every ${windowMinutes} minutes. Please try again later.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

module.exports = rateLimiter;

