# Analytics Implementation Guide

This document outlines the comprehensive analytics system implemented for the Visual Search Shopify app.

## Overview

The analytics system provides detailed tracking of user interactions, search performance, and business metrics while maintaining data privacy and compliance with GDPR regulations.

## Architecture

### Database Models

- **VisualSearchEvent**: Tracks search events with metadata
- **SearchResultClick**: Tracks clicks on search results
- **PopularContent**: Tracks popular keywords, products, and collections
- **AnalyticsAggregation**: Pre-aggregated data for dashboard performance

### Services

- **AnalyticsAggregationService**: Handles data aggregation and dashboard queries
- **DataPrivacyService**: Manages data anonymization and retention policies

### API Endpoints

- `/apps/proxy/analytics/track` - Generic event tracking
- `/apps/proxy/analytics/search` - Search event tracking
- `/apps/proxy/analytics/click` - Click event tracking
- `/api/analytics-dashboard` - Dashboard data API

## Features Implemented

### 1. Event Tracking

#### Search Events
- Image search initiation
- Search parameters (file size, type, result count)
- Search results with similarity scores
- Error tracking for failed searches

#### Click Events
- Search result clicks with position tracking
- Recommendation clicks
- Keyword suggestion clicks
- Collection clicks

#### Widget Interactions
- Upload area clicks
- File selection events
- Error events with context

### 2. Analytics Dashboard

#### Primary Metrics
- **Image Search Volume**: Total searches with daily trends
- **Search Results Clicks**: Clicks on search results
- **Product Recommendation Clicks**: Clicks on recommended products

#### Integrated Search Metrics
- **Popular Keywords Clicks**: Clicks on keyword suggestions
- **Popular Collections Clicks**: Clicks on collection suggestions
- **Popular Products Clicks**: Clicks on featured products

#### Dashboard Features
- Timeframe selection (7 days, 1 month, 3 months)
- Real-time data updates
- Chart placeholders for future visualization
- Responsive design

### 3. Data Privacy & Compliance

#### Data Anonymization
- Automatic anonymization of old data (24 months retention)
- Removal of PII (IP addresses, user agents, session IDs)
- Query data sanitization

#### GDPR Compliance
- User data export functionality
- User data deletion on request
- Data retention policies
- Privacy-first design

#### Rate Limiting
- 100 requests per minute per shop per event type
- Graceful degradation on rate limit exceeded
- Error tracking for rate limit violations

### 4. Performance Optimization

#### Pre-aggregation
- Daily aggregation of metrics
- Cached dashboard data
- Efficient database queries with proper indexing

#### Hybrid Tracking
- Primary: Direct API calls to own database
- Secondary: Window.analytics.track for external integration
- Fallback mechanisms for reliability

## Usage

### Frontend Integration

```javascript
// Initialize analytics tracker
const analyticsTracker = new AnalyticsTracker(shop);

// Track search event
await analyticsTracker.trackSearch(queryData, results);

// Track click event
await analyticsTracker.trackClick(searchId, productId, position, similarity);

// Track recommendation click
await analyticsTracker.trackRecommendationClick(productId, 'product');
```

### Backend API Usage

```javascript
// Track generic event
POST /apps/proxy/analytics/track
{
  "eventType": "image_search",
  "data": { "fileSize": 1024000, "fileType": "image/jpeg" },
  "sessionId": "session_123",
  "shop": "shop.myshopify.com"
}

// Track search event
POST /apps/proxy/analytics/search
{
  "shop": "shop.myshopify.com",
  "queryData": { "maxResults": 12, "fileSize": 1024000 },
  "results": [{ "id": "product_123", "similarity": 0.95 }],
  "sessionId": "session_123"
}

// Track click event
POST /apps/proxy/analytics/click
{
  "shop": "shop.myshopify.com",
  "searchId": "search_123",
  "productId": "product_123",
  "position": 1,
  "similarity": 0.95,
  "clickType": "search_result",
  "sessionId": "session_123"
}
```

### Dashboard Data API

```javascript
// Get dashboard data
GET /api/analytics-dashboard?timeframe=last_month

// Response
{
  "imageSearchVolume": {
    "total": 1250,
    "chart": [
      { "date": "2025-08-21", "value": 45 },
      { "date": "2025-08-22", "value": 52 }
    ]
  },
  "searchResultsClicks": {
    "total": 340,
    "chart": [...]
  }
  // ... other metrics
}
```

## Maintenance

### Data Cleanup

Run the cleanup script periodically to maintain data privacy:

```bash
node scripts/cleanup-analytics.js
```

### Testing

Test the analytics system with sample data:

```bash
node scripts/test-analytics.js
```

### Monitoring

Monitor analytics performance through:
- Database query performance
- API response times
- Error rates in tracking
- Data retention compliance

## Configuration

### Environment Variables

```env
# Optional: Segment integration
SEGMENT_WRITE_KEY=your_segment_key

# Database connection
DATABASE_URL=postgresql://...

# Analytics settings
ANALYTICS_RETENTION_MONTHS=24
ANALYTICS_RATE_LIMIT_PER_MINUTE=100
```

### Rate Limiting Configuration

Modify rate limits in `analyticsAggregation.server.js`:

```javascript
const maxRequests = 100; // requests per minute
const windowMs = 60000; // 1 minute window
```

### Data Retention Configuration

Modify retention periods in `dataPrivacy.server.js`:

```javascript
this.retentionPeriods = {
  searchEvents: 24, // months
  clickEvents: 24, // months
  popularContent: 12, // months
  aggregations: 36, // months
};
```

## Future Enhancements

### Planned Features
1. **Real-time Charts**: Replace chart placeholders with interactive visualizations
2. **Advanced Filtering**: Filter analytics by device, location, time of day
3. **A/B Testing**: Track performance of different search configurations
4. **Export Functionality**: CSV/PDF export of analytics data
5. **Alerting**: Notifications for unusual patterns or errors
6. **Segment Integration**: Full integration with Segment analytics platform

### Performance Improvements
1. **Caching**: Redis caching for frequently accessed data
2. **Background Jobs**: Queue-based processing for heavy aggregations
3. **CDN Integration**: Edge caching for global performance
4. **Database Optimization**: Partitioning and archiving strategies

## Security Considerations

1. **Data Encryption**: All sensitive data encrypted at rest
2. **Access Control**: Shop-scoped data access only
3. **Input Validation**: Sanitization of all user inputs
4. **Rate Limiting**: Protection against abuse
5. **Privacy Compliance**: GDPR and CCPA compliance built-in

## Troubleshooting

### Common Issues

1. **Analytics not tracking**: Check browser console for errors, verify API endpoints
2. **Dashboard showing zeros**: Ensure data aggregation is running, check database
3. **Rate limiting errors**: Reduce tracking frequency or increase limits
4. **Performance issues**: Check database indexes, consider pre-aggregation

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed analytics logs.

## Support

For issues or questions about the analytics implementation, check:
1. Database logs for tracking errors
2. Browser console for frontend issues
3. API response codes for endpoint problems
4. Data privacy service logs for compliance issues


