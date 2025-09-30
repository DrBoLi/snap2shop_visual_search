#!/usr/bin/env node

/**
 * Test Real-time Updates Script
 * Simulate adding new analytics data and test if dashboard would update
 */

import db from '../app/db.server.js';

async function testRealtimeUpdates() {
  console.log('🧪 Testing real-time updates...');
  
  try {
    const testShop = 'snap2shopdemo.myshopify.com';
    
    // Get current data
    const now = new Date();
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);
    last7Days.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    console.log('📊 Current data (last 7 days):');
    
    const currentSearches = await db.visualSearchEvent.count({
      where: {
        shop: testShop,
        eventType: 'image_search',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    const currentClicks = await db.searchResultClick.count({
      where: {
        shop: testShop,
        clickType: 'search_result',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    console.log(`   Searches: ${currentSearches}`);
    console.log(`   Clicks: ${currentClicks}`);
    console.log(`   CTR: ${currentClicks > 0 ? ((currentClicks / currentSearches) * 100).toFixed(1) : 0}%`);
    
    // Add a test search event
    console.log('\n➕ Adding test search event...');
    
    const testSearchId = `test_search_${Date.now()}`;
    await db.visualSearchEvent.create({
      data: {
        shop: testShop,
        sessionId: `test_session_${Date.now()}`,
        eventType: 'image_search',
        searchId: testSearchId,
        queryData: {
          fileSize: 1024,
          fileType: 'image/jpeg',
          resultCount: 5,
          topK: 10,
          threshold: 0.5
        },
        results: [
          { productId: 'test_product_1', similarity: 0.95, position: 1 },
          { productId: 'test_product_2', similarity: 0.87, position: 2 }
        ],
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
      }
    });
    
    // Add a test click event
    console.log('➕ Adding test click event...');
    
    await db.searchResultClick.create({
      data: {
        shop: testShop,
        searchId: testSearchId,
        sessionId: `test_session_${Date.now()}`,
        productId: 'test_product_1',
        position: 1,
        similarity: 0.95,
        clickType: 'search_result'
      }
    });
    
    // Check updated data
    console.log('\n📊 Updated data (last 7 days):');
    
    const updatedSearches = await db.visualSearchEvent.count({
      where: {
        shop: testShop,
        eventType: 'image_search',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    const updatedClicks = await db.searchResultClick.count({
      where: {
        shop: testShop,
        clickType: 'search_result',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    console.log(`   Searches: ${updatedSearches} (+${updatedSearches - currentSearches})`);
    console.log(`   Clicks: ${updatedClicks} (+${updatedClicks - currentClicks})`);
    console.log(`   CTR: ${updatedClicks > 0 ? ((updatedClicks / updatedSearches) * 100).toFixed(1) : 0}%`);
    
    // Test API endpoint logic
    console.log('\n🔍 Testing API endpoint logic:');
    
    const apiSearches = await db.visualSearchEvent.count({
      where: {
        shop: testShop,
        eventType: 'image_search',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    const apiClicks = await db.searchResultClick.count({
      where: {
        shop: testShop,
        clickType: 'search_result',
        createdAt: { gte: last7Days, lte: endDate }
      }
    });
    
    const apiCTR = apiSearches > 0 ? (apiClicks / apiSearches) * 100 : 0;
    
    console.log(`   API would return: ${apiSearches} searches, ${apiClicks} clicks, ${apiCTR.toFixed(1)}% CTR`);
    
    console.log('\n✅ Real-time update test completed!');
    console.log('💡 The dashboard should now show updated numbers if polling is working');
    
  } catch (error) {
    console.error('❌ Error testing real-time updates:', error);
    throw error;
  }
}

async function main() {
  try {
    await testRealtimeUpdates();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();


