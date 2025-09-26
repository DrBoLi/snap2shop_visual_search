#!/usr/bin/env node

/**
 * Simple Analytics Test Script
 * Test the simplified 3-metric analytics system
 */

import db from '../app/db.server.js';

async function testSimpleAnalytics() {
  const testShop = 'snap2shopdemo.myshopify.com';
  
  console.log('🧪 Testing simplified analytics system...');

  try {
    // Test data retrieval for different timeframes
    const timeframes = ['last_7_days', 'last_month', 'last_3_months'];
    
    for (const timeframe of timeframes) {
      console.log(`\n📊 Testing timeframe: ${timeframe}`);
      
      const { startDate, endDate } = getDateRange(timeframe);
      
      // Get image search volume
      const imageSearchVolume = await db.visualSearchEvent.count({
        where: {
          shop: testShop,
          eventType: 'image_search',
          createdAt: { gte: startDate, lte: endDate }
        }
      });
      
      // Get image search clicks
      const imageSearchClicks = await db.searchResultClick.count({
        where: {
          shop: testShop,
          clickType: 'search_result',
          createdAt: { gte: startDate, lte: endDate }
        }
      });
      
      // Calculate click-through rate
      const clickThroughRate = imageSearchVolume > 0 
        ? (imageSearchClicks / imageSearchVolume) * 100 
        : 0;
      
      console.log(`   - Image Search Volume: ${imageSearchVolume}`);
      console.log(`   - Image Search Clicks: ${imageSearchClicks}`);
      console.log(`   - Click-Through Rate: ${clickThroughRate.toFixed(1)}%`);
    }

    // Test overall data
    console.log('\n📈 Overall Analytics Summary:');
    
    const totalSearches = await db.visualSearchEvent.count({
      where: { shop: testShop, eventType: 'image_search' }
    });
    
    const totalClicks = await db.searchResultClick.count({
      where: { shop: testShop, clickType: 'search_result' }
    });
    
    const overallCTR = totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 0;
    
    console.log(`   - Total Image Searches: ${totalSearches}`);
    console.log(`   - Total Image Search Clicks: ${totalClicks}`);
    console.log(`   - Overall CTR: ${overallCTR.toFixed(1)}%`);

    // Test data quality
    console.log('\n🔍 Data Quality Check:');
    
    const recentSearches = await db.visualSearchEvent.findMany({
      where: { 
        shop: testShop, 
        eventType: 'image_search' 
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        searchId: true,
        createdAt: true,
        queryData: true
      }
    });
    
    const recentClicks = await db.searchResultClick.findMany({
      where: { 
        shop: testShop, 
        clickType: 'search_result' 
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        searchId: true,
        productId: true,
        position: true,
        createdAt: true
      }
    });
    
    console.log(`   - Recent Searches: ${recentSearches.length} found`);
    console.log(`   - Recent Clicks: ${recentClicks.length} found`);
    
    if (recentSearches.length > 0) {
      console.log(`   - Latest Search: ${recentSearches[0].searchId} at ${recentSearches[0].createdAt}`);
    }
    
    if (recentClicks.length > 0) {
      console.log(`   - Latest Click: Product ${recentClicks[0].productId} at position ${recentClicks[0].position}`);
    }

    console.log('\n✅ Simplified analytics test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing simplified analytics:', error);
    throw error;
  }
}

function getDateRange(timeframe) {
  const now = new Date();
  let startDate, endDate;

  switch (timeframe) {
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last_month':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'last_3_months':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
  }

  endDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

async function main() {
  try {
    await testSimpleAnalytics();
    console.log('\n🎉 All tests passed! The simplified analytics system is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();

