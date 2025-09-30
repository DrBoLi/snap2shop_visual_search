import db from '../db.server';

class VectorDatabaseService {
  constructor() {
    this.name = 'SQLite Vector Store';
  }

  async storeEmbedding(imageId, shop, embedding, modelName) {
    try {
      const embeddingJson = JSON.stringify(embedding);
      
      const result = await db.productEmbedding.upsert({
        where: { imageId },
        update: {
          embedding: embeddingJson,
          modelName,
        },
        create: {
          imageId,
          shop,
          embedding: embeddingJson,
          modelName,
        },
      });

      console.log(`Stored embedding for image ${imageId} with model ${modelName}`);
      return result;
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw error;
    }
  }

  async getEmbedding(imageId) {
    try {
      const result = await db.productEmbedding.findUnique({
        where: { imageId },
      });

      if (result) {
        return {
          ...result,
          embedding: JSON.parse(result.embedding),
        };
      }

      return null;
    } catch (error) {
      console.error('Error retrieving embedding:', error);
      throw error;
    }
  }

  async getAllEmbeddingsForShop(shop) {
    try {
      const embeddings = await db.productEmbedding.findMany({
        where: { shop },
        include: {
          image: {
            include: {
              product: true,
            },
          },
        },
      });

      return embeddings.map(embedding => ({
        ...embedding,
        embedding: JSON.parse(embedding.embedding),
        product: embedding.image.product,
      }));
    } catch (error) {
      console.error('Error retrieving shop embeddings:', error);
      throw error;
    }
  }

