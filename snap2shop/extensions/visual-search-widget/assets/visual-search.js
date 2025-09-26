/**
 * Visual Search Widget JavaScript
 * Handles image upload, search requests, and results display
 */

window.initVisualSearchWidget = function(blockId, config) {
  const uploadArea = document.getElementById(`upload-area-${blockId}`);
  const imageInput = document.getElementById(`image-input-${blockId}`);
  const imagePreview = document.getElementById(`image-preview-${blockId}`);
  const previewImage = document.getElementById(`preview-image-${blockId}`);
  const removeImage = document.getElementById(`remove-image-${blockId}`);
  const searchButton = document.getElementById(`search-button-${blockId}`);
  const searchResults = document.getElementById(`search-results-${blockId}`);
  const resultsGrid = document.getElementById(`results-grid-${blockId}`);
  const clearResults = document.getElementById(`clear-results-${blockId}`);
  const errorMessage = document.getElementById(`error-message-${blockId}`);

  let selectedFile = null;
  let analyticsTracker = null;
  let currentSearchId = null;

  // Initialize analytics tracker
  if (window.AnalyticsTracker) {
    const shop = window.Shopify?.shop || window.location.hostname;
    analyticsTracker = new window.AnalyticsTracker(shop);
  }

  // File upload handling
  uploadArea.addEventListener('click', () => {
    if (!imagePreview.style.display || imagePreview.style.display === 'none') {
      imageInput.click();
      // Track upload area click
      if (analyticsTracker) {
        analyticsTracker.trackWidgetInteraction('upload_area_clicked');
      }
    }
  });

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

  imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  removeImage.addEventListener('click', (e) => {
    e.stopPropagation();
    clearSelectedImage();
  });

  searchButton.addEventListener('click', handleSearch);
  clearResults.addEventListener('click', clearSearchResults);

  function handleFileSelect(file) {
    // Track file selection
    if (analyticsTracker) {
      analyticsTracker.trackWidgetInteraction('file_selected', {
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name
      });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    // Validate file size
    if (file.size > config.maxFileSize) {
      const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
      showError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    selectedFile = file;
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      uploadArea.querySelector('.upload-placeholder').style.display = 'none';
      imagePreview.style.display = 'block';
      searchButton.disabled = false;
      hideError();
    };
    reader.readAsDataURL(file);
  }

  function clearSelectedImage() {
    selectedFile = null;
    imagePreview.style.display = 'none';
    uploadArea.querySelector('.upload-placeholder').style.display = 'flex';
    searchButton.disabled = true;
    imageInput.value = '';
    clearSearchResults();
  }

  async function handleSearch() {
    if (!selectedFile) return;

    setLoading(true);
    hideError();
    
    // Track search initiation
    if (analyticsTracker) {
      analyticsTracker.trackWidgetInteraction('search_initiated', {
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });
    }
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('maxResults', config.maxResults);
      
      // Add shop domain from current URL or Shopify global
      // For development, use the known shop domain
      const detectedShop = window.Shopify?.shop || window.location.hostname;
      const shopDomain = detectedShop.includes('quickstart') ? 'snap2shopdemo.myshopify.com' : detectedShop;
      
      // Debug shop domain detection
      console.log('Detected shop domain:', shopDomain);
      console.log('Window location:', window.location.href);
      console.log('Shopify object:', window.Shopify);
      formData.append('shop', shopDomain);

      console.log('Making request to:', '/apps/proxy/api/search-image');
      console.log('Shop domain:', shopDomain);
      console.log('Max results:', config.maxResults);

      let response;
      try {
        // Use relative URL for app proxy - FIXED: Added leading slash
        const apiUrl = '/apps/proxy/api/search-image';
        console.log('Using relative API URL:', apiUrl);
        
        response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        console.log('Response received:', response.status, response.statusText);

        // Read response body once
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }

        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status} ${response.statusText}`);
        }

        console.log('Search results received:', data);
        console.log('Number of results:', data.results?.length || 0);
        
        // Capture searchId from API response for click tracking
        if (data.searchId) {
          currentSearchId = data.searchId;
          console.log('✅ Search ID captured for click tracking:', currentSearchId);
        }
        
        displayResults(data.results || []);
        
      } catch (parseError) {
        console.error('Search error:', parseError);
        console.error('Response status:', response?.status);
        console.error('Response headers:', response?.headers ? Object.fromEntries(response.headers.entries()) : 'N/A');
        
        let errorDetails = parseError.message;
        
        throw new Error(errorDetails);
      }
      
    } catch (error) {
      console.error('Final error handler:', error);
      
      // Track search error
      if (analyticsTracker) {
        analyticsTracker.trackError('search_failed', error.message, {
          fileSize: selectedFile?.size,
          fileType: selectedFile?.type
        });
      }
      
      showError(error.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function displayResults(results) {
    if (results.length === 0) {
      showError('No similar products found. Try a different image.');
      return;
    }

    resultsGrid.innerHTML = '';
    
    results.forEach((result, index) => {
      const resultElement = createResultElement(result, index + 1);
      resultsGrid.appendChild(resultElement);
    });

    searchResults.style.display = 'block';
  }

  function createResultElement(result, position) {
    const resultItem = document.createElement('a');
    resultItem.className = 'result-item';
    resultItem.href = `/products/${result.handle}`;
    
    const imageUrl = result.image_url || result.featured_image || '/assets/no-image.png';
    const price = result.price ? formatPrice(result.price) : '';
    const similarity = result.similarity ? Math.round(result.similarity * 100) : '';

    resultItem.innerHTML = `
      <img class="result-image" src="${imageUrl}" alt="${result.title}" loading="lazy">
      <div class="result-content">
        <h5 class="result-title">${result.title}</h5>
        ${price ? `<p class="result-price">${price}</p>` : ''}
        ${similarity ? `<p class="similarity-score">${similarity}% match</p>` : ''}
      </div>
    `;

    // Add click tracking (don't prevent default navigation)
    resultItem.addEventListener('click', async (e) => {
      try {
        const shop = window.Shopify?.shop || window.location.hostname;
        const response = await fetch('/apps/proxy/analytics/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop,
            searchId: currentSearchId,
            productId: result.id,
            position: position,
            similarity: result.similarity,
            clickType: 'search_result'
          })
        });
        
        if (response.ok) {
          console.log('✅ Click tracked successfully');
        } else {
          console.warn('⚠️ Click tracking failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Click tracking error:', error);
      }
      // Don't prevent default - let the link navigate normally
    });

    return resultItem;
  }

  function formatPrice(price) {
    // Assume price is in cents, convert to currency format
    const amount = parseFloat(price) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function clearSearchResults() {
    resultsGrid.innerHTML = '';
    searchResults.style.display = 'none';
  }

  function setLoading(loading) {
    searchButton.classList.toggle('loading', loading);
    searchButton.disabled = loading || !selectedFile;
  }

  function showError(message) {
    errorMessage.querySelector('.error-text').textContent = message;
    errorMessage.style.display = 'block';
    clearSearchResults();
  }

  function hideError() {
    errorMessage.style.display = 'none';
  }

  // Initialize
  hideError();
  clearSearchResults();
};

// Auto-load script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadVisualSearchScript);
} else {
  loadVisualSearchScript();
}

function loadVisualSearchScript() {
  // The widget will be initialized by the Liquid template
  console.log('Visual Search Widget script loaded');
}