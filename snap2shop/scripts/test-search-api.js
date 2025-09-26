#!/usr/bin/env node

/**
 * Test Search API Script
 * Test the search API directly to see if analytics are being tracked
 */

import fs from 'fs';
import path from 'path';

async function testSearchAPI() {
  console.log('🧪 Testing search API directly...');
  
  try {
    // Create a test image file (1x1 pixel PNG)
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    const testImagePath = path.join(process.cwd(), 'test-image.png');
    fs.writeFileSync(testImagePath, testImageData);
    
    console.log('📸 Created test image:', testImagePath);
    
    // Test the API endpoint
    const formData = new FormData();
    const imageBlob = new Blob([testImageData], { type: 'image/png' });
    formData.append('image', imageBlob, 'test-image.png');
    formData.append('shop', 'snap2shopdemo.myshopify.com');
    formData.append('maxResults', '5');
    
    console.log('🚀 Making API request...');
    
    const response = await fetch('http://localhost:3000/api/search-image', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText.substring(0, 500) + '...');
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Search successful!');
      console.log('🔍 Search ID:', data.searchId);
      console.log('📊 Results count:', data.results?.length || 0);
      
      if (data.searchId) {
        console.log('✅ Analytics should be tracked with searchId:', data.searchId);
      }
    } else {
      console.error('❌ Search failed:', response.status, responseText);
    }
    
    // Clean up test image
    fs.unlinkSync(testImagePath);
    console.log('🧹 Cleaned up test image');
    
  } catch (error) {
    console.error('❌ Error testing search API:', error);
    throw error;
  }
}

async function main() {
  try {
    await testSearchAPI();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
