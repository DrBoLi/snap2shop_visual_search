/**
 * Visual Search - Error Handler Module
 * Centralized error handling, fallbacks, and user feedback
 */

(function() {
  'use strict';

  class ErrorHandler {
    constructor() {
      this.config = window.visualSearchConfig || {};
      this.errorHistory = [];
      this.maxHistorySize = 10;
      
      // Error type classifications
      this.errorTypes = {
        CAMERA_ACCESS_DENIED: 'camera_access_denied',
        CAMERA_NOT_FOUND: 'camera_not_found',
        CAMERA_BUSY: 'camera_busy',
        NETWORK_ERROR: 'network_error',
        API_ERROR: 'api_error',
        IMAGE_PROCESSING_ERROR: 'image_processing_error',
        FILE_TOO_LARGE: 'file_too_large',
        INVALID_FILE_TYPE: 'invalid_file_type',
        BROWSER_NOT_SUPPORTED: 'browser_not_supported',
        UNKNOWN_ERROR: 'unknown_error'
      };
      
      // User-friendly error messages
      this.errorMessages = {
        [this.errorTypes.CAMERA_ACCESS_DENIED]: {
          title: 'Camera Access Denied',
          message: 'Please allow camera access or use the upload option instead.',
          action: 'switch_to_upload',
          recoverable: true
        },
        [this.errorTypes.CAMERA_NOT_FOUND]: {
          title: 'No Camera Found',
          message: 'No camera detected on this device. Please use the upload option.',
          action: 'switch_to_upload',
          recoverable: true
        },
        [this.errorTypes.CAMERA_BUSY]: {
          title: 'Camera Busy',
          message: 'Camera is being used by another app. Please close other apps and try again.',
          action: 'retry',
          recoverable: true
        },
        [this.errorTypes.NETWORK_ERROR]: {
          title: 'Connection Error',
          message: 'Unable to connect to search service. Please check your internet connection.',
          action: 'retry',
          recoverable: true
        },
        [this.errorTypes.API_ERROR]: {
          title: 'Search Service Error',
          message: 'The search service is temporarily unavailable. Please try again later.',
          action: 'retry',
          recoverable: true
        },
        [this.errorTypes.IMAGE_PROCESSING_ERROR]: {
          title: 'Image Processing Error',
          message: 'Unable to process this image. Please try a different image.',
          action: 'clear_and_retry',
          recoverable: true
        },
        [this.errorTypes.FILE_TOO_LARGE]: {
          title: 'File Too Large',
          message: 'Please select an image smaller than 5MB.',
          action: 'clear_and_retry',
          recoverable: true
        },
        [this.errorTypes.INVALID_FILE_TYPE]: {
          title: 'Invalid File Type',
          message: 'Please select a valid image file (JPG, PNG, WebP).',
          action: 'clear_and_retry',
          recoverable: true
        },
        [this.errorTypes.BROWSER_NOT_SUPPORTED]: {
          title: 'Browser Not Supported',
          message: 'This feature requires a modern browser. Please update your browser or try upload instead.',
          action: 'switch_to_upload',
          recoverable: true
        },
        [this.errorTypes.UNKNOWN_ERROR]: {
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Please try again.',
          action: 'retry',
          recoverable: true
        }
      };
    }

    /**
     * Main error handling method
     * @param {Error|string} error 
     * @param {Object} context 
     * @param {Function} integration 
     */
    handleError(error, context = {}, integration = null) {
      const errorInfo = this.classifyError(error, context);
      const errorData = this.errorMessages[errorInfo.type];
      
      // Log error for debugging
      this.logError(errorInfo, context);
      
      // Add to history
      this.addToHistory(errorInfo);
      
      // Show user-friendly error message
      this.showErrorToUser(errorData, integration);
      
      // Execute recovery action
      this.executeRecoveryAction(errorData.action, integration, context);
      
      // Track error for analytics
      this.trackError(errorInfo, context);
      
      return {
        type: errorInfo.type,
        recoverable: errorData.recoverable,
        action: errorData.action
      };
    }

    /**
     * Classify error type based on error object and context
     * @param {Error|string} error 
     * @param {Object} context 
     * @returns {Object}
     */
    classifyError(error, context) {
      const errorMessage = typeof error === 'string' ? error : error.message || '';
      const errorName = error.name || '';
      
      // Camera-related errors
      if (context.source === 'camera') {
        if (errorName === 'NotAllowedError' || errorMessage.includes('denied')) {
          return { type: this.errorTypes.CAMERA_ACCESS_DENIED, original: error };
        }
        if (errorName === 'NotFoundError' || errorMessage.includes('not found')) {
          return { type: this.errorTypes.CAMERA_NOT_FOUND, original: error };
        }
        if (errorName === 'NotReadableError' || errorMessage.includes('busy')) {
          return { type: this.errorTypes.CAMERA_BUSY, original: error };
        }
      }
      
      // Network-related errors
      if (context.source === 'network' || errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return { type: this.errorTypes.NETWORK_ERROR, original: error };
      }
      
      // API-related errors
      if (context.source === 'api' || context.httpStatus) {
        return { type: this.errorTypes.API_ERROR, original: error, httpStatus: context.httpStatus };
      }
      
      // File-related errors
      if (context.source === 'file') {
        if (errorMessage.includes('size') || errorMessage.includes('large')) {
          return { type: this.errorTypes.FILE_TOO_LARGE, original: error };
        }
        if (errorMessage.includes('type') || errorMessage.includes('format')) {
          return { type: this.errorTypes.INVALID_FILE_TYPE, original: error };
        }
      }
      
      // Image processing errors
      if (context.source === 'processing' || errorMessage.includes('processing')) {
        return { type: this.errorTypes.IMAGE_PROCESSING_ERROR, original: error };
      }
      
      // Browser compatibility errors
      if (errorMessage.includes('not supported') || errorMessage.includes('undefined')) {
        return { type: this.errorTypes.BROWSER_NOT_SUPPORTED, original: error };
      }
      
      // Default to unknown error
      return { type: this.errorTypes.UNKNOWN_ERROR, original: error };
    }

    /**
     * Show error message to user
     * @param {Object} errorData 
     * @param {Object} integration 
     */
    showErrorToUser(errorData, integration) {
      if (integration && integration.showError) {
        integration.showError(`${errorData.title}: ${errorData.message}`);
      } else {
        console.error('[ErrorHandler] No integration provided for showing error to user');
      }
    }

    /**
     * Execute recovery action
     * @param {string} action 
     * @param {Object} integration 
     * @param {Object} context 
     */
    executeRecoveryAction(action, integration, context) {
      if (!integration) return;
      
      switch (action) {
        case 'switch_to_upload':
          setTimeout(() => {
            if (integration.switchTab) {
              integration.switchTab('upload');
            }
          }, 2000);
          break;
          
        case 'retry':
          // Don't auto-retry to avoid infinite loops
          // User can manually retry
          break;
          
        case 'clear_and_retry':
          if (integration.clearSelectedImage) {
            integration.clearSelectedImage();
          }
          if (integration.cameraCapture && integration.cameraCapture.reset) {
            integration.cameraCapture.reset();
          }
          break;
          
        default:
          console.log('[ErrorHandler] Unknown recovery action:', action);
      }
    }

    /**
     * Log error for debugging
     * @param {Object} errorInfo 
     * @param {Object} context 
     */
    logError(errorInfo, context) {
      const logData = {
        timestamp: new Date().toISOString(),
        type: errorInfo.type,
        message: errorInfo.original.message || errorInfo.original,
        context: context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      if (this.config.debug) {
        console.group('[ErrorHandler] Error Details');
        console.error('Error:', errorInfo.original);
        console.table(logData);
        console.groupEnd();
      } else {
        console.error('[ErrorHandler]', errorInfo.type, ':', errorInfo.original.message || errorInfo.original);
      }
    }

    /**
     * Add error to history
     * @param {Object} errorInfo 
     */
    addToHistory(errorInfo) {
      this.errorHistory.unshift({
        timestamp: Date.now(),
        type: errorInfo.type,
        message: errorInfo.original.message || errorInfo.original
      });
      
      // Keep history size manageable
      if (this.errorHistory.length > this.maxHistorySize) {
        this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
      }
    }

    /**
     * Track error for analytics
     * @param {Object} errorInfo 
     * @param {Object} context 
     */
    trackError(errorInfo, context) {
      // Only track in production or when analytics is available
      if (window.analytics && typeof window.analytics.track === 'function') {
        try {
          window.analytics.track('Visual Search Error', {
            error_type: errorInfo.type,
            error_message: errorInfo.original.message || errorInfo.original,
            source: context.source || 'unknown',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          });
        } catch (trackingError) {
          console.warn('[ErrorHandler] Failed to track error:', trackingError);
        }
      }
    }

    /**
     * Get error statistics
     * @returns {Object}
     */
    getErrorStats() {
      const stats = {};
      
      this.errorHistory.forEach(error => {
        stats[error.type] = (stats[error.type] || 0) + 1;
      });
      
      return {
        total: this.errorHistory.length,
        byType: stats,
        recentErrors: this.errorHistory.slice(0, 5)
      };
    }

    /**
     * Check if error is recurring
     * @param {string} errorType 
     * @param {number} timeWindow 
     * @returns {boolean}
     */
    isRecurringError(errorType, timeWindow = 60000) { // 1 minute default
      const recentErrors = this.errorHistory.filter(error => 
        error.type === errorType && 
        (Date.now() - error.timestamp) < timeWindow
      );
      
      return recentErrors.length >= 3; // 3 or more in time window
    }

    /**
     * Handle browser compatibility check
     * @returns {Object}
     */
    checkBrowserCompatibility() {
      const features = {
        mediaDevices: 'mediaDevices' in navigator,
        getUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices,
        canvas: !!document.createElement('canvas').getContext,
        fetch: 'fetch' in window,
        fileReader: 'FileReader' in window,
        blob: 'Blob' in window
      };
      
      const incompatible = Object.entries(features)
        .filter(([feature, supported]) => !supported)
        .map(([feature]) => feature);
      
      return {
        compatible: incompatible.length === 0,
        missingFeatures: incompatible,
        features: features
      };
    }

    /**
     * Create retry mechanism with exponential backoff
     * @param {Function} fn 
     * @param {number} maxAttempts 
     * @param {number} baseDelay 
     * @returns {Promise}
     */
    async retryWithBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
      let lastError;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;
          
          if (attempt === maxAttempts) {
            break;
          }
          
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`[ErrorHandler] Attempt ${attempt} failed, retrying in ${delay}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    }

    /**
     * Clear error history
     */
    clearHistory() {
      this.errorHistory = [];
    }
  }

  // Export to global scope
  window.ErrorHandler = ErrorHandler;
})();