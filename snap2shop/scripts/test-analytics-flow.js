#!/usr/bin/env node

/**
 * Analytics Flow Test Script
 * Test the complete analytics flow from search to dashboard
 */

import db from '../app/db.server.js';

async function testAnalyticsFlow() {
  const testShop = 'snap2shopdemo.myshopify.com';
  
  console.log('🧪 Testing complete analytics flow...');

  try {
    // Check current analytics data
    console.log('\n📊 Current Analytics Data:');
    
    const searchEvents = await db.visualSearchEvent.findMany({
      where: { shop: testShop },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        searchId: true,
        eventType: true,
        createdAt: true,
        queryData: true
      }
    });
    
    const clickEvents = await db.searchResultClick.findMany({
      where: { shop: testShop },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        searchId: true,
        productId: true,
        position: true,
        clickType: true,
        createdAt: true
      }
    });
    
    console.log(`   - Search Events: ${searchEvents.length} found`);
    console.log(`   - Click Events: ${clickEvents.length} found`);
    
    if (searchEvents.length > 0) {
      console.log('\n🔍 Recent Search Events:');
      searchEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.searchId} - ${event.eventType} at ${event.createdAt}`);
        if (event.queryData) {
          console.log(`      File: ${event.queryData.fileType}, Results: ${event.queryData.resultCount}`);
        }
      });
    }
    
    if (clickEvents.length > 0) {
      console.log('\n🖱️ Recent Click Events:');
      clickEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. Product ${event.productId} at position ${event.position} from search ${event.searchId}`);
      });
    }
    
    // Test simplified analytics calculation
    console.log('\n📈 Simplified Analytics Calculation:');
    
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const imageSearchVolume = await db.visualSearchEvent.count({
      where: {
        shop: testShop,
        eventType: 'image_search',
        createdAt: { gte: lastMonth }
      }
    });
    
    const imageSearchClicks = await db.searchResultClick.count({
      where: {
        shop: testShop,
        clickType: 'search_result',
        createdAt: { gte: lastMonth }
      }
    });
    
    const clickThroughRate = imageSearchVolume > 0 
      ? (imageSearchClicks / imageSearchVolume) * 100 
      : 0;
    
    console.log(`   - Image Search Volume: ${imageSearchVolume}`);
    console.log(`   - Image Search Clicks: ${imageSearchClicks}`);
    console.log(`   - Click-Through Rate: ${clickThroughRate.toFixed(1)}%`);
    
    // Test data quality
    console.log('\n🔍 Data Quality Check:');
    
    const totalSearches = await db.visualSearchEvent.count({
      where: { shop: testShop, eventType: 'image_search' }
    });
    
    const totalClicks = await db.searchResultClick.count({
      where: { shop: testShop, clickType: 'search_result' }
    });
    
    const overallCTR = totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 0;
    
    console.log(`   - Total Searches: ${totalSearches}`);
    console.log(`   - Total Clicks: ${totalClicks}`);
    console.log(`   - Overall CTR: ${overallCTR.toFixed(1)}%`);
    
    // Check for recent activity
    const recentActivity = await db.visualSearchEvent.findFirst({
      where: { 
        shop: testShop,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (recentActivity) {
      console.log(`\n✅ Recent activity found: ${recentActivity.searchId} at ${recentActivity.createdAt}`);
    } else {
      console.log('\n⚠️ No recent activity found in the last 24 hours');
      console.log('   Try performing some image searches to generate data');
    }

    console.log('\n✅ Analytics flow test completed!');
    
    if (totalSearches === 0) {
      console.log('\n💡 Next Steps:');
      console.log('   1. Start the development server: npm run dev');
      console.log('   2. Perform some image searches in the visual search widget');
      console.log('   3. Click on some search results');
      console.log('   4. Check the dashboard at /app/dashboard');
    }
    
  } catch (error) {
    console.error('❌ Error testing analytics flow:', error);
    throw error;
  }
}

async function main() {
  try {
    await testAnalyticsFlow();
    console.log('\n🎉 Analytics flow test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();

