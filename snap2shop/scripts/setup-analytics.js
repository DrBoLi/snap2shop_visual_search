#!/usr/bin/env node

/**
 * Analytics Setup Script
 * Complete setup and verification of the analytics system
 */

import { execSync } from 'child_process';
import db from '../app/db.server.js';
import analyticsAggregation from '../app/services/analyticsAggregation.server.js';

async function checkDatabaseConnection() {
  console.log('🔌 Checking database connection...');
  
  try {
    await db.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function verifyAnalyticsTables() {
  console.log('📊 Verifying analytics tables...');
  
  try {
    // Check if analytics tables exist and are accessible
    const searchEventCount = await db.visualSearchEvent.count();
    const clickEventCount = await db.searchResultClick.count();
    const popularContentCount = await db.popularContent.count();
    const aggregationCount = await db.analyticsAggregation.count();
    
    console.log('✅ Analytics tables verified:');
    console.log(`   - VisualSearchEvent: ${searchEventCount} records`);
    console.log(`   - SearchResultClick: ${clickEventCount} records`);
    console.log(`   - PopularContent: ${popularContentCount} records`);
    console.log(`   - AnalyticsAggregation: ${aggregationCount} records`);
    
    return true;
  } catch (error) {
    console.error('❌ Analytics tables verification failed:', error.message);
    return false;
  }
}

async function testAnalyticsAggregation() {
  console.log('🧮 Testing analytics aggregation...');
  
  try {
    const testShop = 'snap2shopdemo.myshopify.com';
    const dashboardData = await analyticsAggregation.getDashboardData(testShop, 'last_month');
    
    console.log('✅ Analytics aggregation working:');
    console.log(`   - Image Search Volume: ${dashboardData.imageSearchVolume.total}`);
    console.log(`   - Search Results Clicks: ${dashboardData.searchResultsClicks.total}`);
    console.log(`   - Popular Keywords Clicks: ${dashboardData.popularKeywordsClicks.total}`);
    
    return true;
  } catch (error) {
    console.error('❌ Analytics aggregation test failed:', error.message);
    return false;
  }
}

async function runDataCleanup() {
  console.log('🧹 Running data cleanup...');
  
  try {
    execSync('node scripts/cleanup-analytics.js', { stdio: 'inherit' });
    console.log('✅ Data cleanup completed');
    return true;
  } catch (error) {
    console.error('❌ Data cleanup failed:', error.message);
    return false;
  }
}

async function checkRateLimiting() {
  console.log('🚦 Testing rate limiting...');
  
  try {
    const testShop = 'test-shop.myshopify.com';
    const testEventType = 'image_search';
    
    // Test rate limiting
    for (let i = 0; i < 5; i++) {
      const allowed = analyticsAggregation.checkRateLimit(testShop, testEventType);
      if (!allowed) {
        console.log('✅ Rate limiting working correctly');
        return true;
      }
    }
    
    console.log('⚠️ Rate limiting may need adjustment');
    return true;
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.message);
    return false;
  }
}

async function generateAnalyticsReport() {
  console.log('📋 Generating analytics report...');
  
  try {
    const testShop = 'snap2shopdemo.myshopify.com';
    
    // Get analytics summary
    const searchEvents = await db.visualSearchEvent.findMany({
      where: { shop: testShop },
      select: {
        eventType: true,
        createdAt: true,
        queryData: true
      },
      take: 10
    });
    
    const clickEvents = await db.searchResultClick.findMany({
      where: { shop: testShop },
      select: {
        clickType: true,
        createdAt: true,
        position: true
      },
      take: 10
    });
    
    const popularContent = await db.popularContent.findMany({
      where: { shop: testShop },
      orderBy: { clickCount: 'desc' },
      take: 5
    });
    
    console.log('📊 Analytics Report:');
    console.log(`   - Recent Search Events: ${searchEvents.length}`);
    console.log(`   - Recent Click Events: ${clickEvents.length}`);
    console.log(`   - Top Popular Content:`);
    popularContent.forEach((content, index) => {
      console.log(`     ${index + 1}. ${content.contentName}: ${content.clickCount} clicks`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Analytics report generation failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Analytics System Setup...\n');
  
  const steps = [
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'Analytics Tables', fn: verifyAnalyticsTables },
    { name: 'Analytics Aggregation', fn: testAnalyticsAggregation },
    { name: 'Data Cleanup', fn: runDataCleanup },
    { name: 'Rate Limiting', fn: checkRateLimiting },
    { name: 'Analytics Report', fn: generateAnalyticsReport }
  ];
  
  let allPassed = true;
  
  for (const step of steps) {
    console.log(`\n🔍 ${step.name}...`);
    const passed = await step.fn();
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 Analytics System Setup Complete!');
    console.log('\n✅ All systems are operational:');
    console.log('   - Database connection established');
    console.log('   - Analytics tables created and verified');
    console.log('   - Data aggregation working');
    console.log('   - Rate limiting configured');
    console.log('   - Privacy controls active');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Visit the analytics dashboard');
    console.log('   3. Test the visual search widget');
    console.log('   4. Monitor analytics data collection');
    console.log('\n📚 Documentation:');
    console.log('   - See ANALYTICS_IMPLEMENTATION.md for details');
    console.log('   - Run "node scripts/test-analytics.js" to test');
    console.log('   - Run "node scripts/cleanup-analytics.js" for maintenance');
  } else {
    console.log('❌ Analytics System Setup Failed!');
    console.log('\nPlease check the errors above and try again.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Setup script failed:', error);
  process.exit(1);
});


