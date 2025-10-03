#!/usr/bin/env node

/**
 * Analytics Data Cleanup Script
 * Run this script periodically to anonymize old data and maintain privacy compliance
 */

import dataPrivacy from '../app/services/dataPrivacy.server.js';

async function main() {
  console.log('🧹 Starting analytics data cleanup...');
  
  try {
    // Check if cleanup is needed
    const needsCleanup = await dataPrivacy.needsAnonymization();
    
    if (!needsCleanup) {
      console.log('✅ No data cleanup needed');
      process.exit(0);
    }

    // Perform cleanup
    console.log('🔄 Anonymizing old data...');
    const anonymizeResult = await dataPrivacy.anonymizeOldData();
    
    console.log('📊 Anonymization results:', {
      searchEvents: anonymizeResult.searchEvents,
      clickEvents: anonymizeResult.clickEvents,
      popularContent: anonymizeResult.popularContent,
      errors: anonymizeResult.errors.length
    });

    if (anonymizeResult.errors.length > 0) {
      console.error('❌ Errors during anonymization:', anonymizeResult.errors);
    }

    // Clean up old aggregations
    console.log('🗑️ Cleaning up old aggregations...');
    const deletedAggregations = await dataPrivacy.cleanupOldAggregations();
    console.log(`✅ Deleted ${deletedAggregations} old aggregation records`);

    console.log('✅ Data cleanup completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Data cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
main();