  async searchSimilar(shop, queryEmbedding, topK = 10, threshold = 0.0, options = {}) {
    try {
      const { hideOutOfStock = false } = options;
      // Get all embeddings for the shop
      const allEmbeddings = await this.getAllEmbeddingsForShop(shop);
      
      if (allEmbeddings.length === 0) {
        return [];
      }

      // Filter embeddings to ensure consistent dimensions
      const filteredEmbeddings = allEmbeddings.filter(item => {
        if (!item.embedding || item.embedding.length !== queryEmbedding.length) {
          console.warn(`⚠️ Skipping embedding with mismatched dimensions: ${item.embedding?.length} vs ${queryEmbedding.length} (model: ${item.modelName})`);
          return false;
        }
        return true;
      });

      console.log(`🔍 Filtered embeddings: ${filteredEmbeddings.length}/${allEmbeddings.length} (dimension: ${queryEmbedding.length})`);
      
      if (filteredEmbeddings.length === 0) {
        console.warn('⚠️ No embeddings with matching dimensions found!');
        return [];
      }

      // Calculate similarities
      const similarities = filteredEmbeddings.map((item, index) => {
        if (index === 0) {
          console.log('🔍 First stored embedding dimensions:', item.embedding.length);
          console.log('🔍 Query embedding dimensions:', queryEmbedding.length);
          console.log('🔍 First stored embedding model:', item.modelName);
          console.log('🔍 Similarity threshold:', threshold);
          console.log('🔍 Total embeddings to compare:', filteredEmbeddings.length);
          
          // Log query embedding details
          console.log(`🔍 Query embedding first 10 values: [${queryEmbedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}]`);
          console.log(`🔍 Query embedding range: min=${Math.min(...queryEmbedding).toFixed(4)}, max=${Math.max(...queryEmbedding).toFixed(4)}`);
        }
        
        const similarity = this.calculateCosineSimilarity(queryEmbedding, item.embedding);
        
        // Log top 5 similarity scores for debugging
        if (index < 5) {
          console.log(`🔍 Item ${index + 1}: similarity=${similarity != null ? similarity.toFixed(4) : 'null'}, product="${item.image?.product?.title?.substring(0, 30)}"`);
          
          // Log first few values of stored embedding for comparison
          if (index < 3) {
            console.log(`🔍   Stored embedding first 10 values: [${item.embedding.slice(0, 10).map(v => v != null ? v.toFixed(4) : 'null').join(', ')}]`);
            const minVal = Math.min(...item.embedding);
            const maxVal = Math.max(...item.embedding);
            console.log(`🔍   Stored embedding range: min=${minVal != null ? minVal.toFixed(4) : 'null'}, max=${maxVal != null ? maxVal.toFixed(4) : 'null'}`);
            
            // Validate embedding model consistency
            if (item.modelName && item.modelName.includes('pseudo')) {
              console.warn(`⚠️  WARNING: Found pseudo-embedding in database! Model: ${item.modelName}`);
            }
          }
        }
        
        return {
          imageId: item.imageId,
          productId: item.image.productId,
          product: item.product,
          similarity,
          image: item.image,
        };
      });

      // Log similarity distribution for monitoring
      const similaritiesArray = similarities.map(s => s.similarity).filter(s => s != null);
      if (similaritiesArray.length > 0) {
        const avgSimilarity = similaritiesArray.reduce((a, b) => a + b, 0) / similaritiesArray.length;
        const maxSimilarity = Math.max(...similaritiesArray);
        const minSimilarity = Math.min(...similaritiesArray);
        
        console.log(`🔍 Similarity distribution: avg=${avgSimilarity.toFixed(4)}, min=${minSimilarity.toFixed(4)}, max=${maxSimilarity.toFixed(4)}`);
        console.log(`🔍 Similarities above 0.1: ${similaritiesArray.filter(s => s > 0.1).length}`);
        console.log(`🔍 Similarities above 0.2: ${similaritiesArray.filter(s => s > 0.2).length}`);
        console.log(`🔍 Similarities above 0.3: ${similaritiesArray.filter(s => s > 0.3).length}`);
      } else {
        console.log('🔍 No valid similarities calculated!');
      }

      // Filter by threshold and sort by similarity
      let filtered = similarities
        .filter(item => item.similarity != null && item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity);

      if (hideOutOfStock) {
        const beforeCount = filtered.length;
        filtered = filtered.filter((item) => {
          const product = item.product || item.image?.product;
          if (!product) return true;

          const available = product.availableForSale !== false;
          const inventory = typeof product.totalInventory === "number" ? product.totalInventory : null;

          if (!available) {
            return false;
          }

          if (inventory !== null) {
            return inventory > 0;
          }

          return true;
        });

        if (beforeCount !== filtered.length) {
          console.log(`🔍 Hide out-of-stock enabled: filtered ${beforeCount - filtered.length} items`);
        }
      }

      console.log(`🔍 After filtering (threshold=${threshold}): ${filtered.length}/${similarities.length} items`);
      console.log('🔍 Top 3 filtered similarities:');
      filtered.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.similarity != null ? item.similarity.toFixed(4) : 'null'} - ${item.product?.title?.substring(0, 30)}`);
      });

      // Smart fallback logic when threshold filters out all results
      if (filtered.length === 0 && threshold > 0.1) {
        console.log(`🔄 No results found with threshold ${threshold}, trying progressive fallback...`);

        // Try with half the threshold
        const halfThreshold = threshold / 2;
        const halfFiltered = similarities
          .filter(item => item.similarity != null && item.similarity >= halfThreshold)
          .sort((a, b) => b.similarity - a.similarity);

        if (halfFiltered.length > 0) {
          console.log(`✅ Fallback successful: found ${halfFiltered.length} results with threshold ${halfThreshold.toFixed(2)}`);
          filtered = hideOutOfStock ? this.applyOutOfStockFilter(halfFiltered) : halfFiltered;
          return filtered.slice(0, topK);
        }

        // Try with very permissive threshold (0.1)
        const permissiveFiltered = similarities
          .filter(item => item.similarity != null && item.similarity >= 0.1)
          .sort((a, b) => b.similarity - a.similarity);

        if (permissiveFiltered.length > 0) {
          console.log(`✅ Permissive fallback successful: found ${permissiveFiltered.length} results with threshold 0.1`);
          filtered = hideOutOfStock ? this.applyOutOfStockFilter(permissiveFiltered) : permissiveFiltered;
          return filtered.slice(0, topK);
        }

        console.log('⚠️ No results found even with permissive fallback');
      }

      return filtered.slice(0, topK);
    } catch (error) {
      console.error('Error searching similar embeddings:', error);
      throw error;
    }
  }

  applyOutOfStockFilter(items) {
    return items.filter((item) => {
      const product = item.product || item.image?.product;
      if (!product) return true;

      const available = product.availableForSale !== false;
      const inventory = typeof product.totalInventory === "number" ? product.totalInventory : null;

      if (!available) {
        return false;
      }

      if (inventory !== null) {
        return inventory > 0;
      }

      return true;
    });
  }

  calculateCosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      console.warn('⚠️ Invalid vectors for similarity calculation', { vec1Length: vec1?.length, vec2Length: vec2?.length });
      return 0; // Return 0 instead of throwing error
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      const v1 = vec1[i] || 0; // Handle null/undefined values
      const v2 = vec2[i] || 0;
      
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0 || !isFinite(norm1) || !isFinite(norm2)) {
      return 0;
    }

    const similarity = dotProduct / (norm1 * norm2);
    return isFinite(similarity) ? similarity : 0;
  }

  async deleteEmbeddingsForShop(shop) {
    try {
      const result = await db.productEmbedding.deleteMany({
        where: { shop },
      });

      console.log(`Deleted ${result.count} embeddings for shop ${shop}`);
      return result;
    } catch (error) {
      console.error('Error deleting embeddings:', error);
      throw error;
    }
  }

  async getEmbeddingStats(shop) {
    try {
      const count = await db.productEmbedding.count({
        where: { shop },
      });

      const recentEmbeddings = await db.productEmbedding.findMany({
        where: { shop },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          image: {
            include: {
              product: true,
            },
          },
        },
      });

      return {
        totalEmbeddings: count,
        recentEmbeddings: recentEmbeddings.map(emb => ({
          id: emb.id,
          productTitle: emb.image.product.title,
          createdAt: emb.createdAt,
          modelName: emb.modelName,
        })),
      };
    } catch (error) {
      console.error('Error getting embedding stats:', error);
      throw error;
    }
  }
}

export default new VectorDatabaseService();
