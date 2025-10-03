import db from "../db.server.js";
import logger from "../utils/logger.js";

export async function resolveDashboardShop(preferredShop) {
  let shop = preferredShop;

  const existingShops = await db.visualSearchEvent.findMany({
    select: { shop: true },
    distinct: ["shop"],
    take: 5,
  });

  const availableShops = existingShops.map((entry) => entry.shop);

  if (!availableShops.includes(shop) && availableShops.length > 0) {
    shop = availableShops[0];
  }

  return { shop, availableShops };
}

export async function getDashboardMetrics(shop, timeframe) {
  const { startDate, endDate } = getDateRange(timeframe);
  const dateSeries = buildDateSeries(startDate, endDate);

  const searchDaily = await db.$queryRaw`
    SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::int AS count
    FROM "VisualSearchEvent"
    WHERE "shop" = ${shop}
      AND "eventType" = 'image_search'
      AND "createdAt" BETWEEN ${startDate} AND ${endDate}
    GROUP BY day
    ORDER BY day ASC;
  `;

  const clickDaily = await db.$queryRaw`
    SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::int AS count
    FROM "SearchResultClick"
    WHERE "shop" = ${shop}
      AND "clickType" = 'search_result'
      AND "createdAt" BETWEEN ${startDate} AND ${endDate}
    GROUP BY day
    ORDER BY day ASC;
  `;

  const dailyMetrics = mergeDailyMetrics(dateSeries, searchDaily, clickDaily);

  const imageSearchVolume = dailyMetrics.reduce((total, entry) => total + entry.searches, 0);
  const imageSearchClicks = dailyMetrics.reduce((total, entry) => total + entry.clicks, 0);
  const clickThroughRate = imageSearchVolume > 0
    ? Math.round(((imageSearchClicks / imageSearchVolume) * 100) * 10) / 10
    : 0;

  return {
    dailyMetrics,
    summary: {
      imageSearchVolume,
      imageSearchClicks,
      clickThroughRate,
    },
    timeframe,
    startDate,
    endDate,
  };
}

export function getDateRange(timeframe) {
  const now = new Date();
  
  // Use UTC to match how data is stored in the database
  const endDate = new Date(now);
  endDate.setUTCHours(23, 59, 59, 999);

  const startDate = new Date(now);

  switch (timeframe) {
    case "last_7_days":
      startDate.setUTCDate(startDate.getUTCDate() - 7);
      break;
    case "last_month":
      startDate.setUTCDate(startDate.getUTCDate() - 30);
      break;
    case "last_3_months":
      startDate.setUTCDate(startDate.getUTCDate() - 90);
      break;
    default:
      startDate.setUTCDate(startDate.getUTCDate() - 30);
  }

  startDate.setUTCHours(0, 0, 0, 0);

  logger.debug(`Date range (UTC): ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`);

  return { startDate, endDate };
}

function buildDateSeries(startDate, endDate) {
  const dates = [];
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function mergeDailyMetrics(dateSeries, searchDaily, clickDaily) {
  const formatKey = (date) => date.toISOString().slice(0, 10);
  const dailyMap = new Map();

  dateSeries.forEach((date) => {
    const key = formatKey(date);
    dailyMap.set(key, {
      date: key,
      searches: 0,
      clicks: 0,
      clickThroughRate: 0,
    });
  });

  searchDaily.forEach((row) => {
    const key = typeof row.day === "string" ? row.day : formatKey(row.day);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.searches = Number(row.count) || 0;
    }
  });

  clickDaily.forEach((row) => {
    const key = typeof row.day === "string" ? row.day : formatKey(row.day);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.clicks = Number(row.count) || 0;
    }
  });

  dailyMap.forEach((entry) => {
    entry.clickThroughRate = entry.searches > 0
      ? Math.round(((entry.clicks / entry.searches) * 100) * 10) / 10
      : 0;
  });

  return Array.from(dailyMap.values());
}
