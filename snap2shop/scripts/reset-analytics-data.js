#!/usr/bin/env node

/**
 * Reset Analytics Data Script
 * Clears all analytics data so you can test real-time updates
 */

import db from '../app/db.server.js';

async function resetAnalyticsData() {
  console.log('🧹 Resetting analytics data...');
  
  try {
    // Get current counts before deletion
    const searchCount = await db.visualSearchEvent.count();
    const clickCount = await db.searchResultClick.count();
    const popularCount = await db.popularContent.count();
    const aggregationCount = await db.analyticsAggregation.count();
    
    console.log('📊 Current data counts:');
    console.log(`   Search Events: ${searchCount}`);
    console.log(`   Click Events: ${clickCount}`);
    console.log(`   Popular Content: ${popularCount}`);
    console.log(`   Aggregations: ${aggregationCount}`);
    
    // Delete all analytics data
    console.log('\n🗑️ Deleting analytics data...');
    
    await db.searchResultClick.deleteMany({});
    console.log('   ✅ Deleted all click events');
    
    await db.visualSearchEvent.deleteMany({});
    console.log('   ✅ Deleted all search events');
    
    await db.popularContent.deleteMany({});
    console.log('   ✅ Deleted all popular content');
    
    await db.analyticsAggregation.deleteMany({});
    console.log('   ✅ Deleted all aggregations');
    
    // Verify deletion
    const finalSearchCount = await db.visualSearchEvent.count();
    const finalClickCount = await db.searchResultClick.count();
    const finalPopularCount = await db.popularContent.count();
    const finalAggregationCount = await db.analyticsAggregation.count();
    
    console.log('\n📊 Final data counts:');
    console.log(`   Search Events: ${finalSearchCount}`);
    console.log(`   Click Events: ${finalClickCount}`);
    console.log(`   Popular Content: ${finalPopularCount}`);
    console.log(`   Aggregations: ${finalAggregationCount}`);
    
    console.log('\n✅ Analytics data reset completed!');
    console.log('🎯 Now you can test real-time updates with fresh data');
    console.log('💡 Perform some image searches and watch the dashboard update');
    
  } catch (error) {
    console.error('❌ Error resetting analytics data:', error);
    throw error;
  }
}

async function main() {
  try {
    await resetAnalyticsData();
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

main();




