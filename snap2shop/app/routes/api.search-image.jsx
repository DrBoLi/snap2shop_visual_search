import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import clipInference from "../services/clipInference.server";
import vectorDb from "../services/vectorDb.server";
import imageProcessing from "../services/imageProcessing.server";
import db from "../db.server.js";
import { getVisualSearchSettings } from "../services/visualSearchSettings.server.js";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const imageUrl = formData.get("imageUrl");
    const topK = parseInt(formData.get("topK") || "10");
    // Remove threshold from request - we'll use settings instead
    // const threshold = parseFloat(formData.get("threshold") || "0.5");

    let queryEmbedding;
    let imageMetadata = null;

    if (imageFile && imageFile.size > 0) {
      // Handle uploaded file
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      
      // Process the image
      const processedImage = await imageProcessing.processImageForML(imageBuffer);
      imageMetadata = await imageProcessing.getImageMetadata(imageBuffer);
      
      // Convert buffer to base64 URL for ML processing
      const base64Image = `data:image/jpeg;base64,${processedImage.toString('base64')}`;
      
      // Generate embedding using CLIP
      const result = await clipInference.generateEmbedding(base64Image);
      queryEmbedding = result.embedding;

    } else if (imageUrl) {
      // Handle image URL
      const validation = await imageProcessing.validateImageUrl(imageUrl);
      if (!validation.isValid) {
        return json({ 
          error: `Invalid image URL: ${validation.error}` 
        }, { status: 400 });
      }

      // Generate embedding from URL using CLIP
      const result = await clipInference.generateEmbedding(imageUrl);
      queryEmbedding = result.embedding;

      // Get image metadata
      try {
        const imageBuffer = await imageProcessing.downloadImage(imageUrl);
        imageMetadata = await imageProcessing.getImageMetadata(imageBuffer);
      } catch (error) {
        console.warn('Could not get image metadata:', error.message);
      }

    } else {
      return json({ 
        error: "No image provided. Include either 'image' file or 'imageUrl' parameter." 
      }, { status: 400 });
    }

    // Load settings and use the similarity threshold from settings
    const settings = await getVisualSearchSettings(shop);
    const threshold = settings.similarityThreshold;
    
    console.log(`🔍 Using similarity threshold from settings: ${threshold}`);

    // Search for similar images using settings threshold
    const similarImages = await vectorDb.searchSimilar(
      shop,
      queryEmbedding,
      topK,
      threshold, // Use settings threshold instead of request parameter
      {
        hideOutOfStock: settings.hideOutOfStock,
      }
    );

    // Format results
    const results = similarImages.map(item => ({
      productId: item.productId,
      imageId: item.imageId,
      similarity: item.similarity,
      product: {
        id: item.product.id,
        shopifyProductId: item.product.shopifyProductId,
        handle: item.product.handle,
        title: item.product.title,
        description: item.product.description,
        price: item.product.price,
        tags: item.product.tags,
      },
      image: {
        id: item.image.id,
        url: item.image.imageUrl,
        altText: item.image.altText,
        width: item.image.width,
        height: item.image.height,
      },
    }));

    // Get search statistics
    const stats = await vectorDb.getEmbeddingStats(shop);

    // Track analytics - Create search event
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await db.visualSearchEvent.create({
        data: {
          shop,
          sessionId: `session_${Date.now()}`,
          eventType: 'image_search',
          searchId,
          queryData: {
            fileSize: imageFile?.size || 0,
            fileType: imageFile?.type || 'image/url',
            resultCount: results.length,
            topK,
            threshold: threshold, // Use settings threshold
            similarityThreshold: settings.similarityThreshold,
            hideOutOfStock: settings.hideOutOfStock
          },
          results: results.map((r, index) => ({
            productId: r.productId,
            similarity: r.similarity,
            position: index + 1
          })),
          userAgent: request.headers.get("user-agent"),
          ipAddress: getClientIP(request),
        }
      });
      
      console.log(`✅ Analytics tracked: Search event created for shop ${shop} with threshold ${threshold}`);
    } catch (analyticsError) {
      console.error('❌ Analytics tracking failed:', analyticsError);
      // Don't fail the search if analytics fails
    }

    return json({
      success: true,
      results,
      searchId, // Include searchId for click tracking
      metadata: {
        queryImage: imageMetadata,
        totalResults: results.length,
        searchParams: { 
          topK, 
          threshold: threshold, // Use settings threshold
          similarityThreshold: settings.similarityThreshold,
          hideOutOfStock: settings.hideOutOfStock
        },
        stats,
      },
    });

  } catch (error) {
    console.error("Error in image search:", error);
    
    let errorMessage = "An error occurred during image search";
    let statusCode = 500;

    if (error.message.includes('Invalid image')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('No embeddings found')) {
      errorMessage = "No products have been synced yet. Please sync your products first.";
      statusCode = 404;
    } else if (error.message.includes('API key')) {
      errorMessage = "ML service configuration error. Please check your API keys.";
      statusCode = 503;
    }

    return json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
};

// Also support GET for testing with URL parameters
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('imageUrl');
  
  if (!imageUrl) {
    return json({ 
      error: "Missing imageUrl parameter" 
    }, { status: 400 });
  }

  // Convert to FormData to reuse the POST logic
  const formData = new FormData();
  formData.append('imageUrl', imageUrl);
  formData.append('topK', url.searchParams.get('topK') || '10');
  // Remove threshold parameter - will use settings instead
  // formData.append('threshold', url.searchParams.get('threshold') || '0.5');

  // Create a new request with POST method and form data
  const newRequest = new Request(request.url, {
    method: 'POST',
    body: formData,
    headers: request.headers,
  });

  return action({ request: newRequest });
};

// Helper function to get client IP
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}