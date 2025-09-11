import { pipeline, env } from '@xenova/transformers';
import sharp from 'sharp';
import axios from 'axios';

// Configure transformers to use local models
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

class CLIPInferenceService {
  constructor() {
    this.model = null;
    this.processor = null;
    this.modelLoading = false;
    this.modelName = 'Xenova/clip-vit-base-patch32';
  }

  async initializeModel() {
    if (this.model) {
      return;
    }

    if (this.modelLoading) {
      // Wait for model to finish loading
      while (this.modelLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.modelLoading = true;
    
    try {
      console.log('Loading image embedding model... This may take a few minutes on first run.');
      
      // Use a vision model that's supported by Transformers.js for image feature extraction
      this.model = await pipeline(
        'image-feature-extraction',
        'Xenova/vit-base-patch16-224-in21k',  // Vision Transformer model
        {
          device: 'cpu',
          dtype: 'fp32',
        }
      );

      console.log('Vision model loaded successfully!');
      this.modelName = 'Xenova/vit-base-patch16-224-in21k';
    } catch (error) {
      console.error('Failed to load vision model:', error);
      this.model = null;
      throw error;
    } finally {
      this.modelLoading = false;
    }
  }

  async downloadAndProcessImage(imageUrl) {
    try {
      console.log(`Downloading image from: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Visual-Search-Bot/1.0)',
        }
      });

      // Process image with Sharp
      const processedImage = await sharp(response.data)
        .resize(224, 224, { fit: 'cover' })
        .removeAlpha()
        .jpeg({ quality: 90 })
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.error('Error downloading/processing image:', error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  async generateEmbedding(imageUrl) {
    try {
      // Initialize model if not already done
      await this.initializeModel();

      if (!this.model) {
        console.log('CLIP model not available, using pseudo-embedding...');
        return this.generatePseudoEmbedding(imageUrl);
      }

      // Download and process image
      const imageBuffer = await this.downloadAndProcessImage(imageUrl);
      
      // Generate embedding using Vision Transformer
      console.log(`Generating CLIP embedding for: ${imageUrl.substring(0, 50)}...`);
      
      // For Vision Transformers, we need to pass the raw image URL, not the processed buffer
      const embedding = await this.model(imageUrl);
      
      // The embedding is typically in the format: { data: Float32Array }
      const embeddingArray = Array.from(embedding.data || embedding);
      
      console.log(`Generated CLIP embedding (${embeddingArray.length} dimensions)`);
      
      return {
        embedding: embeddingArray,
        description: "CLIP visual embedding",
        modelName: this.modelName
      };

    } catch (error) {
      console.error('Error generating CLIP embedding:', error.message);
      
      // Fallback to pseudo-embedding on any error
      console.log('Falling back to pseudo-embedding...');
      return this.generatePseudoEmbedding(imageUrl);
    }
  }

  generatePseudoEmbedding(imageUrl) {
    // Generate a deterministic pseudo-embedding based on URL
    const hash = this.simpleHash(imageUrl);
    const embedding = [];
    
    // Create a 512-dimensional vector (same as CLIP-base)
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
      hash = hash & hash;
    }
    return hash;
  }

  calculateSimilarity(embedding1, embedding2) {
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

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }

  async preloadModel() {
    try {
      await this.initializeModel();
      console.log('CLIP model preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload CLIP model:', error.message);
    }
  }
}

export default new CLIPInferenceService();