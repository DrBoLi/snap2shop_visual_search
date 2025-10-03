/**
 * Visual Search Widget JavaScript
 * Handles image upload, search requests, and results display
 */

const VisualSearchEnv = (function initVisualSearchEnv(existing) {
  if (existing) {
    return existing;
  }

  const DEV_HOST_PATTERNS = [
    /^localhost$/i,
    /^127\./,
    /^0\.0\.0\.0$/,
    /\.ngrok\.io$/i,
    /\.ngrok-free\.app$/i,
    /\.trycloudflare\.com$/i,
    /\.loca\.lt$/i,
    /\.dev\.local$/i,
    /\.test$/i
  ];

  const normalise = (value) => (typeof value === 'string' ? value.toLowerCase() : '');

  const isDevelopmentHost = (host = window.location.hostname || '') => {
    return DEV_HOST_PATTERNS.some((pattern) => pattern.test(host));
  };

  const detectEnvironment = (config = {}) => {
    const forced = normalise(config.environment || config.env || config.mode);
    if (forced) {
      return forced;
    }

    const host = normalise(window.location.hostname || '');
    if (!host) {
      return 'production';
    }

    return isDevelopmentHost(host) ? 'development' : 'production';
  };

  const defaultEndpoints = {
    searchImage: {
      development: '/apps/proxy/search-image',
      production: '/apps/proxy/api/search-image'
    },
    analyticsClick: {
      development: '/apps/proxy/analytics/click',
      production: '/apps/proxy/analytics/click'
    },
    analyticsTrack: {
      development: '/apps/proxy/analytics/track',
      production: '/apps/proxy/analytics/track'
    },
    analyticsBase: {
      development: '/apps/proxy',
      production: '/apps/proxy'
    }
  };

  const detectShopDomain = (config = {}, fallback) => {
    const candidates = [
      config.shop,
      config.shopDomain,
      config.shopifyShopDomain,
      window.visualSearchConfig?.shop,
      window.visualSearchConfig?.shopDomain,
      window.Shopify?.shop,
      window.Shopify?.config?.shopDomain,
      document.querySelector('meta[name="shopify-shop-domain"]')?.getAttribute('content'),
      document.documentElement?.getAttribute('data-shopify-shop-domain'),
      fallback,
      window.location.hostname
    ];

    return candidates.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || '';
  };

  const resolveEndpoint = (config = {}, key, fallback) => {
    if (!key) {
      return fallback || '';
    }

    const endpoints = config.endpoints || {};
    if (typeof endpoints[key] === 'string' && endpoints[key].trim().length > 0) {
      return endpoints[key];
    }

    const directOverride = config[`${key}Url`] || config[key];
    if (typeof directOverride === 'string' && directOverride.trim().length > 0) {
      return directOverride;
    }

    if (key === 'searchImage') {
      if (typeof config.proxyUrl === 'string' && config.proxyUrl.trim().length > 0) {
        return config.proxyUrl;
      }

      if (typeof config.devProxyUrl === 'string' && config.devProxyUrl.trim().length > 0) {
        const env = detectEnvironment(config);
        if (env === 'development') {
          return config.devProxyUrl;
        }
      }
    }

    const env = detectEnvironment(config);
    const table = defaultEndpoints[key] || {};
    const envKey = env === 'development' ? 'development' : 'production';

    return table[envKey] || fallback || table.production || fallback || '';
  };

  const getInfo = (config = {}) => {
    const environment = detectEnvironment(config);
    return {
      environment,
      isDevelopment: environment === 'development',
      hostname: window.location.hostname,
      shopDomain: detectShopDomain(config),
      endpoints: {
        searchImage: resolveEndpoint(config, 'searchImage'),
        analyticsClick: resolveEndpoint(config, 'analyticsClick'),
        analyticsTrack: resolveEndpoint(config, 'analyticsTrack'),
        analyticsBase: resolveEndpoint(config, 'analyticsBase')
      }
    };
  };

  const helpers = {
    detectEnvironment,
    resolveEndpoint,
    detectShopDomain,
    getInfo,
    isDevelopmentHost
  };

  window.VisualSearchEnv = helpers;
  return helpers;
})(window.VisualSearchEnv);

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
  const environmentInfo = VisualSearchEnv.getInfo(config || {});
  const detectedShopDomain = environmentInfo.shopDomain || VisualSearchEnv.detectShopDomain(config);
  const debugEnabled = Boolean((config && config.debug) || environmentInfo.isDevelopment);
  const debug = (...args) => {
    if (debugEnabled) {
      console.debug(...args);
    }
  };

  debug('Visual Search Widget environment:', environmentInfo.environment, {
    environmentInfo,
    shopDomain: detectedShopDomain
  });

  // Initialize analytics tracker
  if (window.AnalyticsTracker) {
    analyticsTracker = new window.AnalyticsTracker(detectedShopDomain, config || {});
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
      const detectedShop = detectedShopDomain || window.location.hostname;
      const shopDomain = detectedShop.includes('quickstart') ? 'snap2shopdemo.myshopify.com' : detectedShop;
      
      // Debug shop domain detection
      debug('Detected shop domain:', shopDomain);
      debug('Window location:', window.location.href);
      debug('Shopify object:', window.Shopify);
      formData.append('shop', shopDomain);

      let response;
      try {
        const apiUrl = VisualSearchEnv.resolveEndpoint(config, 'searchImage');
        if (!apiUrl) {
          throw new Error('Search endpoint is not configured for this environment.');
        }

        debug('Visual Search request:', {
          apiUrl,
          environment: environmentInfo.environment,
          shopDomain,
          maxResults: config.maxResults
        });

        response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        debug('Response received:', response.status, response.statusText);

        // Read response body once
        const responseText = await response.text();
        debug('Response body:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }

        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status} ${response.statusText}`);
        }

        debug('Search results received:', data);
        debug('Number of results:', data.results?.length || 0);
        
        // Capture searchId from API response for click tracking
        if (data.searchId) {
          currentSearchId = data.searchId;
          debug('Search ID captured for click tracking:', currentSearchId);
        }
        
        displayResults(data.results || []);

        if (analyticsTracker) {
          try {
            const queryData = {
              source: 'search_bar_widget',
              imageType: selectedFile?.type,
              imageSize: selectedFile?.size,
              resultsCount: data.results?.length || 0,
              environment: environmentInfo.environment
            };
            const trackedSearchId = await analyticsTracker.trackSearch(queryData, data.results || []);
            if (trackedSearchId) {
              currentSearchId = trackedSearchId;
              debug('Analytics search tracked with ID:', currentSearchId);
            }
          } catch (analyticsError) {
            console.warn('Failed to track analytics search event:', analyticsError);
          }
        }

      } catch (parseError) {
        console.error('Search error:', parseError);
        if (debugEnabled) {
          console.error('Response status:', response?.status);
          console.error('Response headers:', response?.headers ? Object.fromEntries(response.headers.entries()) : 'N/A');
        }
        
        let errorDetails = parseError.message;
        
        throw new Error(errorDetails);
      }
      
    } catch (error) {
      console.error('Search handling failed:', error);
      
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
        const shop = detectedShopDomain || VisualSearchEnv.detectShopDomain(config);
        const analyticsEndpoint = VisualSearchEnv.resolveEndpoint(config, 'analyticsClick');
        if (!analyticsEndpoint) {
          console.warn('Analytics endpoint not configured; click will not be tracked.');
          return;
        }

        const response = await fetch(analyticsEndpoint, {
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
          debug('Click tracked successfully');
        } else {
          console.warn('Click tracking failed:', response.status);
        }
      } catch (error) {
        console.error('Click tracking error:', error);
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
}
