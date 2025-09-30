import db from "../db.server.js";

export const DEFAULT_VISUAL_SEARCH_SETTINGS = {
  hideOutOfStock: false,
  similarityThreshold: 0.4,
};

export async function getVisualSearchSettings(shop) {
  if (!shop) {
    throw new Error("Shop is required to load visual search settings");
  }

  const record = await db.visualSearchSettings.findUnique({
    where: { shop },
  });

  if (!record) {
    return { ...DEFAULT_VISUAL_SEARCH_SETTINGS };
  }

  return {
    hideOutOfStock:
      typeof record.hideOutOfStock === "boolean"
        ? record.hideOutOfStock
        : DEFAULT_VISUAL_SEARCH_SETTINGS.hideOutOfStock,
    similarityThreshold:
      typeof record.similarityThreshold === "number"
        ? record.similarityThreshold
        : DEFAULT_VISUAL_SEARCH_SETTINGS.similarityThreshold,
  };
}

export async function upsertVisualSearchSettings(shop, settings) {
  if (!shop) {
    throw new Error("Shop is required to update visual search settings");
  }

  const data = {
    hideOutOfStock:
      typeof settings.hideOutOfStock === "boolean"
        ? settings.hideOutOfStock
        : DEFAULT_VISUAL_SEARCH_SETTINGS.hideOutOfStock,
    similarityThreshold:
      typeof settings.similarityThreshold === "number"
        ? settings.similarityThreshold
        : DEFAULT_VISUAL_SEARCH_SETTINGS.similarityThreshold,
  };

  await db.visualSearchSettings.upsert({
    where: { shop },
    update: data,
    create: {
      shop,
      ...data,
    },
  });

  return getVisualSearchSettings(shop);
}