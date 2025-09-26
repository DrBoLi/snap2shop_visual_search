/**
 * Analytics Tracker for Visual Search Widget
 * Handles both direct API calls and window.analytics.track integration
 */

class AnalyticsTracker {
  constructor(shop) {
    this.shop = shop;
    this.sessionId = this.getOrCreateSessionId();
    this.baseUrl = '/apps/proxy';
  }

  /**
   * Get or create a session ID for tracking user journey
   */
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('visual_search_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visual_search_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Track a generic analytics event
   */
  async track(eventType, data) {
    const payload = {
      eventType,
      data: {
        ...data,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        shop: this.shop
      }
    };

    // Method 1: Direct API call (primary)
    try {
      const response = await fetch(`${this.baseUrl}/analytics/track`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('Analytics tracking failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    // Method 2: Window analytics (backup/future integration)
    if (window.analytics && window.analytics.track) {
      try {
        window.analytics.track('Visual Search', {
          eventType,
          ...data,
          sessionId: this.sessionId,
          shop: this.shop
        });
      } catch (error) {
        console.warn('Window analytics tracking failed:', error);
      }
    }
  }

  /**
   * Track a search event
   */
  async trackSearch(queryData, results) {
    const searchId = this.generateSearchId();
    
    // Track the search event
    await this.track('image_search', {
      searchId,
      queryData: {
        ...queryData,
        resultCount: results?.length || 0
      },
      results: results ? results.map(r => ({
        productId: r.id,
        similarity: r.similarity,
        position: results.indexOf(r) + 1
      })) : null
    });

    return searchId;
  }

  /**
   * Track a click on a search result
   */
  async trackClick(searchId, productId, position, similarity, clickType = 'search_result') {
    await this.track('search_result_click', {
      searchId,
      productId,
      position,
      similarity,
      clickType
    });
  }

  /**
   * Track a recommendation click
   */
  async trackRecommendationClick(productId, recommendationType = 'product') {
    await this.track('recommendation_click', {
      productId,
      recommendationType,
      clickType: 'recommendation'
    });
  }

  /**
   * Track a keyword suggestion click
   */
  async trackKeywordClick(keyword) {
    await this.track('keyword_click', {
      keyword,
      clickType: 'keyword'
    });
  }

  /**
   * Track a collection click
   */
  async trackCollectionClick(collectionId, collectionName) {
    await this.track('collection_click', {
      collectionId,
      collectionName,
      clickType: 'collection'
    });
  }

  /**
   * Track widget interaction events
   */
  async trackWidgetInteraction(interactionType, data = {}) {
    await this.track('widget_interaction', {
      interactionType,
      ...data
    });
  }

  /**
   * Track error events
   */
  async trackError(errorType, errorMessage, context = {}) {
    await this.track('error', {
      errorType,
      errorMessage,
      context
    });
  }

  /**
   * Generate unique search ID
   */
  generateSearchId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device information for analytics
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  /**
   * Track page view (for context)
   */
  async trackPageView() {
    await this.track('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      deviceInfo: this.getDeviceInfo()
    });
  }
}

// Export for use in other scripts
window.AnalyticsTracker = AnalyticsTracker;

