import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  resolveDashboardShop,
  getDashboardMetrics,
} from "../services/dashboardAnalytics.server.js";
import logger from "../utils/logger.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const preferredShop = session.shop;

  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get("timeframe") || "last_month";

    const { shop, availableShops } = await resolveDashboardShop(preferredShop);
    if (shop !== preferredShop) {
      logger.warn(`API using fallback shop: ${shop} (authenticated: ${preferredShop})`);
    }

    const metrics = await getDashboardMetrics(shop, timeframe);

    return json({
      imageSearchVolume: metrics.summary.imageSearchVolume,
      imageSearchClicks: metrics.summary.imageSearchClicks,
      clickThroughRate: metrics.summary.clickThroughRate,
      timeframe: metrics.timeframe,
      dailyMetrics: metrics.dailyMetrics,
      shop,
      availableShops,
    });
  } catch (error) {
    logger.error("Error fetching simplified analytics:", error);
    return json(
      {
        imageSearchVolume: 0,
        imageSearchClicks: 0,
        clickThroughRate: 0,
        dailyMetrics: [],
        error: error.message,
      },
      { status: 500 },
    );
  }
};
