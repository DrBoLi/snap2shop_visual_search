#!/usr/bin/env node

/**
 * Debug Dashboard Script
 * Test the analytics dashboard API directly
 */

import db from '../app/db.server.js';

async function debugDashboard() {
  console.log('🔍 Debugging Dashboard API...');
  
  try {
    // Test the same logic as the API
    const testShop = 'snap2shopdemo.myshopify.com';
    
    // Calculate date range (last month)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Get image search volume
    const imageSearchVolume = await db.visualSearchEvent.count({
      where: {
        shop: testShop,
        eventType: 'image_search',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    console.log(`🔍 Image Search Volume: ${imageSearchVolume}`);
    
    // Get image search clicks
    const imageSearchClicks = await db.searchResultClick.count({
      where: {
        shop: testShop,
        clickType: 'search_result',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    console.log(`🖱️ Image Search Clicks: ${imageSearchClicks}`);
    
    // Calculate click-through rate
    const clickThroughRate = imageSearchVolume > 0 
      ? (imageSearchClicks / imageSearchVolume) * 100 
      : 0;
    
    console.log(`📊 Click-Through Rate: ${clickThroughRate.toFixed(1)}%`);
    
    // Test with different timeframes
    console.log('\n📈 Testing different timeframes:');
    
    // Last 7 days
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);
    last7Days.setHours(0, 0, 0, 0);
    
    const volume7Days = await db.visualSearchEvent.count({
      where: {
        shop: testShop,
        eventType: 'image_search',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    const clicks7Days = await db.searchResultClick.count({
      where: {
        shop: testShop,
        clickType: 'search_result',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    console.log(`   Last 7 days: ${volume7Days} searches, ${clicks7Days} clicks`);
    
    // All time
    const allTimeVolume = await db.visualSearchEvent.count({
      where: {
        shop: testShop,
        eventType: 'image_search'
      }
    });
    
    const allTimeClicks = await db.searchResultClick.count({
      where: {
        shop: testShop,
        clickType: 'search_result'
      }
    });
    
    console.log(`   All time: ${allTimeVolume} searches, ${allTimeClicks} clicks`);
    
    // Check if there are any recent events
    const recentEvents = await db.visualSearchEvent.findMany({
      where: {
        shop: testShop,
        eventType: 'image_search',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        searchId: true,
        createdAt: true,
        queryData: true
      }
    });
    
    console.log(`\n🕐 Recent events (last 24h): ${recentEvents.length}`);
    recentEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.searchId} at ${event.createdAt}`);
    });
    
    console.log('\n✅ Dashboard debug completed!');
    
  } catch (error) {
    console.error('❌ Error debugging dashboard:', error);
    throw error;
  }
}

async function main() {
  try {
    await debugDashboard();
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

main();


