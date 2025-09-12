// CLIPInferenceService.js
import { pipeline, RawImage, env } from '@xenova/transformers';
import sharp from 'sharp';
import axios from 'axios';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

env.allowLocalModels = false;
// Optional: tune WASM threads if using wasm backend
env.backends.onnx.wasm.numThreads = 1;

class CLIPInferenceService {
  constructor() {
    this.model = null;
    this.modelLoading = false;
    this.modelName = 'Xenova/clip-vit-base-patch16';
  }

  async initializeModel() {
    if (this.model) return;

    if (this.modelLoading) {
      while (this.modelLoading) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return;
    }

    this.modelLoading = true;
    try {
      console.log(`🔄 Loading CLIP model: ${this.modelName}`);
      // Use CLIP for feature extraction (vision encoder)
      this.model = await pipeline('image-feature-extraction', this.modelName);
      console.log('✅ CLIP model loaded successfully!');
    } catch (err) {
      console.error('❌ Failed to load CLIP model:', err);
      this.model = null;
      throw err;
    } finally {
      this.modelLoading = false;
    }
  }

  // -- Utilities -------------------------------------------------------------

  async _rawImageFromHttp(url) {
    // Let RawImage fetch & decode
    return RawImage.fromURL(url);
  }

  async _rawImageFromDataUrl(dataUrl) {
    // data:image/<type>;base64,<payload>
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUrl);
    if (!match) throw new Error('Invalid data URL');

    const base64 = match[2];
    const buf = Buffer.from(base64, 'base64');

    // Normalize to RGB JPEG to ensure compatibility
    const jpegBuf = await sharp(buf)
      .removeAlpha()
      .jpeg({ quality: 95 })
      .toBuffer();

    const tmpPath = path.join(os.tmpdir(), `clip-${crypto.randomUUID()}.jpg`);
    await fs.writeFile(tmpPath, jpegBuf);

    try {
      const raw = await RawImage.read(tmpPath);
      return raw;
    } finally {
      // best-effort cleanup
      fs.unlink(tmpPath).catch(() => {});
    }
  }

  // Optional: If you still want a Sharp-based pre-resize (not required for CLIP)
  async _rawImageFromHttpWithResize(url, size = 224) {
    const { data } = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'Visual-Search/1.0' },
    });

    const jpegBuf = await sharp(data)
      .resize(size, size, { fit: 'cover' })
      .removeAlpha()
      .jpeg({ quality: 95 })
      .toBuffer();

    const tmpPath = path.join(os.tmpdir(), `clip-${crypto.randomUUID()}.jpg`);
    await fs.writeFile(tmpPath, jpegBuf);

    try {
      return await RawImage.read(tmpPath);
    } finally {
      fs.unlink(tmpPath).catch(() => {});
    }
  }

  // -- Public API ------------------------------------------------------------

  async generateEmbedding(imageUrl) {
    try {
      await this.initializeModel();
      if (!this.model) throw new Error('CLIP model not available');

      let rawImage;
      if (imageUrl.startsWith('data:image/')) {
        // ✅ base64 data URL path
        rawImage = await this._rawImageFromDataUrl(imageUrl);
      } else if (imageUrl.startsWith('http')) {
        // ✅ http(s) URL path
        rawImage = await this._rawImageFromHttp(imageUrl);
        // If you prefer standardized size, swap to _rawImageFromHttpWithResize(imageUrl)
      } else {
        throw new Error('Unsupported image source');
      }

      // Run CLIP feature extraction with pooling + normalization
      const output = await this.model(rawImage, {
        pooling: 'mean',
        normalize: true,
      });

      const vector = Array.from(output.data || output);
      if (!vector.length) throw new Error('Empty embedding');

      console.log(`✅ Generated CLIP embedding (${vector.length} dims)`);
      console.log(`   First 8: [${vector.slice(0, 8).map(v => v.toFixed(4)).join(', ')}]`);

      return {
        embedding: vector,
        description: 'Real CLIP embedding (vision)',
        modelName: this.modelName,
      };
    } catch (err) {
      console.error('❌ Error generating CLIP embedding:', err.message);
      console.warn('⚠️ Falling back to pseudo-embedding');
      return this.generatePseudoEmbedding(imageUrl);
    }
  }

   // Keep pseudo-embedding for development/testing only
   async generatePseudoEmbedding(imageUrl) {
     console.warn('⚠️  Using pseudo-embedding - this should not happen in production!');
     
     // Always try to use enhanced pseudo-embeddings with actual image processing
     try {
       let imageBuffer;
       
       if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
         // Extract basic image features for better similarity
         const response = await axios.get(imageUrl, {
           responseType: 'arraybuffer',
           timeout: 30000,
           headers: {
             'User-Agent': 'Mozilla/5.0 (compatible; Visual-Search-Bot/1.0)',
           }
         });

         // Process image with Sharp - preserve aspect ratio
         imageBuffer = await sharp(response.data)
           .resize(224, 224, { 
             fit: 'inside', // Preserve aspect ratio, don't crop
             withoutEnlargement: true // Don't enlarge small images
           })
           .extend({
             top: 0,
             bottom: 0,
             left: 0,
             right: 0,
             background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
           })
           .removeAlpha()
           .jpeg({ quality: 90 })
           .toBuffer();
         
         // Use Sharp to get basic image statistics
         const { width, height, channels } = await sharp(imageBuffer).metadata();
         
         console.log(`🔧 Creating enhanced pseudo-embedding with image features: ${width}x${height}, ${channels} channels`);
         
         // Create an embedding based on actual image properties
         const embedding = [];
         const baseHash = this.simpleHash(imageUrl.substring(0, 100)); // Use part of URL for variation
         
         for (let i = 0; i < 512; i++) {
           // Mix in actual image properties for better pseudo-similarity
           const feature = (
             Math.sin(baseHash + i * (width || 224)) + 
             Math.cos(baseHash * 2 + i * (height || 224)) +
             Math.sin(i * (channels || 3)) +
             Math.cos(i * Math.sqrt(width * height || 50176)) // Include area
           ) / 4;
           embedding.push(feature);
         }

         console.log(`🔍 Pseudo-embedding first 10 values: [${embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}]`);
         console.log(`🔍 Pseudo-embedding range: min=${Math.min(...embedding).toFixed(4)}, max=${Math.max(...embedding).toFixed(4)}`);
         
         return {
           embedding,
           description: "Enhanced pseudo-embedding with image features",
           modelName: "pseudo-enhanced-dev"
         };
       }
     } catch (error) {
       console.warn('Could not process image for enhanced pseudo-embedding:', error.message);
     }
     
     // Fallback to simple hash-based embedding
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
