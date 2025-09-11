import sharp from 'sharp';
import axios from 'axios';
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

class ImageProcessingService {
  constructor() {
    this.maxImageSize = 5 * 1024 * 1024; // 5MB
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
  }

  async validateImageUrl(url) {
    try {
      const response = await axios.head(url, { timeout: 10000 });
      
      const contentType = response.headers['content-type'];
      const contentLength = parseInt(response.headers['content-length'] || '0');
      
      // Check if it's an image
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }
      
      // Check file size
      if (contentLength > this.maxImageSize) {
        throw new Error(`Image too large: ${contentLength} bytes (max: ${this.maxImageSize})`);
      }
      
      return {
        contentType,
        contentLength,
        isValid: true,
      };
    } catch (error) {
      console.error('Image validation failed:', error.message);
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  async downloadImage(url) {
    try {
      console.log(`Downloading image: ${url}`);
      
      const validation = await this.validateImageUrl(url);
      if (!validation.isValid) {
        throw new Error(`Invalid image URL: ${validation.error}`);
      }

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: this.maxImageSize,
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading image:', error.message);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  async processImageForML(imageBuffer, targetWidth = 224, targetHeight = 224) {
    try {
      const processed = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 85,
          mozjpeg: true 
        })
        .toBuffer();

      return processed;
    } catch (error) {
      console.error('Error processing image:', error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  async getImageMetadata(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels,
      };
    } catch (error) {
      console.error('Error getting image metadata:', error.message);
      throw new Error(`Failed to get image metadata: ${error.message}`);
    }
  }

  async createImageThumbnail(imageBuffer, width = 150, height = 150) {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(width, height, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      console.error('Error creating thumbnail:', error.message);
      throw new Error(`Failed to create thumbnail: ${error.message}`);
    }
  }

  async processImageFromUrl(imageUrl) {
    try {
      // Download the image
      const imageBuffer = await this.downloadImage(imageUrl);
      
      // Get metadata
      const metadata = await this.getImageMetadata(imageBuffer);
      
      // Process for ML (resize to standard size)
      const processedBuffer = await this.processImageForML(imageBuffer);
      
      // Create thumbnail
      const thumbnailBuffer = await this.createImageThumbnail(imageBuffer);

      return {
        original: imageBuffer,
        processed: processedBuffer,
        thumbnail: thumbnailBuffer,
        metadata,
      };
    } catch (error) {
      console.error('Error in processImageFromUrl:', error.message);
      throw error;
    }
  }

  async saveImageToTempFile(imageBuffer, extension = 'jpg') {
    try {
      const tempPath = join(tmpdir(), `image_${Date.now()}.${extension}`);
      writeFileSync(tempPath, imageBuffer);
      
      return {
        path: tempPath,
        cleanup: () => {
          try {
            unlinkSync(tempPath);
          } catch (error) {
            console.warn('Failed to cleanup temp file:', tempPath);
          }
        }
      };
    } catch (error) {
      console.error('Error saving image to temp file:', error.message);
      throw error;
    }
  }

  isValidImageFormat(format) {
    return this.supportedFormats.includes(format.toLowerCase());
  }

  getImageDimensions(metadata) {
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      aspectRatio: metadata.width && metadata.height 
        ? metadata.width / metadata.height 
        : 1,
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new ImageProcessingService();