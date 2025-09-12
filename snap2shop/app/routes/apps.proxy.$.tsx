import { json } from "@remix-run/node";
import { unstable_parseMultipartFormData } from "@remix-run/node";
import { unstable_createMemoryUploadHandler } from "@remix-run/node";
import db from "../db.server";
import clipInference from "../services/clipInference.server";
import vectorDb from "../services/vectorDb.server";

export const action = async ({ request, params }) => {
  console.log('🔍 App proxy request received');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('Params:', params);
  
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check if this is the search-image endpoint
  if (!pathname.includes('search-image')) {
    return new Response('Not Found', { status: 404 });
  }
  
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
        // Create product handle from Shopify product ID
        const handle = `product-${productImage.product.shopifyProductId}`;
        
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