import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import logger from "../utils/logger.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const syncStatus = await db.syncStatus.findUnique({
      where: { shop },
    });

    if (!syncStatus) {
      return json({
        status: "idle",
        progress: 0,
        totalItems: 0,
        lastSync: null,
        errorMessage: null,
      });
    }

    return json({
      status: syncStatus.status,
      progress: syncStatus.progress,
      totalItems: syncStatus.totalItems,
      lastSync: syncStatus.lastSync,
      errorMessage: syncStatus.errorMessage,
    });
  } catch (error) {
    logger.error("Error fetching sync status:", error);
    return json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    );
  }
};
