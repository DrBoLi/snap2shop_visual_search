#!/usr/bin/env node

/**
 * Test API Direct Script
 * Test the analytics API endpoint directly
 */

import db from '../app/db.server.js';

async function testAPIDirect() {
  console.log('🧪 Testing API endpoint directly...');
  
  try {
    const testShop = 'snap2shopdemo.myshopify.com';
    const timeframe = 'last_7_days';
    
    // Simulate the API logic
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Get analytics data
    const imageSearchVolume = await db.visualSearchEvent.count({
      where: {
        shop: testShop,
        eventType: 'image_search',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    const imageSearchClicks = await db.searchResultClick.count({
      where: {
        shop: testShop,
        clickType: 'search_result',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    const clickThroughRate = imageSearchVolume > 0 
      ? (imageSearchClicks / imageSearchVolume) * 100 
      : 0;
    
    const result = {
      imageSearchVolume,
      imageSearchClicks,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10,
      timeframe
    };
    
    console.log('📊 API Result:', JSON.stringify(result, null, 2));
    
    // Test multiple calls to simulate polling
    console.log('\n🔄 Simulating polling (3 calls):');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\nCall ${i}:`);
      
      const volume = await db.visualSearchEvent.count({
        where: {
          shop: testShop,
          eventType: 'image_search',
          createdAt: { gte: startDate, lte: endDate }
        }
      });
      
      const clicks = await db.searchResultClick.count({
        where: {
          shop: testShop,
          clickType: 'search_result',
          createdAt: { gte: startDate, lte: endDate }
        }
      });
      
      const ctr = volume > 0 ? (clicks / volume) * 100 : 0;
      
      console.log(`   Searches: ${volume}, Clicks: ${clicks}, CTR: ${ctr.toFixed(1)}%`);
      
      // Wait 1 second between calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ API test completed!');
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
    throw error;
  }
}

async function main() {
  try {
    await testAPIDirect();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();

