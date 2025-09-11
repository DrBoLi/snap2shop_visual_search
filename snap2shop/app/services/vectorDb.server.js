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

  async searchSimilar(queryEmbedding, shop, topK = 10, threshold = 0.5) {
    try {
      // Get all embeddings for the shop
      const allEmbeddings = await this.getAllEmbeddingsForShop(shop);
      
      if (allEmbeddings.length === 0) {
        return [];
      }

      // Calculate similarities
      const similarities = allEmbeddings.map(item => {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, item.embedding);
        
        return {
          imageId: item.imageId,
          productId: item.image.productId,
          product: item.product,
          similarity,
          image: item.image,
        };
      });

      // Filter by threshold and sort by similarity
      const filtered = similarities
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity);

      return filtered.slice(0, topK);
    } catch (error) {
      console.error('Error searching similar embeddings:', error);
      throw error;
    }
  }

  calculateCosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
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