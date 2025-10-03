import OpenAI from 'openai';
import sharp from 'sharp';
import axios from 'axios';
import logger from '../utils/logger.js';

class MLInferenceService {
  constructor() {
    this.hasOpenAI = !!process.env.OPENAI_API_KEY;
    
    if (this.hasOpenAI) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      logger.warn('OpenAI API key not found. Using pseudo-embeddings for development.');
      this.openai = null;
    }
  }

  async downloadAndProcessImage(imageUrl) {
    try {
      logger.debug(`Downloading image from: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });

      // Process image with Sharp to ensure proper format
      const processedImage = await sharp(response.data)
        .resize(224, 224, { fit: 'cover' }) // Resize for CLIP model
        .jpeg({ quality: 90 })
        .toBuffer();

      return processedImage;
    } catch (error) {
      logger.error('Error downloading/processing image:', error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  async generateEmbedding(imageUrl) {
    // Use pseudo-embeddings if OpenAI is not available
    if (!this.hasOpenAI || !this.openai) {
      logger.debug('Using pseudo-embedding for development...');
      return this.generatePseudoEmbedding(imageUrl);
    }

    try {
      // For now, we'll use OpenAI's vision capabilities
      // In production, you might want to use a dedicated CLIP service
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate a semantic description of this image for visual search. Focus on key visual features, colors, objects, style, and attributes that would help match similar products."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "low" // Use low detail to save costs
                }
              }
            ]
          }
        ],
        max_tokens: 300,
      });

      const description = response.choices[0].message.content;
      
      // Convert text description to embedding using text-embedding model
      const embeddingResponse = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: description,
        encoding_format: "float",
      });

      const embedding = embeddingResponse.data[0].embedding;
      
      logger.debug(`Generated embedding for image: ${imageUrl.substring(0, 50)}...`);
      logger.debug(`Description: ${description.substring(0, 100)}...`);
      
      return {
        embedding,
        description,
        modelName: "gpt-4-vision + text-embedding-3-small"
      };
    } catch (error) {
      logger.error('Error generating embedding:', error.message);
      
      // Fallback: generate a simple hash-based pseudo-embedding for development
      if (error.message.includes('API key') || error.message.includes('quota')) {
        logger.debug('Falling back to pseudo-embedding for development...');
        return this.generatePseudoEmbedding(imageUrl);
      }
      
      throw error;
    }
  }

  generatePseudoEmbedding(imageUrl) {
    // Generate a deterministic pseudo-embedding based on URL
    // This is for development/testing only - not suitable for production
    const hash = this.simpleHash(imageUrl);
    const embedding = [];
    
    // Create a 512-dimensional vector
    for (let i = 0; i < 512; i++) {
      embedding.push((Math.sin(hash + i) + Math.cos(hash * 2 + i)) / 2);
    }

    return {
      embedding,
      description: "Pseudo-embedding for development",
      modelName: "pseudo-hash-dev"
    };
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  calculateSimilarity(embedding1, embedding2) {
    // Calculate cosine similarity
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  findSimilarEmbeddings(queryEmbedding, candidateEmbeddings, topK = 10) {
    const similarities = candidateEmbeddings.map((candidate, index) => ({
      index,
      imageId: candidate.imageId,
      productId: candidate.productId,
      similarity: this.calculateSimilarity(queryEmbedding, candidate.embedding),
    }));

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }
}

export default new MLInferenceService();
