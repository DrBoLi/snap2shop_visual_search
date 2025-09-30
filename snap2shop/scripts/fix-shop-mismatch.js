#!/usr/bin/env node

/**
 * Fix Shop Mismatch Script
 * Update all analytics data to use the correct shop name
 */

import db from '../app/db.server.js';

async function fixShopMismatch() {
  console.log('🔧 Fixing shop name mismatch...');
  
  try {
    // Get all unique shops in the database
    const shops = await db.visualSearchEvent.findMany({
      select: { shop: true },
      distinct: ['shop'],
      take: 10
    });
    
    console.log('📊 Current shops in database:', shops.map(s => s.shop));
    
    if (shops.length === 0) {
      console.log('❌ No shops found in database');
      return;
    }
    
    // Get the most common shop (the one with most data)
    const shopCounts = await Promise.all(
      shops.map(async (s) => {
        const count = await db.visualSearchEvent.count({
          where: { shop: s.shop }
        });
        return { shop: s.shop, count };
      })
    );
    
    const mainShop = shopCounts.reduce((max, current) => 
      current.count > max.count ? current : max
    );
    
    console.log(`🎯 Main shop: ${mainShop.shop} (${mainShop.count} events)`);
    
    // Check if we need to update any data
    const totalEvents = await db.visualSearchEvent.count();
    const totalClicks = await db.searchResultClick.count();
    
    console.log(`📈 Total events: ${totalEvents} searches, ${totalClicks} clicks`);
    
    // If all data is already under the main shop, we're good
    if (mainShop.count === totalEvents) {
      console.log('✅ All data is already under the main shop');
      console.log(`💡 Use shop name: ${mainShop.shop}`);
      return;
    }
    
    // Update all events to use the main shop
    console.log('🔄 Updating all events to use main shop...');
    
    const updateSearches = await db.visualSearchEvent.updateMany({
      where: {
        shop: { not: mainShop.shop }
      },
      data: {
        shop: mainShop.shop
      }
    });
    
    const updateClicks = await db.searchResultClick.updateMany({
      where: {
        shop: { not: mainShop.shop }
      },
      data: {
        shop: mainShop.shop
      }
    });
    
    console.log(`✅ Updated ${updateSearches.count} search events`);
    console.log(`✅ Updated ${updateClicks.count} click events`);
    
    // Verify the fix
    const finalCount = await db.visualSearchEvent.count({
      where: { shop: mainShop.shop }
    });
    
    console.log(`🎉 Final count: ${finalCount} events under ${mainShop.shop}`);
    
  } catch (error) {
    console.error('❌ Error fixing shop mismatch:', error);
    throw error;
  }
}

async function main() {
  try {
    await fixShopMismatch();
    console.log('\n🎉 Shop mismatch fix completed!');
    console.log('💡 Now try accessing the dashboard again');
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

main();


