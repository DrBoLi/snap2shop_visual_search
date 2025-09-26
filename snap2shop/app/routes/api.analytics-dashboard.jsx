import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import analyticsAggregation from "../services/analyticsAggregation.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'last_month';
    
    // Get analytics data for the dashboard
    const analytics = await analyticsAggregation.getDashboardData(shop, timeframe);
    
    return json(analytics);
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error);
    return json(
      { 
        error: "Failed to fetch analytics data",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
};

