#!/usr/bin/env node

/**
 * Sample Data Population Script
 * Populates the database with realistic analytics data for testing
 */

import db from '../app/db.server.js';

async function createSampleData() {
  const testShop = 'snap2shopdemo.myshopify.com';
  
  console.log('📊 Creating sample analytics data...');

  try {
    // Create sample search events over the last 30 days
    const searchEvents = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Create 5-15 search events per day
      const dailySearches = Math.floor(Math.random() * 11) + 5;
      
      for (let j = 0; j < dailySearches; j++) {
        const searchEvent = await db.visualSearchEvent.create({
          data: {
            shop: testShop,
            sessionId: `session_${i}_${j}`,
            eventType: 'image_search',
            searchId: `search_${i}_${j}`,
            queryData: {
              fileSize: Math.floor(Math.random() * 2000000) + 500000,
              fileType: ['image/jpeg', 'image/png', 'image/webp'][Math.floor(Math.random() * 3)],
              resultCount: Math.floor(Math.random() * 8) + 3
            },
            results: Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, k) => ({
              productId: `product_${Math.floor(Math.random() * 100)}`,
              similarity: 0.9 - (k * 0.1),
              position: k + 1
            })),
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            ipAddress: '192.168.1.100',
            createdAt: new Date(date.getTime() + Math.random() * 86400000) // Random time during the day
          }
        });
        searchEvents.push(searchEvent);
      }
    }

    // Create sample click events
    for (const searchEvent of searchEvents) {
      const clickCount = Math.floor(Math.random() * 3) + 1; // 1-3 clicks per search
      
      for (let k = 0; k < clickCount; k++) {
        await db.searchResultClick.create({
          data: {
            shop: testShop,
            searchId: searchEvent.searchId,
            sessionId: searchEvent.sessionId,
            productId: `product_${Math.floor(Math.random() * 100)}`,
            position: k + 1,
            similarity: 0.9 - (k * 0.1),
            clickType: 'search_result',
            createdAt: new Date(searchEvent.createdAt.getTime() + Math.random() * 300000) // Within 5 minutes of search
          }
        });
      }
    }

    // Create sample popular content
    const popularContent = [
      { contentType: 'keyword', contentId: 'red-dress', contentName: 'Red Dress', clickCount: 45 },
      { contentType: 'keyword', contentId: 'blue-jeans', contentName: 'Blue Jeans', clickCount: 38 },
      { contentType: 'keyword', contentId: 'white-sneakers', contentName: 'White Sneakers', clickCount: 32 },
      { contentType: 'keyword', contentId: 'black-handbag', contentName: 'Black Handbag', clickCount: 28 },
      { contentType: 'product', contentId: 'product_123', contentName: 'Featured Summer Dress', clickCount: 25 },
      { contentType: 'product', contentId: 'product_456', contentName: 'Classic Denim Jacket', clickCount: 22 },
      { contentType: 'product', contentId: 'product_789', contentName: 'Leather Crossbody Bag', clickCount: 18 },
      { contentType: 'collection', contentId: 'summer-collection', contentName: 'Summer Collection', clickCount: 35 },
      { contentType: 'collection', contentId: 'new-arrivals', contentName: 'New Arrivals', clickCount: 28 },
      { contentType: 'collection', contentId: 'sale-items', contentName: 'Sale Items', clickCount: 42 }
    ];

    for (const content of popularContent) {
      await db.popularContent.create({
        data: {
          shop: testShop,
          ...content,
          lastUsed: new Date(now.getTime() - Math.random() * 7 * 86400000) // Within last week
        }
      });
    }

    console.log('✅ Sample data created successfully');
    console.log(`📈 Created ${searchEvents.length} search events`);
    console.log(`🖱️ Created click events for searches`);
    console.log(`⭐ Created ${popularContent.length} popular content items`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

async function main() {
  try {
    await createSampleData();
    console.log('🎉 Sample data population completed!');
    console.log('💡 You can now view the analytics dashboard with realistic data');
  } catch (error) {
    console.error('❌ Sample data population failed:', error);
    process.exit(1);
  }
}

main();


