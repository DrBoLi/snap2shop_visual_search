import { json } from "@remix-run/node";
import { unstable_parseMultipartFormData } from "@remix-run/node";
import { unstable_createMemoryUploadHandler } from "@remix-run/node";
import db from "../db.server";
import clipInference from "../services/clipInference.server";
import vectorDb from "../services/vectorDb.server";
import analyticsAggregation from "../services/analyticsAggregation.server";

export const action = async ({ request, params }) => {
  console.log('🔍 App proxy request received');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('Params:', params);
  
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Route to appropriate handler based on path
  if (pathname.includes('analytics/track')) {
    return handleAnalyticsTracking(request);
  } else if (pathname.includes('analytics/search')) {
    return handleSearchTracking(request);
  } else if (pathname.includes('analytics/click')) {
    return handleClickTracking(request);
  } else if (pathname.includes('search-image')) {
    return handleImageSearch(request);
  } else {
    return new Response('Not Found', { status: 404 });
  }
};

// Handle analytics tracking
async function handleAnalyticsTracking(request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {
    const { eventType, data, sessionId, shop } = await request.json();

    if (!shop) {
      return json({ error: "Shop domain is required" }, { status: 400, headers });
    }

    // Check rate limit
    if (!analyticsAggregation.checkRateLimit(shop, eventType)) {
      return json({ error: "Rate limit exceeded" }, { status: 429, headers });
    }

    // Sanitize and validate data
    const sanitizedData = sanitizeAnalyticsData(data);

    const providedSearchId = data?.searchId;
    const searchId = providedSearchId || (eventType.includes('search')
      ? analyticsAggregation.generateSearchId()
      : `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`);

    // Store in database
    await db.visualSearchEvent.create({
      data: {
        shop,
        sessionId,
        eventType,
        searchId,
        queryData: sanitizedData,
        userAgent: request.headers.get("user-agent"),
        ipAddress: analyticsAggregation.getClientIP(request),
      }
    });

    // Optional: Send to external analytics (Segment, etc.)
    if (process.env.SEGMENT_WRITE_KEY) {
      await sendToSegment(shop, eventType, sanitizedData);
    }

    return json({ success: true, searchId }, { headers });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return json({ error: "Failed to track event" }, { status: 500, headers });
  }
}

// Handle search tracking
async function handleSearchTracking(request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {
    const { shop, queryData, results, sessionId } = await request.json();
    
    if (!shop) {
      return json({ error: "Shop domain is required" }, { status: 400, headers });
    }

    const searchId = analyticsAggregation.generateSearchId();

    // Store search event
    await db.visualSearchEvent.create({
      data: {
        shop,
        sessionId,
        eventType: 'image_search',
        searchId,
        queryData: {
          ...queryData,
          resultCount: results?.length || 0
        },
        results: results ? results.map(r => ({
          productId: r.id,
          similarity: r.similarity,
          position: results.indexOf(r) + 1
        })) : null,
        userAgent: request.headers.get("user-agent"),
        ipAddress: analyticsAggregation.getClientIP(request),
      }
    });

    return json({ success: true, searchId }, { headers });
  } catch (error) {
    console.error('Search tracking error:', error);
    return json({ error: "Failed to track search" }, { status: 500, headers });
  }
}

// Handle click tracking
async function handleClickTracking(request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {
    const { shop, searchId, productId, position, similarity, clickType, sessionId } = await request.json();
    
    if (!shop || !productId) {
      return json({ error: "Shop and productId are required" }, { status: 400, headers });
    }

    // Store click event
    await db.searchResultClick.create({
      data: {
        shop,
        searchId,
        sessionId,
        productId,
        position: position || 1,
        similarity: similarity || null,
        clickType: clickType || 'search_result',
      }
    });

    // Update popular content
    await updatePopularContent(shop, 'product', productId, productId);

    return json({ success: true }, { headers });
  } catch (error) {
    console.error('Click tracking error:', error);
    return json({ error: "Failed to track click" }, { status: 500, headers });
  }
}

