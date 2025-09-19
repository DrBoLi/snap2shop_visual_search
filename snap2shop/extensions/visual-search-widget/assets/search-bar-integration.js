/**
 * Visual Search - Search Bar Integration
 * Adds camera icon to existing search bars and handles modal display
 */

(function() {
  'use strict';

  class VisualSearchIntegration {
    constructor() {
      this.modal = null;
      this.searchInputs = [];
      this.config = window.visualSearchConfig || {};
      this.modalId = 'visual-search-modal';
      this.initialized = false;
      this.errorHandler = null;
      
      // Multiple selector strategy for theme compatibility
      this.searchSelectors = [
        'input[type="search"]',
        '.header__search-bar',
        '#Search-In-Modal',
        '.search-modal__form input',
        '.predictive-search__input',
        '.search-bar__input',
        'form[action*="/search"] input[type="text"]',
        '.search-form__input',
        '.site-header__search-input',
        '.predictive-search input',
        '.header__search input',
        '.search__input',
        'input[name="q"]'
      ];

      this.init();
    }

    init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }

      // Re-scan for search inputs on dynamic content changes
      this.observeDOM();
    }

    setup() {
      if (this.initialized) return;
      
      console.log('[Visual Search] Initializing search bar integration');
      
      // Initialize error handler
      if (typeof ErrorHandler !== 'undefined') {
        this.errorHandler = new ErrorHandler();
        
        // Check browser compatibility
        const compatibility = this.errorHandler.checkBrowserCompatibility();
        if (!compatibility.compatible) {
          console.warn('[Visual Search] Browser compatibility issues:', compatibility.missingFeatures);
        }
      }
      
      this.findSearchInputs();
      this.injectCameraIcons();
      this.createModal();
      this.bindEvents();
      
      // Special handling for predictive search (Dawn theme and others)
      this.setupPredictiveSearchHandling();
      
      this.initialized = true;
    }

    findSearchInputs() {
      // Clear existing inputs
      this.searchInputs = [];
      
      // Find all matching search inputs
      this.searchSelectors.forEach(selector => {
        const inputs = document.querySelectorAll(selector);
        inputs.forEach(input => {
          // Avoid duplicates and ensure it's visible
          if (!this.searchInputs.includes(input) && this.isVisible(input)) {
            this.searchInputs.push(input);
          }
        });
      });

      // Additional heuristic search for inputs that might be search bars
      const allInputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
      allInputs.forEach(input => {
        if (this.searchInputs.includes(input)) return;
        
        // Check if input looks like a search bar
        if (this.looksLikeSearchInput(input) && this.isVisible(input)) {
          this.searchInputs.push(input);
        }
      });

      console.log(`[Visual Search] Found ${this.searchInputs.length} search inputs`);
    }

    looksLikeSearchInput(input) {
      // Check input attributes
      const placeholder = (input.placeholder || '').toLowerCase();
      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const className = (input.className || '').toLowerCase();
      
      // Search-related keywords
      const searchKeywords = ['search', 'query', 'find', 'look'];
      
      // Check if any search keywords appear in attributes
      const hasSearchKeyword = searchKeywords.some(keyword => 
        placeholder.includes(keyword) || 
        name.includes(keyword) || 
        id.includes(keyword) || 
        className.includes(keyword)
      );
      
      if (hasSearchKeyword) return true;
      
      // Check if input is in a search-related container
      const container = input.closest('[class*="search"], [id*="search"], form[action*="/search"]');
      if (container) return true;
      
      // Check if there's a search icon nearby
      const nearbySearchIcon = this.findSearchIcon(input);
      if (nearbySearchIcon) return true;
      
      return false;
    }

    isVisible(element) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      return rect.width > 0 && 
             rect.height > 0 && 
             style.display !== 'none' && 
             style.visibility !== 'hidden' &&
             style.opacity !== '0';
    }

    injectCameraIcons() {
      this.searchInputs.forEach(input => {
        // Check if camera icon already exists
        if (input.dataset.visualSearchEnabled) return;
        
        // Create camera icon button
        const cameraButton = this.createCameraButton();
        
        // Find the search container and insertion point
        const insertionPoint = this.findOptimalInsertionPoint(input);
        
        if (insertionPoint.method === 'inside-container') {
          // Insert inside the search container, positioned absolutely
          insertionPoint.container.appendChild(cameraButton);
          this.positionCameraIconInside(cameraButton, insertionPoint.container);
        } else if (insertionPoint.method === 'next-to-search-icon') {
          // Insert next to existing search icon
          insertionPoint.referenceElement.parentNode.insertBefore(cameraButton, insertionPoint.referenceElement.nextSibling);
          this.positionCameraIconNextToSearch(cameraButton);
        } else if (insertionPoint.method === 'in-form') {
          // Insert in form but position relative to input
          insertionPoint.container.appendChild(cameraButton);
          this.positionCameraIconInForm(cameraButton, input);
        } else {
          // Fallback: create wrapper
          this.createInputWrapper(input, cameraButton);
        }
        
        // Mark input as processed
        input.dataset.visualSearchEnabled = 'true';
      });
    }

    findOptimalInsertionPoint(input) {
      // First priority: Look for the input's parent container
      const inputParent = input.parentElement;
      
      // Check if we're in a predictive search or search modal
      const searchContainer = input.closest('.predictive-search, .search, .header__search, [class*="search-modal"], [class*="search-form"]');
      
      if (searchContainer) {
        // Always use inside-container method for search modals
        return {
          method: 'inside-container',
          container: searchContainer
        };
      }
      
      // Look for search icon (magnifying glass)
      const searchIcon = this.findSearchIcon(input);
      if (searchIcon) {
        return {
          method: 'next-to-search-icon',
          referenceElement: searchIcon,
          container: searchIcon.parentElement
        };
      }
      
      // Look for form container
      const form = input.closest('form');
      if (form) {
        return {
          method: 'in-form',
          container: form
        };
      }
      
      // Fallback to wrapper method
      return {
        method: 'wrapper',
        container: inputParent
      };
    }

    findSearchIcon(input) {
      // Look for search icon within the same container
      const container = input.closest('.search, .header__search, .predictive-search, form, [class*="search"]');
      if (!container) return null;
      
      // Common search icon selectors - ordered by specificity
      const iconSelectors = [
        // SVG elements that are likely magnifying glasses
        'svg[class*="search"]',
        'svg[viewBox*="24 24"] path[d*="M21"]', // Common magnifying glass SVG path
        'svg[viewBox*="0 0 24 24"]', // Generic 24x24 SVG (likely an icon)
        // Class-based selectors
        '.search-icon',
        '.icon-search',
        '[class*="search-icon"]',
        '[class*="icon-search"]',
        // Button selectors
        'button[type="submit"] svg',
        '.search__submit svg',
        '.predictive-search__submit svg',
        // Generic SVG as last resort
        'svg'
      ];
      
      for (const selector of iconSelectors) {
        const icons = container.querySelectorAll(selector);
        // Find the icon that's likely the magnifying glass (usually the first visible one)
        for (const icon of icons) {
          if (this.isVisible(icon)) {
            return icon;
          }
        }
      }
      
      return null;
    }

    positionCameraIconInside(cameraButton, container) {
      // Position on the right side of the search bar
      console.log('[Visual Search] Positioning camera icon on the right side');
      
      cameraButton.style.cssText = `
        position: absolute;
        right: 45px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1000;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.2s;
        min-width: 36px;
        min-height: 36px;
        border-radius: 4px;
      `;
    }

    positionCameraIconNextToSearch(cameraButton) {
      cameraButton.setAttribute('data-position', 'next-to-search');
      cameraButton.style.cssText = `
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.2s;
        margin-left: 4px;
      `;
    }

    positionCameraIconInForm(cameraButton, input) {
      const inputRect = input.getBoundingClientRect();
      const containerRect = cameraButton.parentElement.getBoundingClientRect();
      
      cameraButton.style.cssText = `
        position: absolute;
        right: 75px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.2s;
      `;
    }

    createInputWrapper(input, cameraButton) {
      const wrapper = document.createElement('div');
      wrapper.className = 'visual-search-input-wrapper';
      wrapper.style.cssText = 'position: relative; display: flex; align-items: center;';
      
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      wrapper.appendChild(cameraButton);
      
      cameraButton.style.cssText = `
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.2s;
        margin-left: 8px;
      `;
    }

    createCameraButton() {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'visual-search-camera-btn';
      button.setAttribute('aria-label', 'Search by image');
      button.setAttribute('title', 'Search by image');
      
      // Camera icon SVG
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      `;
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Visual Search] Camera button clicked!');
        
        // Debug modal existence
        console.log('[Visual Search] Modal exists:', !!this.modal);
        if (this.modal) {
          console.log('[Visual Search] Modal element:', this.modal);
          console.log('[Visual Search] Modal display:', this.modal.style.display);
        }
        
        this.openModal();
      });
      
      button.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.opacity = '0.7';
      });
      
      return button;
    }

    createModal() {
      // Check if modal already exists
      if (document.getElementById(this.modalId)) {
        this.modal = document.getElementById(this.modalId);
        console.log('[Visual Search] Using existing modal:', this.modal);
        return;
      }
      
      console.log('[Visual Search] Creating new modal...');
      
      // Create modal container
      const modal = document.createElement('div');
      modal.id = this.modalId;
      modal.className = 'visual-search-modal';
      modal.style.display = 'none';
      
      // Modal HTML structure
      modal.innerHTML = `
        <div class="visual-search-modal-overlay"></div>
        <div class="visual-search-modal-content">
          <div class="visual-search-modal-header">
            <h2 class="visual-search-modal-title">Search by Image</h2>
            <button type="button" class="visual-search-modal-close" aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="visual-search-modal-body">
            <!-- Tab navigation -->
            <div class="visual-search-tabs">
              <button type="button" class="visual-search-tab active" data-tab="upload">
                Upload Image
              </button>
              <button type="button" class="visual-search-tab" data-tab="camera" id="camera-tab">
                Take Photo
              </button>
            </div>
            
            <!-- Tab content -->
            <div class="visual-search-tab-content">
              <!-- Upload tab -->
              <div class="visual-search-tab-panel active" data-panel="upload">
                <div class="visual-search-upload-area" id="modal-upload-area">
                  <div class="visual-search-upload-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17,8 12,3 7,8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p class="visual-search-upload-text">Drop an image here or click to browse</p>
                    <p class="visual-search-upload-hint">Supports JPG, PNG, WebP up to 5MB</p>
                  </div>
                  <input type="file" id="modal-image-input" class="visual-search-file-input" accept="image/*" capture="environment" hidden>
                  <div class="visual-search-image-preview" id="modal-image-preview" style="display: none;">
                    <img class="visual-search-preview-image" id="modal-preview-image" alt="Uploaded image">
                    <button class="visual-search-remove-image" id="modal-remove-image" type="button">&times;</button>
                  </div>
                </div>
              </div>
              
              <!-- Camera tab -->
              <div class="visual-search-tab-panel" data-panel="camera">
                <div class="visual-search-camera-container" id="camera-container">
                  <div class="visual-search-camera-placeholder">
                    <p>Click "Start Camera" to begin</p>
                  </div>
                  <video class="visual-search-camera-video" id="camera-video" style="display: none;" autoplay playsinline></video>
                  <canvas class="visual-search-camera-canvas" id="camera-canvas" style="display: none;"></canvas>
                  <div class="visual-search-camera-controls">
                    <button type="button" class="visual-search-camera-start" id="camera-start-btn">
                      Start Camera
                    </button>
                    <button type="button" class="visual-search-camera-capture" id="camera-capture-btn" style="display: none;">
                      Capture Photo
                    </button>
                    <button type="button" class="visual-search-camera-retake" id="camera-retake-btn" style="display: none;">
                      Retake
                    </button>
                  </div>
                  <div class="visual-search-camera-error" id="camera-error" style="display: none;">
                    <p class="visual-search-error-text"></p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Search button -->
            <button type="button" class="visual-search-submit-btn" id="modal-search-btn" disabled>
              <span class="visual-search-submit-text">Find Similar Products</span>
              <span class="visual-search-loading-spinner" style="display: none;">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
                  <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" stroke-width="2" fill="none">
                    <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
                  </path>
                </svg>
              </span>
            </button>
            
            <!-- Error message -->
            <div class="visual-search-error-message" id="modal-error" style="display: none;">
              <p class="visual-search-error-text"></p>
            </div>
            
            <!-- Results -->
            <div class="visual-search-results" id="modal-results" style="display: none;">
              <div class="visual-search-results-header">
                <h3>Similar Products</h3>
                <button type="button" class="visual-search-clear-results" id="modal-clear-results">Clear</button>
              </div>
              <div class="visual-search-results-grid" id="modal-results-grid">
                <!-- Results will be populated here -->
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      this.modal = modal;
      
      console.log('[Visual Search] Modal created and added to DOM:', this.modal);
      console.log('[Visual Search] Modal is in DOM:', document.body.contains(this.modal));
    }

    bindEvents() {
      if (!this.modal) return;
      
      // Close button
      const closeBtn = this.modal.querySelector('.visual-search-modal-close');
      closeBtn.addEventListener('click', () => this.closeModal());
      
      // Overlay click
      const overlay = this.modal.querySelector('.visual-search-modal-overlay');
      overlay.addEventListener('click', () => this.closeModal());
      
      // Tab switching
      const tabs = this.modal.querySelectorAll('.visual-search-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
      });
      
      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.style.display !== 'none') {
          this.closeModal();
        }
      });
      
      // Initialize upload handler
      this.initUploadHandler();
      
      // Initialize camera handler (will be implemented in Phase 2)
      this.initCameraHandler();
    }

    initUploadHandler() {
      const uploadArea = this.modal.querySelector('#modal-upload-area');
      const fileInput = this.modal.querySelector('#modal-image-input');
      const preview = this.modal.querySelector('#modal-image-preview');
      const previewImg = this.modal.querySelector('#modal-preview-image');
      const removeBtn = this.modal.querySelector('#modal-remove-image');
      const searchBtn = this.modal.querySelector('#modal-search-btn');
      
      let selectedFile = null;
      
      // Click to upload
      uploadArea.addEventListener('click', () => {
        if (preview.style.display === 'none') {
          fileInput.click();
        }
      });
      
      // Drag and drop
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });
      
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          handleFileSelect(files[0]);
        }
      });
      
      // File input change
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFileSelect(e.target.files[0]);
        }
      });
      
      // Remove image
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedImage();
      });
      
      // Search button
      searchBtn.addEventListener('click', () => {
        const activeTab = this.modal.querySelector('.visual-search-tab.active').dataset.tab;
        
        if (activeTab === 'upload' && selectedFile) {
          this.performSearch(selectedFile);
        } else if (activeTab === 'camera' && this.cameraCapture && this.cameraCapture.hasActiveCapture()) {
          const capturedImage = this.cameraCapture.getCapturedImage();
          if (capturedImage) {
            this.performSearch(capturedImage);
          }
        }
      });
      
      const handleFileSelect = (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          if (this.errorHandler) {
            this.errorHandler.handleError('Invalid file type', { source: 'file' }, this);
          } else {
            this.showError('Please select a valid image file (JPG, PNG, WebP)');
          }
          return;
        }
        
        // Validate file size (5MB default)
        const maxSize = this.config.maxFileSize || 5242880;
        if (file.size > maxSize) {
          if (this.errorHandler) {
            this.errorHandler.handleError('File too large', { source: 'file' }, this);
          } else {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            this.showError(`File size must be less than ${maxSizeMB}MB`);
          }
          return;
        }
        
        selectedFile = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          uploadArea.querySelector('.visual-search-upload-placeholder').style.display = 'none';
          preview.style.display = 'block';
          searchBtn.disabled = false;
          this.hideError();
        };
        reader.readAsDataURL(file);
      };
      
      const clearSelectedImage = () => {
        selectedFile = null;
        preview.style.display = 'none';
        uploadArea.querySelector('.visual-search-upload-placeholder').style.display = 'flex';
        searchBtn.disabled = true;
        fileInput.value = '';
      };
    }

    initCameraHandler() {
      // Initialize camera capture if available
      if (typeof CameraCapture !== 'undefined') {
        this.cameraCapture = new CameraCapture(this);
        this.cameraCapture.init();
      } else {
        console.warn('[Visual Search] CameraCapture module not loaded');
        const cameraTab = this.modal.querySelector('#camera-tab');
        if (cameraTab) {
          cameraTab.style.display = 'none';
        }
      }
    }

    switchTab(tabName) {
      // Update tab buttons
      const tabs = this.modal.querySelectorAll('.visual-search-tab');
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });
      
      // Update tab panels
      const panels = this.modal.querySelectorAll('.visual-search-tab-panel');
      panels.forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === tabName);
      });
    }

    async performSearch(file) {
      const searchBtn = this.modal.querySelector('#modal-search-btn');
      const resultsContainer = this.modal.querySelector('#modal-results');
      const resultsGrid = this.modal.querySelector('#modal-results-grid');
      
      this.setLoading(true);
      this.hideError();
      
      try {
        // Process image before upload
        const processedBlob = await this.processImage(file);
        
        const formData = new FormData();
        formData.append('image', processedBlob, 'search-image.jpg');
        formData.append('maxResults', this.config.maxResults || 12);
        formData.append('shop', this.config.shop || window.Shopify?.shop || window.location.hostname);
        
        // Use configured proxy URL (should be handled by Shopify App Proxy)
        // For local testing without Shopify proxy, use direct route
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiUrl = this.config.proxyUrl ||
                      (isLocal ? '/apps/proxy/search-image' : '/apps/proxy/api/search-image');
        console.log('[Visual Search] Searching with URL:', apiUrl, 'isLocal:', isLocal);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Search failed');
        }
        
        // Display results
        this.displayResults(data.results || []);
        
      } catch (error) {
        console.error('[Visual Search] Search error:', error);
        
        // Determine error context
        const context = { source: 'api' };
        if (error.message && error.message.includes('fetch')) {
          context.source = 'network';
        }
        
        // Handle error with error handler
        if (this.errorHandler) {
          this.errorHandler.handleError(error, context, this);
        } else {
          this.showError(error.message || 'Search failed. Please try again.');
        }
      } finally {
        this.setLoading(false);
      }
    }

    async processImage(file) {
      // Initialize image processor if available
      if (typeof ImageProcessor !== 'undefined') {
        try {
          const processor = new ImageProcessor();
          
          // Check if processing is needed
          const needsProcessing = await processor.needsProcessing(file);
          if (!needsProcessing) {
            console.log('[Visual Search] Image already optimized, skipping processing');
            return file;
          }
          
          // Validate image first
          const validation = processor.validateImage(file);
          if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
          }
          
          // Show processing feedback
          this.showProcessingFeedback(true);
          
          // Process the image with performance measurement
          const processedBlob = await processor.measure(
            () => processor.processImage(file),
            'Image processing'
          );
          
          this.showProcessingFeedback(false);
          return processedBlob;
          
        } catch (error) {
          this.showProcessingFeedback(false);
          console.warn('[Visual Search] Image processing failed, using original:', error);
          
          // Handle error with error handler
          if (this.errorHandler) {
            this.errorHandler.handleError(error, { source: 'processing' }, this);
          }
          
          // Fallback to original file if processing fails
          return file;
        }
      } else {
        console.warn('[Visual Search] ImageProcessor module not loaded, using original file');
        return file;
      }
    }

    displayResults(results) {
      const resultsContainer = this.modal.querySelector('#modal-results');
      const resultsGrid = this.modal.querySelector('#modal-results-grid');
      const clearBtn = this.modal.querySelector('#modal-clear-results');
      
      if (results.length === 0) {
        this.showError('No similar products found. Try a different image.');
        return;
      }
      
      // Clear existing results
      resultsGrid.innerHTML = '';
      
      // Create result items
      results.forEach(result => {
        const item = document.createElement('a');
        item.className = 'visual-search-result-item';
        item.href = `/products/${result.handle}`;
        
        const imageUrl = result.image_url || '/assets/no-image.png';
        const price = result.price ? this.formatPrice(result.price) : '';
        const similarity = result.similarity ? Math.round(result.similarity * 100) : '';
        
        item.innerHTML = `
          <img class="visual-search-result-image" src="${imageUrl}" alt="${result.title}" loading="lazy">
          <div class="visual-search-result-info">
            <h4 class="visual-search-result-title">${result.title}</h4>
            ${price ? `<p class="visual-search-result-price">${price}</p>` : ''}
            ${similarity ? `<p class="visual-search-result-match">${similarity}% match</p>` : ''}
          </div>
        `;
        
        resultsGrid.appendChild(item);
      });
      
      // Show results
      resultsContainer.style.display = 'block';
      
      // Clear results handler
      clearBtn.addEventListener('click', () => {
        resultsGrid.innerHTML = '';
        resultsContainer.style.display = 'none';
      }, { once: true });
    }

    formatPrice(price) {
      const amount = parseFloat(price) / 100;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }

    openModal() {
      console.log('[Visual Search] openModal called');
    
      if (!this.modal) {
        console.error('[Visual Search] Modal not found! Creating it now...');
        this.createModal();
        if (!this.modal) {
          console.error('[Visual Search] Failed to create modal!');
          return;
        }
      }
    
      // Guarantee modal is at top of DOM
      this.forceModalToTop();
    
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    
      // Show modal
      this.modal.style.display = 'block';
    
      // Focus modal content
      const modalContent = this.modal.querySelector('.visual-search-modal-content');
      setTimeout(() => {
        if (modalContent) modalContent.focus();
      }, 100);
    
      console.log('[Visual Search] Modal opened and forced to top');
    }
    
    hideCompetingElements() {
      // Find and temporarily reduce z-index of competing elements
      const competingSelectors = [
        '.predictive-search',
        '.search-modal',
        '[class*="search-modal"]',
        '.header__search',
        '.modal',
        '[class*="overlay"]'
      ];
      
      this.hiddenElements = [];
      
      competingSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el !== this.modal && el.id !== this.modalId) {
            const computed = window.getComputedStyle(el);
            const zIndex = parseInt(computed.zIndex);
            
            if (!isNaN(zIndex) && zIndex > 1000) {
              // Store original z-index
              this.hiddenElements.push({
                element: el,
                originalZIndex: el.style.zIndex
              });
              
              // Temporarily lower z-index
              el.style.setProperty('z-index', '999', 'important');
            }
          }
        });
      });
    }
    
    restoreCompetingElements() {
      if (this.hiddenElements) {
        this.hiddenElements.forEach(item => {
          if (item.originalZIndex) {
            item.element.style.zIndex = item.originalZIndex;
          } else {
            item.element.style.removeProperty('z-index');
          }
        });
        this.hiddenElements = [];
      }
    }

    findHighestZIndex() {
      let highest = 0;
      const allElements = document.querySelectorAll('*');
      
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const zIndex = window.getComputedStyle(element).zIndex;
        const numericZIndex = parseInt(zIndex);
        
        if (!isNaN(numericZIndex) && numericZIndex > highest) {
          highest = numericZIndex;
        }
      }
      
      return highest;
    }

    // Force modal to be the last child of body and ensure it's on top
    forceModalToTop() {
      if (!this.modal) return;
    
      // Move to end of body
      if (this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      document.body.appendChild(this.modal);
    
      // Apply safe positioning + isolation
      this.modal.style.position = 'fixed';
      this.modal.style.top = '0';
      this.modal.style.left = '0';
      this.modal.style.width = '100%';
      this.modal.style.height = '100%';
      this.modal.style.zIndex = '2147483647';
      this.modal.style.isolation = 'isolate';
      this.modal.style.display = 'block';
    
      console.log('[Visual Search] Modal forced to top of DOM');
    }

    closeModal() {
      if (this.modal) {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Restore competing elements' z-indexes
        this.restoreCompetingElements();
        
        // Clear any errors
        this.hideError();
        
        // Clear any results
        const resultsContainer = this.modal.querySelector('#modal-results');
        if (resultsContainer) {
          resultsContainer.style.display = 'none';
        }
        
        // Reset upload state
        const uploadArea = this.modal.querySelector('#modal-upload-area');
        const preview = this.modal.querySelector('#modal-image-preview');
        const fileInput = this.modal.querySelector('#modal-image-input');
        const searchBtn = this.modal.querySelector('#modal-search-btn');
        
        if (uploadArea && preview && fileInput && searchBtn) {
          preview.style.display = 'none';
          uploadArea.querySelector('.visual-search-upload-placeholder').style.display = 'flex';
          fileInput.value = '';
          searchBtn.disabled = true;
        }
        
        // Reset camera state if available
        if (this.cameraCapture) {
          this.cameraCapture.reset();
        }
        
        // Re-enable based on current state
        const activeTab = this.modal.querySelector('.visual-search-tab.active').dataset.tab;
        searchBtn.disabled = !(
          (activeTab === 'upload' && this.modal.querySelector('#modal-image-preview').style.display !== 'none') ||
          (activeTab === 'camera' && this.cameraCapture && this.cameraCapture.hasActiveCapture())
        );
      }
    }

    setLoading(loading) {
      if (!this.modal) return;
      
      const searchBtn = this.modal.querySelector('#modal-search-btn');
      const submitText = this.modal.querySelector('.visual-search-submit-text');
      const spinner = this.modal.querySelector('.visual-search-loading-spinner');
      
      if (searchBtn) {
        searchBtn.disabled = loading;
        searchBtn.classList.toggle('loading', loading);
      }
      
      if (submitText && spinner) {
        submitText.style.display = loading ? 'none' : 'inline';
        spinner.style.display = loading ? 'inline-block' : 'none';
      }
    }

    showError(message) {
      if (!this.modal) return;
      
      const errorContainer = this.modal.querySelector('#modal-error');
      const errorText = this.modal.querySelector('.visual-search-error-text');
      
      if (errorContainer && errorText) {
        errorText.textContent = message;
        errorContainer.style.display = 'block';
      }
    }

    hideError() {
      if (!this.modal) return;
      
      const errorContainer = this.modal.querySelector('#modal-error');
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
    }

    showProcessingFeedback(show) {
      // This would show/hide processing feedback UI
      // Implementation depends on your UI design
      console.log('[Visual Search] Processing feedback:', show ? 'show' : 'hide');
    }

    observeDOM() {
      // Create a MutationObserver to watch for dynamic content changes
      const observer = new MutationObserver((mutations) => {
        let shouldRescan = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Check if any new search inputs were added
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if the added node is a search input or contains search inputs
                if (this.looksLikeSearchInput(node) || 
                    node.querySelector && node.querySelector('input[type="search"], input[type="text"]')) {
                  shouldRescan = true;
                }
                
                // Check for search overlays/modals being added
                if (node.classList && (
                    node.classList.contains('predictive-search') ||
                    node.classList.contains('search-modal') ||
                    node.className.includes('search')
                  )) {
                  shouldRescan = true;
                }
              }
            });
          }
          
          // Watch for visibility changes on existing search elements
          if (mutation.type === 'attributes') {
            const target = mutation.target;
            if (target.nodeType === Node.ELEMENT_NODE) {
              // Check if it's a search-related element that became visible
              if ((mutation.attributeName === 'style' || mutation.attributeName === 'class') &&
                  (target.className.includes('search') || target.closest('[class*="search"]'))) {
                shouldRescan = true;
              }
            }
          }
        });
        
        if (shouldRescan) {
          console.log('[Visual Search] DOM changes detected, rescanning for search inputs...');
          // Use a shorter delay to catch dynamic overlays faster
          setTimeout(() => {
            this.findSearchInputs();
            this.injectCameraIcons();
          }, 50);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    setupPredictiveSearchHandling() {
      // Special handling for predictive search modals that might appear/disappear
      const predictiveSearchSelectors = [
        '.predictive-search',
        '.search-modal',
        '[class*="search-modal"]',
        '[class*="search"]'
      ];
      
      // Watch for clicks on search inputs that might trigger overlays
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (target && target.tagName === 'INPUT' && 
            (target.type === 'search' || target.type === 'text') &&
            this.looksLikeSearchInput(target)) {
          console.log('[Visual Search] Search input clicked, scheduling rescan...');
          // Give the overlay time to appear
          setTimeout(() => {
            this.findSearchInputs();
            this.injectCameraIcons();
          }, 100);
        }
      });
      
      // Watch for focus events on search inputs
      document.addEventListener('focus', (e) => {
        const target = e.target;
        if (target && target.tagName === 'INPUT' && 
            (target.type === 'search' || target.type === 'text') &&
            this.looksLikeSearchInput(target)) {
          console.log('[Visual Search] Search input focused, scheduling rescan...');
          setTimeout(() => {
            this.findSearchInputs();
            this.injectCameraIcons();
          }, 150);
        }
      }, true); // Use capture phase to catch early
      
      predictiveSearchSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Watch for visibility changes
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && 
                  (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                // Re-scan for search inputs when predictive search becomes visible
                setTimeout(() => {
                  this.findSearchInputs();
                  this.injectCameraIcons();
                }, 50);
              }
            });
          });
          
          observer.observe(element, {
            attributes: true,
            attributeFilter: ['style', 'class']
          });
        });
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.visualSearchIntegration = new VisualSearchIntegration();
    });
  } else {
    window.visualSearchIntegration = new VisualSearchIntegration();
  }

})();