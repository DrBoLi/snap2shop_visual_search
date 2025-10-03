/**
 * Analytics Aggregation Service
 * Handles pre-aggregation of analytics data for dashboard performance
 */

import db from "../db.server.js";
import logger from "../utils/logger.js";

class AnalyticsAggregationService {
  constructor() {
    this.rateLimiter = new Map();
  }

  /**
   * Parse timeframe string into start and end dates
   */
  parseTimeframe(timeframe) {
    const now = new Date();
    let startDate, endDate;

    switch (timeframe) {
      case 'last_7_days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(now);
        break;
      case 'last_month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date(now);
        break;
      case 'last_3_months':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        endDate = new Date(now);
        break;
      default:
        // Default to last month
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date(now);
    }

    // Set to start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * Aggregate daily analytics data for a specific shop and date
   */
  async aggregateDaily(shop, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Aggregate search events by type
      const searchStats = await db.visualSearchEvent.groupBy({
        by: ['eventType'],
        where: {
          shop,
          createdAt: { gte: startOfDay, lte: endOfDay }
        },
        _count: { id: true }
      });

      // Aggregate click events by type
      const clickStats = await db.searchResultClick.groupBy({
        by: ['clickType'],
        where: {
          shop,
          createdAt: { gte: startOfDay, lte: endOfDay }
        },
        _count: { id: true }
      });

      // Get total counts
      const totalSearches = searchStats.reduce((sum, stat) => sum + stat._count.id, 0);
      const totalClicks = clickStats.reduce((sum, stat) => sum + stat._count.id, 0);

      // Store aggregated data
      await this.storeAggregation(shop, date, 'daily', {
        searches: totalSearches,
        clicks: totalClicks,
        searchByType: searchStats,
        clicksByType: clickStats
      });

      return {
        searches: totalSearches,
        clicks: totalClicks,
        searchByType: searchStats,
        clicksByType: clickStats
      };
    } catch (error) {
      logger.error('Error aggregating daily analytics:', error);
      throw error;
    }
  }

  /**
   * Store aggregated data in the database
   */
  async storeAggregation(shop, date, period, data) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Store search metrics
    await db.analyticsAggregation.upsert({
      where: {
        shop_date_period_metric: {
          shop,
          date: dateOnly,
          period,
          metric: 'searches'
        }
      },
      update: {
        value: data.searches,
        metadata: { searchByType: data.searchByType },
        updatedAt: new Date()
      },
      create: {
        shop,
        date: dateOnly,
        period,
        metric: 'searches',
        value: data.searches,
        metadata: { searchByType: data.searchByType }
      }
    });

    // Store click metrics
    await db.analyticsAggregation.upsert({
      where: {
        shop_date_period_metric: {
          shop,
          date: dateOnly,
          period,
          metric: 'clicks'
        }
      },
      update: {
        value: data.clicks,
        metadata: { clicksByType: data.clicksByType },
        updatedAt: new Date()
      },
      create: {
        shop,
        date: dateOnly,
        period,
        metric: 'clicks',
        value: data.clicks,
        metadata: { clicksByType: data.clicksByType }
      }
    });
  }

  /**
   * Get dashboard data for a specific timeframe
   */
  async getDashboardData(shop, timeframe) {
    const { startDate, endDate } = this.parseTimeframe(timeframe);

    try {
      // Get pre-aggregated data for performance
      const aggregations = await db.analyticsAggregation.findMany({
        where: {
          shop,
          date: { gte: startDate, lte: endDate },
          period: 'daily'
        },
        orderBy: { date: 'asc' }
      });

      // Transform into dashboard format
      const chartData = this.transformForDashboard(aggregations, startDate, endDate);
      
      // Get additional metrics not in aggregations
      const additionalMetrics = await this.getAdditionalMetrics(shop, startDate, endDate);

      return {
        ...chartData,
        ...additionalMetrics
      };
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Transform aggregated data into chart-ready format
   */
  transformForDashboard(aggregations, startDate, endDate) {
    const chartData = {
      imageSearchVolume: {
        total: 0,
        chart: []
      },
      searchResultsClicks: {
        total: 0,
        chart: []
      },
      productRecommendationClicks: {
        total: 0,
        chart: []
      },
      popularKeywordsClicks: {
        total: 0,
        chart: []
      },
      popularCollectionsClicks: {
        total: 0,
        chart: []
      },
      popularProductsClicks: {
        total: 0,
        chart: []
      }
    };

    // Group by date
    const dataByDate = {};
    aggregations.forEach(agg => {
      const dateKey = agg.date.toISOString().split('T')[0];
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { searches: 0, clicks: 0 };
      }
      
      if (agg.metric === 'searches') {
        dataByDate[dateKey].searches = agg.value;
        chartData.imageSearchVolume.total += agg.value;
      } else if (agg.metric === 'clicks') {
        dataByDate[dateKey].clicks = agg.value;
        chartData.searchResultsClicks.total += agg.value;
      }
    });

    // Generate chart data for all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayData = dataByDate[dateKey] || { searches: 0, clicks: 0 };
      
      chartData.imageSearchVolume.chart.push({
        date: dateKey,
        value: dayData.searches
      });
      
      chartData.searchResultsClicks.chart.push({
        date: dateKey,
        value: dayData.clicks
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return chartData;
  }

  /**
   * Get additional metrics not covered by aggregations
   */
  async getAdditionalMetrics(shop, startDate, endDate) {
    try {
      // Get popular content metrics
      const popularContent = await db.popularContent.findMany({
        where: {
          shop,
          lastUsed: { gte: startDate, lte: endDate }
        },
        orderBy: { clickCount: 'desc' },
        take: 10
      });

      // Calculate totals for different content types
      const contentTotals = popularContent.reduce((acc, content) => {
        if (!acc[content.contentType]) {
          acc[content.contentType] = 0;
        }
        acc[content.contentType] += content.clickCount;
        return acc;
      }, {});

      return {
        popularKeywordsClicks: {
          total: contentTotals.keyword || 0,
          chart: [] // Could be populated with daily data if needed
        },
        popularCollectionsClicks: {
          total: contentTotals.collection || 0,
          chart: []
        },
        popularProductsClicks: {
          total: contentTotals.product || 0,
          chart: []
        }
      };
    } catch (error) {
      logger.error('Error getting additional metrics:', error);
      return {
        popularKeywordsClicks: { total: 0, chart: [] },
        popularCollectionsClicks: { total: 0, chart: [] },
        popularProductsClicks: { total: 0, chart: [] }
      };
    }
  }

  /**
   * Check rate limit for analytics tracking
   */
  checkRateLimit(shop, eventType) {
    const key = `${shop}-${eventType}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    const limit = this.rateLimiter.get(key);
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return true;
    }

    return limit.count++ < maxRequests;
  }

  /**
   * Anonymize old data for privacy compliance
   */
  async anonymizeOldData() {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 24); // 2 years retention

    try {
      await db.visualSearchEvent.updateMany({
        where: {
          createdAt: { lt: cutoffDate }
        },
        data: {
          ipAddress: null,
          userAgent: null,
          sessionId: null
        }
      });

      logger.info('Anonymized old analytics data');
    } catch (error) {
      logger.error('Error anonymizing old data:', error);
    }
  }

  /**
   * Generate unique search ID
   */
  generateSearchId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address from request
   */
  getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }
}

export default new AnalyticsAggregationService();
