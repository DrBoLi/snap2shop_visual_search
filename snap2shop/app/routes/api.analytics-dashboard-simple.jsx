import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let shop = session.shop;

  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'last_month';
    
    // Check if we have data for the authenticated shop, if not use the database shop
    const existingShops = await db.visualSearchEvent.findMany({
      select: { shop: true },
      distinct: ['shop'],
      take: 5
    });
    
    const dbShops = existingShops.map(s => s.shop);
    
    // If authenticated shop has no data, use the first available shop
    if (!dbShops.includes(shop) && dbShops.length > 0) {
      shop = dbShops[0];
      console.log(`⚠️ API using fallback shop: ${shop} (authenticated: ${session.shop})`);
    }
    
    // Calculate date range
    const { startDate, endDate } = getDateRange(timeframe);
    
    // Get image search volume
    const searchQuery = {
      shop,
      eventType: 'image_search',
      createdAt: { gte: startDate, lte: endDate }
    };

    console.log(`🔍 Fetching search events for shop: ${shop}`, searchQuery);
    const imageSearchVolume = await db.visualSearchEvent.count({
      where: searchQuery
    });

    // Get all search events for debugging
    const totalSearches = await db.visualSearchEvent.count({
      where: { shop, eventType: 'image_search' }
    });
    console.log(`📊 Total searches for ${shop}: ${totalSearches}, In date range: ${imageSearchVolume}`);

    // Get image search clicks
    const clickQuery = {
      shop,
      clickType: 'search_result',
      createdAt: { gte: startDate, lte: endDate }
    };

    console.log(`🔍 Fetching click events for shop: ${shop}`, clickQuery);
    const imageSearchClicks = await db.searchResultClick.count({
      where: clickQuery
    });

    // Get all clicks for debugging
    const totalClicks = await db.searchResultClick.count({
      where: { shop, clickType: 'search_result' }
    });
    console.log(`📊 Total clicks for ${shop}: ${totalClicks}, In date range: ${imageSearchClicks}`);

    
    // Calculate click-through rate
    const clickThroughRate = imageSearchVolume > 0 
      ? (imageSearchClicks / imageSearchVolume) * 100 
      : 0;
    
    return json({
      imageSearchVolume,
      imageSearchClicks,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10, // Round to 1 decimal
      timeframe
    });
  } catch (error) {
    console.error('Error fetching simplified analytics:', error);
    return json({
      imageSearchVolume: 0,
      imageSearchClicks: 0,
      clickThroughRate: 0,
      error: error.message
    }, { status: 500 });
  }
};

function getDateRange(timeframe) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate = new Date(now);

  switch (timeframe) {
    case 'last_7_days':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_3_months':
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
  }

  console.log(`📊 Date range for ${timeframe}:`, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  return { startDate, endDate };
}
