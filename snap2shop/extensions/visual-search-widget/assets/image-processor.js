/**
 * Visual Search - Image Processing Module
 * Handles client-side image optimization for CLIP model compatibility
 */

(function() {
  'use strict';

  class ImageProcessor {
    constructor() {
      this.config = window.visualSearchConfig || {};
      this.targetSize = this.config.targetSize || 224;
      this.quality = this.config.imageQuality || 0.8;
      this.maxFileSize = this.config.maxFileSize || 5242880; // 5MB
    }

    /**
     * Main processing function - handles any input type
     * @param {File|Blob|HTMLImageElement|HTMLCanvasElement} input 
     * @returns {Promise<Blob>} Processed image blob
     */
    async processImage(input) {
      try {
        console.log('[ImageProcessor] Processing image, target size:', this.targetSize);
        
        let sourceImage;
        
        if (input instanceof File || input instanceof Blob) {
          sourceImage = await this.loadImageFromBlob(input);
        } else if (input instanceof HTMLImageElement) {
          sourceImage = input;
        } else if (input instanceof HTMLCanvasElement) {
          sourceImage = await this.loadImageFromCanvas(input);
        } else {
          throw new Error('Unsupported input type');
        }
        
        // Create processing canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions for center crop to square
        const sourceSize = Math.min(sourceImage.width || sourceImage.naturalWidth, 
                                   sourceImage.height || sourceImage.naturalHeight);
        const scale = this.targetSize / sourceSize;
        
        // Set canvas to target size
        canvas.width = this.targetSize;
        canvas.height = this.targetSize;
        
        // Calculate crop position (center)
        const sourceWidth = sourceImage.width || sourceImage.naturalWidth;
        const sourceHeight = sourceImage.height || sourceImage.naturalHeight;
        const cropX = (sourceWidth - sourceSize) / 2;
        const cropY = (sourceHeight - sourceSize) / 2;
        
        // Apply image enhancements before drawing
        this.setupCanvasContext(ctx);
        
        // Draw image with center crop and resize
        ctx.drawImage(
          sourceImage,
          cropX, cropY, sourceSize, sourceSize,
          0, 0, this.targetSize, this.targetSize
        );
        
        // Apply post-processing filters if needed
        await this.applyPostProcessing(ctx, canvas);
        
        // Convert to optimized blob
        const processedBlob = await this.canvasToBlob(canvas);
        
        console.log('[ImageProcessor] Image processed successfully');
        console.log('Original size:', input.size || 'unknown');
        console.log('Processed size:', processedBlob.size, 'bytes');
        console.log('Compression ratio:', 
          input.size ? ((1 - processedBlob.size / input.size) * 100).toFixed(1) + '%' : 'N/A');
        
        return processedBlob;
        
      } catch (error) {
        console.error('[ImageProcessor] Processing failed:', error);
        throw new Error(`Image processing failed: ${error.message}`);
      }
    }

    /**
     * Load image from blob/file
     * @param {Blob|File} blob 
     * @returns {Promise<HTMLImageElement>}
     */
    loadImageFromBlob(blob) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(blob);
      });
    }

    /**
     * Load image from canvas
     * @param {HTMLCanvasElement} canvas 
     * @returns {Promise<HTMLImageElement>}
     */
    loadImageFromCanvas(canvas) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load canvas as image'));
        img.src = canvas.toDataURL();
      });
    }

    /**
     * Setup canvas context for optimal rendering
     * @param {CanvasRenderingContext2D} ctx 
     */
    setupCanvasContext(ctx) {
      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Set optimal global composite operation
      ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Apply post-processing filters for better CLIP compatibility
     * @param {CanvasRenderingContext2D} ctx 
     * @param {HTMLCanvasElement} canvas 
     */
    async applyPostProcessing(ctx, canvas) {
      // Get image data for pixel-level processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply subtle contrast enhancement for better feature extraction
      const contrastFactor = 1.1; // Slight contrast boost
      const contrast = (contrastFactor - 1) * 128;
      
      for (let i = 0; i < data.length; i += 4) {
        // Enhance contrast for RGB channels
        data[i] = Math.max(0, Math.min(255, contrastFactor * data[i] + contrast));     // Red
        data[i + 1] = Math.max(0, Math.min(255, contrastFactor * data[i + 1] + contrast)); // Green
        data[i + 2] = Math.max(0, Math.min(255, contrastFactor * data[i + 2] + contrast)); // Blue
        // Alpha channel unchanged
      }
      
      // Put processed data back
      ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Convert canvas to optimized blob
     * @param {HTMLCanvasElement} canvas 
     * @returns {Promise<Blob>}
     */
    canvasToBlob(canvas) {
      return new Promise(resolve => {
        canvas.toBlob(
          blob => resolve(blob),
          'image/jpeg',
          this.quality
        );
      });
    }

    /**
     * Validate image file before processing
     * @param {File} file 
     * @returns {Object} Validation result
     */
    validateImage(file) {
      const errors = [];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        errors.push('File must be an image (JPG, PNG, WebP, etc.)');
      }
      
      // Check file size
      if (file.size > this.maxFileSize) {
        const maxSizeMB = Math.round(this.maxFileSize / (1024 * 1024));
        errors.push(`File size must be less than ${maxSizeMB}MB`);
      }
      
      // Check if file is too small (likely corrupted)
      if (file.size < 1024) { // Less than 1KB
        errors.push('File appears to be corrupted or too small');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors
      };
    }

    /**
     * Estimate processing time based on file size
     * @param {File|Blob} input 
     * @returns {number} Estimated time in milliseconds
     */
    estimateProcessingTime(input) {
      const sizeInMB = input.size / (1024 * 1024);
      
      // Base time + size-dependent time
      // Assumes ~100ms per MB on average hardware
      const baseTime = 200; // ms
      const sizeTime = sizeInMB * 100; // ms per MB
      
      return Math.round(baseTime + sizeTime);
    }

    /**
     * Get image dimensions without loading full image
     * @param {File|Blob} file 
     * @returns {Promise<{width: number, height: number}>}
     */
    getImageDimensions(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
          URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          reject(new Error('Failed to load image for dimension check'));
        };
        img.src = URL.createObjectURL(file);
      });
    }

    /**
     * Check if image needs processing
     * @param {File|Blob} file 
     * @returns {Promise<boolean>}
     */
    async needsProcessing(file) {
      try {
        // Always process to ensure CLIP compatibility
        if (this.targetSize !== 224) return true;
        
        // Check if already optimal size and format
        if (file.type === 'image/jpeg' && file.size < 500 * 1024) { // Less than 500KB
          const dimensions = await this.getImageDimensions(file);
          if (dimensions.width === this.targetSize && dimensions.height === this.targetSize) {
            return false; // Already optimal
          }
        }
        
        return true;
      } catch (error) {
        // If we can't determine, assume processing is needed
        return true;
      }
    }

    /**
     * Create thumbnail for preview
     * @param {File|Blob} file 
     * @param {number} size 
     * @returns {Promise<string>} Data URL
     */
    async createThumbnail(file, size = 150) {
      try {
        const img = await this.loadImageFromBlob(file);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate aspect ratio
        const aspect = img.naturalWidth / img.naturalHeight;
        let width, height;
        
        if (aspect > 1) {
          width = size;
          height = size / aspect;
        } else {
          width = size * aspect;
          height = size;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        this.setupCanvasContext(ctx);
        ctx.drawImage(img, 0, 0, width, height);
        
        return canvas.toDataURL('image/jpeg', 0.8);
        
      } catch (error) {
        console.error('[ImageProcessor] Thumbnail creation failed:', error);
        return null;
      }
    }

    /**
     * Batch process multiple images
     * @param {Array<File|Blob>} files 
     * @param {Function} progressCallback 
     * @returns {Promise<Array<Blob>>}
     */
    async processMultiple(files, progressCallback) {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        try {
          const processed = await this.processImage(files[i]);
          results.push(processed);
          
          if (progressCallback) {
            progressCallback({
              current: i + 1,
              total: files.length,
              percentage: Math.round(((i + 1) / files.length) * 100)
            });
          }
        } catch (error) {
          console.error(`[ImageProcessor] Failed to process image ${i + 1}:`, error);
          results.push(null);
        }
      }
      
      return results;
    }

    /**
     * Performance monitoring
     * @param {Function} fn 
     * @param {string} label 
     * @returns {Promise<any>}
     */
    async measure(fn, label) {
      const start = performance.now();
      try {
        const result = await fn();
        const end = performance.now();
        console.log(`[ImageProcessor] ${label} took ${Math.round(end - start)}ms`);
        return result;
      } catch (error) {
        const end = performance.now();
        console.error(`[ImageProcessor] ${label} failed after ${Math.round(end - start)}ms:`, error);
        throw error;
      }
    }
  }

  // Export to global scope
  window.ImageProcessor = ImageProcessor;
})();