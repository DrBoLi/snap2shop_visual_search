#!/usr/bin/env node

/**
 * Check Analytics Data Script
 * Check if analytics data is being tracked in the database
 */

import db from '../app/db.server.js';

async function checkAnalyticsData() {
  console.log('🔍 Checking analytics data in database...');
  
  try {
    // Check all shops in the database
    const shops = await db.visualSearchEvent.findMany({
      select: { shop: true },
      distinct: ['shop'],
      take: 10
    });
    
    console.log('🏪 Shops with data:', shops.map(s => s.shop));
    
    if (shops.length === 0) {
      console.log('❌ No analytics data found in database');
      console.log('💡 This means the search API is not being called or analytics tracking is not working');
      return;
    }
    
    // Check recent activity for each shop
    for (const shopData of shops) {
      const shop = shopData.shop;
      console.log(`\n📊 Analytics for shop: ${shop}`);
      
      // Get recent search events (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentSearches = await db.visualSearchEvent.findMany({
        where: {
          shop,
          createdAt: { gte: yesterday }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log(`   Recent searches (last 24h): ${recentSearches.length}`);
      
      if (recentSearches.length > 0) {
        console.log('   Latest search events:');
        recentSearches.forEach((search, index) => {
          console.log(`     ${index + 1}. ${search.eventType} at ${search.createdAt.toISOString()}`);
          console.log(`        Search ID: ${search.searchId}`);
          console.log(`        Results: ${search.results?.length || 0}`);
        });
      }
      
      // Get recent click events
      const recentClicks = await db.searchResultClick.findMany({
        where: {
          shop,
          createdAt: { gte: yesterday }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      console.log(`   Recent clicks (last 24h): ${recentClicks.length}`);
      
      if (recentClicks.length > 0) {
        console.log('   Latest click events:');
        recentClicks.forEach((click, index) => {
          console.log(`     ${index + 1}. ${click.clickType} at ${click.createdAt.toISOString()}`);
          console.log(`        Product ID: ${click.productId}`);
          console.log(`        Position: ${click.position}`);
        });
      }
    }
    
    // Check total counts
    const totalSearches = await db.visualSearchEvent.count();
    const totalClicks = await db.searchResultClick.count();
    
    console.log(`\n📈 Total Analytics Data:`);
    console.log(`   Total Search Events: ${totalSearches}`);
    console.log(`   Total Click Events: ${totalClicks}`);
    
    if (totalSearches === 0) {
      console.log('\n❌ No search events found!');
      console.log('🔧 Possible issues:');
      console.log('   1. Visual search widget is not calling the API');
      console.log('   2. API is not tracking analytics');
      console.log('   3. Database connection issues');
      console.log('   4. App proxy URL is pointing to production instead of localhost');
    }
    
  } catch (error) {
    console.error('❌ Error checking analytics data:', error);
    throw error;
  }
}

async function main() {
  try {
    await checkAnalyticsData();
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

main();