// Handle image search (existing functionality)
async function handleImageSearch(request) {
  console.log('🔍 App proxy request received');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  
  // CORS headers for theme extension requests
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    console.log('✅ Handling OPTIONS preflight request');
    return new Response(null, { status: 200, headers });
  }

  try {
    // Parse multipart form data first to get shop from form
    const uploadHandler = unstable_createMemoryUploadHandler({
      maxPartSize: 10 * 1024 * 1024, // 10MB
    });

    const formData = await unstable_parseMultipartFormData(
      request,
      uploadHandler
    );
    
    // Extract shop domain from form data, URL params, or headers
    const shop = formData.get('shop') || 
                 url.searchParams.get('shop') || 
                 request.headers.get('x-shopify-shop-domain');
    
    console.log('Shop domain found:', shop);
    
    if (!shop) {
      console.error('❌ No shop domain provided');
      return json(
        { error: "Shop domain is required" },
        { status: 400, headers }
      );
    }

    const imageFile = formData.get("image");
    const maxResults = parseInt(formData.get("maxResults")) || 12;
    
    console.log('Image file received:', !!imageFile);
    console.log('Max results:', maxResults);

    if (!imageFile || typeof imageFile === "string") {
      console.error('❌ No valid image file provided');
      return json(
        { error: "No image file provided" },
        { status: 400, headers }
      );
    }

    // Convert File to Buffer for processing
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    console.log('📷 Image processed, size:', imageBuffer.length, 'bytes');
    
    // Create a temporary URL for the image (in memory)
    const tempImageUrl = `data:${imageFile.type};base64,${imageBuffer.toString('base64')}`;

    // Generate embedding for the uploaded image
    console.log('🧠 Generating embedding for uploaded image...');
    let queryEmbedding;
    try {
      queryEmbedding = await clipInference.generateEmbedding(tempImageUrl);
      console.log('✅ Embedding generated successfully, dimensions:', queryEmbedding.embedding?.length);
      console.log('✅ Query embedding model:', queryEmbedding.modelName);
    } catch (embeddingError) {
      console.error('❌ CLIP embedding generation failed:', embeddingError);
      return json(
        { 
          error: "Failed to generate embedding for image",
          details: embeddingError.message
        },
        { status: 500, headers }
      );
    }

    // Search for similar embeddings in vector database
    console.log('🔍 Searching for similar embeddings...');
    console.log('Query embedding dimensions:', queryEmbedding.embedding.length);
    console.log('Shop for search:', shop);
    
    const similarEmbeddings = await vectorDb.searchSimilar(
      shop,
      queryEmbedding.embedding,
      maxResults + 5, // Get a few extra in case some products are unavailable
      0.0 // Very low threshold to get more results
    );

    console.log(`Found ${similarEmbeddings.length} similar embeddings`);
    
    if (similarEmbeddings.length === 0) {
      console.warn('⚠️ No similar embeddings found - possible causes:');
      console.warn('1. Shop domain mismatch');
      console.warn('2. Similarity threshold too high');
      console.warn('3. No embeddings exist for this shop');
      
      // Let's check what shops exist in the database
      const allShops = await db.product.findMany({
        select: { shop: true },
        distinct: ['shop']
      });
      console.log('Available shops in database:', allShops.map(s => s.shop));
      
      return json(
        { results: [], debug: { searchShop: shop, availableShops: allShops.map(s => s.shop) } },
        { headers }
      );
    }

    // Fetch product details from database
    const imageIds = similarEmbeddings.map(item => item.imageId);
    
    const productImages = await db.productImage.findMany({
      where: {
        id: { in: imageIds },
        shop: shop
      },
      include: {
        product: {
          select: {
            shopifyProductId: true,
            handle: true,
            title: true,
            price: true,
            description: true
          }
        }
      }
    });

    // Build results with similarity scores
    const results = [];
    for (const embedding of similarEmbeddings) {
      const productImage = productImages.find(img => img.id === embedding.imageId);
      if (productImage && results.length < maxResults) {
        // Use actual product handle from database, or fallback to ID-based handle
        const handle = productImage.product.handle || `product-${productImage.product.shopifyProductId}`;

        results.push({
          id: productImage.product.shopifyProductId,
          title: productImage.product.title,
          handle: handle,
          price: productImage.product.price,
          image_url: productImage.imageUrl,
          similarity: embedding.similarity,
          description: productImage.product.description
        });
      }
    }

    console.log(`Found ${results.length} similar products for shop: ${shop}`);

    return json(
      { 
        results,
        query_embedding_model: queryEmbedding.modelName
      },
      { headers }
    );

  } catch (error) {
    console.error("❌ Visual search error:", error);
    console.error("Error stack:", error.stack);
    
    return json(
      { 
        error: "Search failed. Please try again.",
        details: error.message
      },
      { status: 500, headers }
    );
  }
};

// Handle GET requests and preflight
export const loader = async ({ request, params }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
  };

  return new Response(null, { status: 200, headers });
};

// Helper functions
function sanitizeAnalyticsData(data) {
  if (!data || typeof data !== 'object') return {};
  
  // Remove sensitive information and limit size
  const sanitized = { ...data };
  
  // Remove potential PII
  delete sanitized.email;
  delete sanitized.phone;
  delete sanitized.address;
  
  // Limit string lengths
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + '...';
    }
  });
  
  return sanitized;
}

async function sendToSegment(shop, eventType, data) {
  // Placeholder for Segment integration
  // This would send data to Segment or other analytics providers
  console.log('Would send to Segment:', { shop, eventType, data });
}

async function updatePopularContent(shop, contentType, contentId, contentName) {
  try {
    await db.popularContent.upsert({
      where: {
        shop_contentType_contentId: {
          shop,
          contentType,
          contentId
        }
      },
      update: {
        clickCount: { increment: 1 },
        lastUsed: new Date()
      },
      create: {
        shop,
        contentType,
        contentId,
        contentName,
        clickCount: 1,
        lastUsed: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating popular content:', error);
  }
}
