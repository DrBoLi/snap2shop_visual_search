/**
 * Data Privacy Service
 * Handles data anonymization, retention policies, and GDPR compliance
 */

import db from "../db.server.js";
import logger from "../utils/logger.js";

class DataPrivacyService {
  constructor() {
    this.retentionPeriods = {
      searchEvents: 24, // months
      clickEvents: 24, // months
      popularContent: 12, // months
      aggregations: 36, // months
    };
  }

  /**
   * Anonymize old analytics data for privacy compliance
   */
  async anonymizeOldData() {
    const results = {
      searchEvents: 0,
      clickEvents: 0,
      popularContent: 0,
      errors: []
    };

    try {
      // Anonymize search events older than retention period
      const searchCutoff = new Date();
      searchCutoff.setMonth(searchCutoff.getMonth() - this.retentionPeriods.searchEvents);

      const searchResult = await db.visualSearchEvent.updateMany({
        where: {
          createdAt: { lt: searchCutoff }
        },
        data: {
          ipAddress: null,
          userAgent: null,
          sessionId: null,
          queryData: null // Remove potentially sensitive query data
        }
      });

      results.searchEvents = searchResult.count;

      // Anonymize click events older than retention period
      const clickCutoff = new Date();
      clickCutoff.setMonth(clickCutoff.getMonth() - this.retentionPeriods.clickEvents);

      const clickResult = await db.searchResultClick.updateMany({
        where: {
          createdAt: { lt: clickCutoff }
        },
        data: {
          sessionId: null
        }
      });

      results.clickEvents = clickResult.count;

      // Remove old popular content data
      const contentCutoff = new Date();
      contentCutoff.setMonth(contentCutoff.getMonth() - this.retentionPeriods.popularContent);

      const contentResult = await db.popularContent.deleteMany({
        where: {
          lastUsed: { lt: contentCutoff }
        }
      });

      results.popularContent = contentResult.count;

      logger.info('Data anonymization completed:', results);
      return results;

    } catch (error) {
      logger.error('Error during data anonymization:', error);
      results.errors.push(error.message);
      return results;
    }
  }

  /**
   * Delete old aggregated data
   */
  async cleanupOldAggregations() {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - this.retentionPeriods.aggregations);

      const result = await db.analyticsAggregation.deleteMany({
        where: {
          createdAt: { lt: cutoff }
        }
      });

      logger.info(`Deleted ${result.count} old aggregation records`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old aggregations:', error);
      throw error;
    }
  }

  /**
   * Get data retention summary for a shop
   */
  async getDataRetentionSummary(shop) {
    try {
      const now = new Date();
      const searchCutoff = new Date(now);
      searchCutoff.setMonth(searchCutoff.getMonth() - this.retentionPeriods.searchEvents);

      const clickCutoff = new Date(now);
      clickCutoff.setMonth(clickCutoff.getMonth() - this.retentionPeriods.clickEvents);

      const [searchCount, clickCount, totalSearchCount, totalClickCount] = await Promise.all([
        db.visualSearchEvent.count({
          where: {
            shop,
            createdAt: { gte: searchCutoff }
          }
        }),
        db.searchResultClick.count({
          where: {
            shop,
            createdAt: { gte: clickCutoff }
          }
        }),
        db.visualSearchEvent.count({
          where: { shop }
        }),
        db.searchResultClick.count({
          where: { shop }
        })
      ]);

      return {
        shop,
        retentionPeriods: this.retentionPeriods,
        currentData: {
          searchEvents: searchCount,
          clickEvents: clickCount
        },
        totalData: {
          searchEvents: totalSearchCount,
          clickEvents: totalClickCount
        },
        anonymizedData: {
          searchEvents: totalSearchCount - searchCount,
          clickEvents: totalClickCount - clickCount
        }
      };
    } catch (error) {
      logger.error('Error getting data retention summary:', error);
      throw error;
    }
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(shop, sessionId) {
    try {
      const [searchEvents, clickEvents] = await Promise.all([
        db.visualSearchEvent.findMany({
          where: {
            shop,
            sessionId
          },
          select: {
            id: true,
            eventType: true,
            createdAt: true,
            queryData: true,
            results: true
          }
        }),
        db.searchResultClick.findMany({
          where: {
            shop,
            sessionId
          },
          select: {
            id: true,
            productId: true,
            position: true,
            similarity: true,
            clickType: true,
            createdAt: true
          }
        })
      ]);

      return {
        sessionId,
        shop,
        exportedAt: new Date().toISOString(),
        searchEvents,
        clickEvents,
        totalEvents: searchEvents.length + clickEvents.length
      };
    } catch (error) {
      logger.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Delete user data for GDPR compliance
   */
  async deleteUserData(shop, sessionId) {
    try {
      const [searchResult, clickResult] = await Promise.all([
        db.visualSearchEvent.deleteMany({
          where: {
            shop,
            sessionId
          }
        }),
        db.searchResultClick.deleteMany({
          where: {
            shop,
            sessionId
          }
        })
      ]);

      return {
        sessionId,
        shop,
        deletedAt: new Date().toISOString(),
        deletedEvents: {
          searchEvents: searchResult.count,
          clickEvents: clickResult.count
        }
      };
    } catch (error) {
      logger.error('Error deleting user data:', error);
      throw error;
    }
  }

  /**
   * Check if data needs anonymization
   */
  async needsAnonymization() {
    try {
      const searchCutoff = new Date();
      searchCutoff.setMonth(searchCutoff.getMonth() - this.retentionPeriods.searchEvents);

      const count = await db.visualSearchEvent.count({
        where: {
          createdAt: { lt: searchCutoff },
          ipAddress: { not: null }
        }
      });

      return count > 0;
    } catch (error) {
      logger.error('Error checking anonymization needs:', error);
      return false;
    }
  }

  /**
   * Schedule regular data cleanup
   */
  async scheduleCleanup() {
    try {
      const needsCleanup = await this.needsAnonymization();
      
      if (needsCleanup) {
        logger.info('Starting scheduled data cleanup...');
        await this.anonymizeOldData();
        await this.cleanupOldAggregations();
        logger.info('Scheduled cleanup completed');
      } else {
        logger.info('No data cleanup needed');
      }
    } catch (error) {
      logger.error('Error in scheduled cleanup:', error);
    }
  }
}

export default new DataPrivacyService();
