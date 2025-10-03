import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import clipInference from "../services/clipInference.server";
import vectorDb from "../services/vectorDb.server";
import logger from "../utils/logger.js";

const PRODUCTS_QUERY = `
  query getProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          handle
          title
          description
          tags
          status
          totalInventory
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const method = request.method;

  if (method === "DELETE") {
    return handleDelete(shop);
  }

  if (method === "POST") {
    return handleSync(shop, admin);
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};

async function handleDelete(shop) {
  try {
    // Delete embeddings first (will cascade with images)
    await vectorDb.deleteEmbeddingsForShop(shop);

    // Delete all products and related images for this shop
    await db.product.deleteMany({
      where: { shop },
    });

    // Reset sync status
    await db.syncStatus.upsert({
      where: { shop },
      update: {
        status: "idle",
        progress: 0,
        totalItems: 0,
        lastSync: null,
        errorMessage: null,
      },
      create: {
        shop,
        status: "idle",
        progress: 0,
        totalItems: 0,
      },
    });

    logger.info(`Deleted all product data and embeddings for shop: ${shop}`);
    return json({ success: true, message: "All product data deleted" });
  } catch (error) {
    logger.error("Error deleting products:", error);
    return json(
      { error: "Failed to delete product data" },
      { status: 500 }
    );
  }
}

async function handleSync(shop, admin) {
  try {
    // Update sync status to syncing
    await db.syncStatus.upsert({
      where: { shop },
      update: {
        status: "syncing",
        progress: 0,
        errorMessage: null,
      },
      create: {
        shop,
        status: "syncing",
        progress: 0,
        totalItems: 0,
      },
    });

    // Start the sync process
    syncProductsBackground(shop, admin);

    return json({ success: true, message: "Sync started" });
  } catch (error) {
    logger.error("Error starting sync:", error);
    
    // Update sync status to error
    await db.syncStatus.upsert({
      where: { shop },
      update: {
        status: "error",
        errorMessage: error.message,
      },
      create: {
        shop,
        status: "error",
        errorMessage: error.message,
      },
    });

    return json(
      { error: "Failed to start sync" },
      { status: 500 }
    );
  }
}

async function syncProductsBackground(shop, admin) {
  try {
    let cursor = null;
    let totalProcessed = 0;
    let allProducts = [];

    // First, get total count for progress tracking
    const initialResponse = await admin.graphql(PRODUCTS_QUERY, {
      variables: { first: 50, after: cursor },
    });
    
    const initialData = await initialResponse.json();
    
    // Fetch all products first to get accurate total count
    do {
      const response = await admin.graphql(PRODUCTS_QUERY, {
        variables: { first: 50, after: cursor },
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
      }

      const products = data.data.products.edges;
      allProducts = [...allProducts, ...products];
      
      cursor = products.length > 0 ? products[products.length - 1].cursor : null;
    } while (initialData.data.products.pageInfo.hasNextPage && cursor);

    const totalProducts = allProducts.length;

    // Update total count
    await db.syncStatus.update({
      where: { shop },
      data: { totalItems: totalProducts },
    });

    const fetchedProductIds = new Set();

    // Process each product
    for (const productEdge of allProducts) {
      const product = productEdge.node;
      
      // Extract Shopify product ID (remove gid://shopify/Product/ prefix)
      const shopifyProductId = product.id.split("/").pop();
      fetchedProductIds.add(shopifyProductId);
      
      // Create or update product
      const dbProduct = await db.product.upsert({
        where: {
          shopifyProductId_shop: {
            shopifyProductId,
            shop,
          },
        },
        update: {
          handle: product.handle,
          title: product.title,
          description: product.description || null,
          tags: product.tags.join(",") || null,
          price: product.priceRangeV2?.minVariantPrice?.amount || null,
          availableForSale: product.status === "ACTIVE",
          totalInventory: product.totalInventory ?? null,
        },
        create: {
          shopifyProductId,
          shop,
          handle: product.handle,
          title: product.title,
          description: product.description || null,
          tags: product.tags.join(",") || null,
          price: product.priceRangeV2?.minVariantPrice?.amount || null,
          availableForSale: product.status === "ACTIVE",
          totalInventory: product.totalInventory ?? null,
        },
      });

      // Delete existing images for this product
      await db.productImage.deleteMany({
        where: { productId: dbProduct.id },
      });

      // Create new images and generate embeddings
      for (const imageEdge of product.images.edges) {
        const image = imageEdge.node;
        
        const dbImage = await db.productImage.create({
          data: {
            productId: dbProduct.id,
            shop,
            imageUrl: image.url,
            altText: image.altText || null,
            width: image.width || null,
            height: image.height || null,
          },
        });

        // Generate embedding for the image using CLIP
        try {
          logger.debug(`Generating CLIP embedding for image: ${image.url}`);
          const embeddingResult = await clipInference.generateEmbedding(image.url);
          
          await vectorDb.storeEmbedding(
            dbImage.id,
            shop,
            embeddingResult.embedding,
            embeddingResult.modelName
          );
          
          logger.debug(`Generated and stored CLIP embedding for image ${dbImage.id}`);
        } catch (embeddingError) {
          logger.error(`Failed to generate embedding for image ${image.url}:`, embeddingError);
          // Continue with other images even if one fails
        }
      }

      totalProcessed++;

      // Update progress
      await db.syncStatus.update({
        where: { shop },
        data: {
          progress: totalProcessed,
        },
      });
    }

    // Remove products that no longer exist in Shopify
    try {
      const removed = await db.product.deleteMany({
        where: {
          shop,
          shopifyProductId: { notIn: Array.from(fetchedProductIds) },
        },
      });

      if (removed.count > 0) {
        logger.info(`Removed ${removed.count} stale products for shop ${shop}`);
      }
    } catch (cleanupError) {
      logger.warn('Failed to remove stale products after sync:', cleanupError);
    }

    // Mark sync as completed
    await db.syncStatus.update({
      where: { shop },
      data: {
        status: "completed",
        lastSync: new Date(),
        errorMessage: null,
      },
    });

  } catch (error) {
    logger.error("Background sync error:", error);
    
    // Update sync status to error
    await db.syncStatus.update({
      where: { shop },
      data: {
        status: "error",
        errorMessage: error.message,
      },
    });
  }
}
