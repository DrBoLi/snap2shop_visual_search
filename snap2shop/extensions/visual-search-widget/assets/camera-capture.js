/**
 * Visual Search - Camera Capture Module
 * Handles device camera access, photo capture, and permission management
 */

(function() {
  'use strict';

  class CameraCapture {
    constructor(integration) {
      this.integration = integration;
      this.stream = null;
      this.video = null;
      this.canvas = null;
      this.capturedImage = null;
      this.isActive = false;
      this.config = window.visualSearchConfig || {};
      
      // Camera constraints
      this.constraints = {
        video: {
          facingMode: 'environment', // Use rear camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
    }

    init() {
      this.video = document.getElementById('camera-video');
      this.canvas = document.getElementById('camera-canvas');
      this.bindEvents();
      this.checkCameraSupport();
    }

    checkCameraSupport() {
      const cameraTab = document.getElementById('camera-tab');
      const cameraContainer = document.getElementById('camera-container');
      
      // Check if camera API is supported
      const cameraSupported = 'mediaDevices' in navigator && 
                            'getUserMedia' in navigator.mediaDevices;
      
      if (!cameraSupported) {
        console.log('[Camera] Camera API not supported');
        cameraTab.style.display = 'none';
        return false;
      }
      
      // Check if HTTPS (required for camera access)
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost';
      
      if (!isSecure) {
        console.log('[Camera] HTTPS required for camera access');
        this.showCameraError('Camera requires secure connection (HTTPS)');
        return false;
      }
      
      // Mobile optimization
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Add capture attribute for direct camera access on mobile
        const fileInput = document.getElementById('modal-image-input');
        if (fileInput) {
          fileInput.setAttribute('capture', 'environment');
        }
      }
      
      return true;
    }

    bindEvents() {
      const startBtn = document.getElementById('camera-start-btn');
      const captureBtn = document.getElementById('camera-capture-btn');
      const retakeBtn = document.getElementById('camera-retake-btn');
      
      startBtn?.addEventListener('click', () => this.startCamera());
      captureBtn?.addEventListener('click', () => this.capturePhoto());
      retakeBtn?.addEventListener('click', () => this.retakePhoto());
    }

    async startCamera() {
      const startBtn = document.getElementById('camera-start-btn');
      const placeholder = document.querySelector('.visual-search-camera-placeholder');
      
      try {
        startBtn.disabled = true;
        startBtn.textContent = 'Starting Camera...';
        this.hideCameraError();
        
        // Request camera permission
        this.stream = await this.requestCameraPermission();
        
        if (!this.stream) {
          throw new Error('Camera access denied');
        }
        
        // Setup video stream
        this.video.srcObject = this.stream;
        this.video.play();
        
        // Wait for video to load
        await new Promise((resolve) => {
          this.video.onloadedmetadata = resolve;
        });
        
        // Show video and hide placeholder
        placeholder.style.display = 'none';
        this.video.style.display = 'block';
        startBtn.style.display = 'none';
        document.getElementById('camera-capture-btn').style.display = 'inline-block';
        
        this.isActive = true;
        console.log('[Camera] Camera started successfully');
        
      } catch (error) {
        console.error('[Camera] Failed to start camera:', error);
        this.handleCameraError(error);
        startBtn.disabled = false;
        startBtn.textContent = 'Start Camera';
      }
    }

    async requestCameraPermission() {
      try {
        // Try environment (rear) camera first
        const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
        return stream;
      } catch (error) {
        console.log('[Camera] Rear camera failed, trying front camera:', error);
        
        // Fallback to front camera
        try {
          const frontConstraints = {
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          };
          const stream = await navigator.mediaDevices.getUserMedia(frontConstraints);
          return stream;
        } catch (fallbackError) {
          console.log('[Camera] Front camera also failed:', fallbackError);
          throw fallbackError;
        }
      }
    }

    capturePhoto() {
      if (!this.video || !this.canvas) {
        console.error('[Camera] Video or canvas not available');
        return;
      }
      
      try {
        const ctx = this.canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Draw current video frame to canvas
        ctx.drawImage(this.video, 0, 0);
        
        // Hide video and show canvas
        this.video.style.display = 'none';
        this.canvas.style.display = 'block';
        
        // Update button states
        document.getElementById('camera-capture-btn').style.display = 'none';
        document.getElementById('camera-retake-btn').style.display = 'inline-block';
        
        // Convert canvas to blob
        this.canvas.toBlob((blob) => {
          this.capturedImage = blob;
          console.log('[Camera] Photo captured, size:', blob.size, 'bytes');
          
          // Enable search button
          const searchBtn = document.getElementById('modal-search-btn');
          if (searchBtn) {
            searchBtn.disabled = false;
          }
        }, 'image/jpeg', this.config.imageQuality || 0.8);
        
      } catch (error) {
        console.error('[Camera] Failed to capture photo:', error);
        this.showCameraError('Failed to capture photo');
      }
    }

    retakePhoto() {
      // Show video and hide canvas
      this.video.style.display = 'block';
      this.canvas.style.display = 'none';
      
      // Update button states
      document.getElementById('camera-capture-btn').style.display = 'inline-block';
      document.getElementById('camera-retake-btn').style.display = 'none';
      
      // Disable search button
      const searchBtn = document.getElementById('modal-search-btn');
      if (searchBtn) {
        searchBtn.disabled = true;
      }
      
      // Clear captured image
      this.capturedImage = null;
    }

    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      // Reset UI
      this.video.style.display = 'none';
      this.canvas.style.display = 'none';
      document.querySelector('.visual-search-camera-placeholder').style.display = 'block';
      
      // Reset buttons
      document.getElementById('camera-start-btn').style.display = 'inline-block';
      document.getElementById('camera-capture-btn').style.display = 'none';
      document.getElementById('camera-retake-btn').style.display = 'none';
      
      // Disable search button
      const searchBtn = document.getElementById('modal-search-btn');
      if (searchBtn) {
        searchBtn.disabled = true;
      }
      
      this.isActive = false;
      this.capturedImage = null;
    }

    handleCameraError(error) {
      // Use error handler if available
      if (this.integration.errorHandler) {
        this.integration.errorHandler.handleError(error, { source: 'camera' }, this.integration);
        return;
      }
      
      // Fallback error handling
      let errorMessage = 'Camera access failed. Please try uploading an image instead.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please use the upload option instead.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera detected. Please upload an image instead.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is busy. Please close other apps using the camera.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera resolution not supported. Trying lower quality...';
        
        // Try with lower constraints
        this.constraints.video.width = { ideal: 640 };
        this.constraints.video.height = { ideal: 480 };
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Camera access blocked by security policy.';
      }
      
      this.showCameraError(errorMessage);
      
      // Auto-switch to upload tab for certain errors
      if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
        setTimeout(() => {
          this.integration.switchTab('upload');
        }, 2000);
      }
    }

    showCameraError(message) {
      const errorContainer = document.getElementById('camera-error');
      const errorText = errorContainer.querySelector('.visual-search-error-text');
      
      if (errorText) {
        errorText.textContent = message;
      }
      errorContainer.style.display = 'block';
    }

    hideCameraError() {
      const errorContainer = document.getElementById('camera-error');
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
    }

    getCapturedImage() {
      return this.capturedImage;
    }

    hasActiveCapture() {
      return this.capturedImage !== null;
    }

    reset() {
      this.stopCamera();
      this.hideCameraError();
    }

    // Get device capabilities
    async getDeviceCapabilities() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('[Camera] Available video devices:', videoDevices.length);
        
        return {
          hasCamera: videoDevices.length > 0,
          hasMultipleCameras: videoDevices.length > 1,
          devices: videoDevices
        };
      } catch (error) {
        console.error('[Camera] Failed to enumerate devices:', error);
        return {
          hasCamera: false,
          hasMultipleCameras: false,
          devices: []
        };
      }
    }

    // Switch between front and rear cameras
    async switchCamera() {
      if (!this.isActive) return;
      
      try {
        const isFrontCamera = this.constraints.video.facingMode === 'user';
        this.constraints.video.facingMode = isFrontCamera ? 'environment' : 'user';
        
        // Stop current stream
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        
        // Start new stream with different camera
        this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
        this.video.srcObject = this.stream;
        
        console.log('[Camera] Switched to', isFrontCamera ? 'rear' : 'front', 'camera');
        
      } catch (error) {
        console.error('[Camera] Failed to switch camera:', error);
        this.handleCameraError(error);
      }
    }
  }

  // Export to global scope
  window.CameraCapture = CameraCapture;
})();