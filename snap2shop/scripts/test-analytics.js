#!/usr/bin/env node

/**
 * Analytics Test Script
 * Test the analytics tracking system with sample data
 */

import db from '../app/db.server.js';
import analyticsAggregation from '../app/services/analyticsAggregation.server.js';

async function createTestData() {
  const testShop = 'test-shop.myshopify.com';
  const testSessionId = 'test_session_123';

  console.log('🧪 Creating test analytics data...');

  try {
    // Create test search events
    const searchEvents = [];
    for (let i = 0; i < 10; i++) {
      const searchEvent = await db.visualSearchEvent.create({
        data: {
          shop: testShop,
          sessionId: testSessionId,
          eventType: 'image_search',
          searchId: `test_search_${i}`,
          queryData: {
            fileSize: 1024000,
            fileType: 'image/jpeg',
            resultCount: 5
          },
          results: [
            { productId: `product_${i}_1`, similarity: 0.95, position: 1 },
            { productId: `product_${i}_2`, similarity: 0.87, position: 2 }
          ],
          userAgent: 'Mozilla/5.0 (Test Browser)',
          ipAddress: '127.0.0.1'
        }
      });
      searchEvents.push(searchEvent);
    }

    // Create test click events
    for (let i = 0; i < 15; i++) {
      await db.searchResultClick.create({
        data: {
          shop: testShop,
          searchId: `test_search_${i % 10}`,
          sessionId: testSessionId,
          productId: `product_${i % 10}_${(i % 2) + 1}`,
          position: (i % 2) + 1,
          similarity: 0.9 - (i * 0.01),
          clickType: 'search_result'
        }
      });
    }

    // Create test popular content
    const popularContent = [
      { contentType: 'keyword', contentId: 'red-dress', contentName: 'Red Dress', clickCount: 25 },
      { contentType: 'keyword', contentId: 'blue-jeans', contentName: 'Blue Jeans', clickCount: 18 },
      { contentType: 'product', contentId: 'product_123', contentName: 'Featured Product', clickCount: 12 },
      { contentType: 'collection', contentId: 'summer-collection', contentName: 'Summer Collection', clickCount: 8 }
    ];

    for (const content of popularContent) {
      await db.popularContent.create({
        data: {
          shop: testShop,
          ...content
        }
      });
    }

    console.log('✅ Test data created successfully');
    return { testShop, searchEvents };

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function testAnalyticsAggregation(testShop) {
  console.log('📊 Testing analytics aggregation...');

  try {
    // Test daily aggregation
    const today = new Date();
    const aggregationResult = await analyticsAggregation.aggregateDaily(testShop, today);
    
    console.log('📈 Daily aggregation result:', {
      searches: aggregationResult.searches,
      clicks: aggregationResult.clicks
    });

    // Test dashboard data
    const dashboardData = await analyticsAggregation.getDashboardData(testShop, 'last_month');
    
    console.log('📊 Dashboard data:', {
      imageSearchVolume: dashboardData.imageSearchVolume.total,
      searchResultsClicks: dashboardData.searchResultsClicks.total,
      popularKeywordsClicks: dashboardData.popularKeywordsClicks.total
    });

    console.log('✅ Analytics aggregation test completed');

  } catch (error) {
    console.error('❌ Error testing analytics aggregation:', error);
    throw error;
  }
}

async function cleanupTestData(testShop) {
  console.log('🧹 Cleaning up test data...');

  try {
    await db.searchResultClick.deleteMany({
      where: { shop: testShop }
    });

    await db.visualSearchEvent.deleteMany({
      where: { shop: testShop }
    });

    await db.popularContent.deleteMany({
      where: { shop: testShop }
    });

    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

async function main() {
  console.log('🚀 Starting analytics system test...');

  try {
    // Create test data
    const { testShop } = await createTestData();

    // Test analytics aggregation
    await testAnalyticsAggregation(testShop);

    // Clean up test data
    await cleanupTestData(testShop);

    console.log('✅ All analytics tests completed successfully');

  } catch (error) {
    console.error('❌ Analytics test failed:', error);
    process.exit(1);
  }
}

// Run the test
main();


