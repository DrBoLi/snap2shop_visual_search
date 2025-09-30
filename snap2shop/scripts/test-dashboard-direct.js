#!/usr/bin/env node

/**
 * Test Dashboard Direct Script
 * Test the dashboard loader function directly
 */

import db from '../app/db.server.js';

async function testDashboardDirect() {
  console.log('🧪 Testing dashboard loader directly...');
  
  try {
    // Simulate the dashboard loader logic
    const shop = 'snap2shopdemo.myshopify.com'; // Use the shop from database
    const timeframe = 'last_month';
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Get analytics data
    const imageSearchVolume = await db.visualSearchEvent.count({
      where: {
        shop,
        eventType: 'image_search',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    const imageSearchClicks = await db.searchResultClick.count({
      where: {
        shop,
        clickType: 'search_result',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    const clickThroughRate = imageSearchVolume > 0 
      ? (imageSearchClicks / imageSearchVolume) * 100 
      : 0;
    
    const analytics = {
      imageSearchVolume,
      imageSearchClicks,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10
    };
    
    console.log(`📊 Dashboard analytics for ${shop}:`, analytics);
    
    // Test with different timeframes
    console.log('\n📈 Testing different timeframes:');
    
    // Last 7 days
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);
    last7Days.setHours(0, 0, 0, 0);
    
    const volume7Days = await db.visualSearchEvent.count({
      where: {
        shop,
        eventType: 'image_search',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    const clicks7Days = await db.searchResultClick.count({
      where: {
        shop,
        clickType: 'search_result',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    console.log(`   Last 7 days: ${volume7Days} searches, ${clicks7Days} clicks`);
    
    // All time
    const allTimeVolume = await db.visualSearchEvent.count({
      where: {
        shop,
        eventType: 'image_search'
      }
    });
    
    const allTimeClicks = await db.searchResultClick.count({
      where: {
        shop,
        clickType: 'search_result'
      }
    });
    
    console.log(`   All time: ${allTimeVolume} searches, ${allTimeClicks} clicks`);
    
    console.log('\n✅ Dashboard test completed successfully!');
    
    if (analytics.imageSearchVolume === 0) {
      console.log('\n⚠️ No data found - this might be the issue!');
      console.log('   Check if the shop name matches between authentication and database');
    } else {
      console.log('\n✅ Data found - dashboard should work!');
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard:', error);
    throw error;
  }
}

async function main() {
  try {
    await testDashboardDirect();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();


