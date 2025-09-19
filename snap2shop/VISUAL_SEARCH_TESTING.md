# Visual Search Camera Integration - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the new camera-enabled visual search functionality integrated into search bars across Shopify themes.

## Implementation Summary

### New Components Created
1. **search-bar-integration.js** - Main integration script with modal functionality
2. **camera-capture.js** - Camera access and photo capture
3. **image-processor.js** - Client-side image optimization for CLIP compatibility
4. **error-handler.js** - Centralized error handling and fallbacks
5. **visual-search-modal.css** - Modal and camera UI styles
6. **search-bar-camera.liquid** - Shopify block configuration

### Key Features
- ✅ Dynamic search bar detection across multiple theme patterns
- ✅ Camera icon injection next to search inputs
- ✅ Modal interface with upload/camera tabs
- ✅ Real-time camera preview and capture
- ✅ Client-side image processing (resize to 224px, compression)
- ✅ Graceful error handling with automatic fallbacks
- ✅ Mobile-optimized interface
- ✅ Relative proxy URL configuration

## Phase 1 Testing - Search Bar Integration & Upload

### 1.1 Search Bar Detection Test

**Objective**: Verify camera icons appear in various theme search bars

**Test Procedure**:
1. Install the visual search block in theme editor
2. Navigate to storefront
3. Check for camera icons in:
   - Header search bar
   - Mobile search
   - Search modal (if theme has one)
   - Product search bars

**Expected Results**:
- Camera icon appears next to search inputs
- Icon has proper opacity (0.7 default, 1.0 on hover)
- No duplicate icons on same input
- Icons remain after page navigation/AJAX updates

**Test Themes**:
- Dawn (default Shopify theme)
- Debut
- Brooklyn
- Narrative
- Simple
- Custom themes (if available)

### 1.2 Modal Functionality Test

**Test Cases**:

| Test | Action | Expected Result |
|------|--------|-----------------|
| Open Modal | Click camera icon | Modal opens with upload tab active |
| Close Modal | Click close button | Modal closes, resets state |
| Close Modal | Click overlay | Modal closes |
| Close Modal | Press ESC key | Modal closes |
| Tab Switching | Click "Take Photo" tab | Switches to camera tab |
| Modal Focus | Open modal | Focus moves to modal content |

### 1.3 File Upload Test

**Test Cases**:

| Test | File Type | Size | Expected Result |
|------|-----------|------|-----------------|
| Valid JPG | image/jpeg | 2MB | Accepts, shows preview |
| Valid PNG | image/png | 1MB | Accepts, shows preview |
| Valid WebP | image/webp | 3MB | Accepts, shows preview |
| Invalid TXT | text/plain | 1KB | Rejects with error message |
| Too Large | image/jpeg | 15MB | Rejects with file size error |
| Drag & Drop | Valid image | Any | Accepts via drag drop |

### 1.4 Image Processing Test

**Test Procedure**:
1. Upload a large image (>5MB, >1080p resolution)
2. Monitor browser console for processing logs
3. Verify processed image is ~224px square
4. Check file size reduction

**Expected Results**:
- Image resized to 224x224px (CLIP standard)
- File size reduced significantly (target <500KB)
- Processing time <1 second for typical images
- Maintains aspect ratio with center crop

### 1.5 Search Integration Test

**Test Procedure**:
1. Upload a product image from the store
2. Click "Find Similar Products"
3. Verify search request to `/apps/proxy/api/search-image`
4. Check results display

**Expected Results**:
- Relative proxy URL used (no hardcoded domains)
- Shop domain correctly detected and sent
- Results display in grid format
- Loading states work properly
- Error handling for API failures

## Phase 2 Testing - Camera Functionality

### 2.1 Camera Permission Test

**Test Environments**:
- Desktop Chrome/Firefox/Safari
- Mobile Chrome (Android)
- Mobile Safari (iOS)

**Test Cases**:

| Test | Action | Expected Result |
|------|--------|-----------------|
| First Permission | Click "Start Camera" | Browser requests camera permission |
| Permission Granted | Allow camera access | Video stream appears |
| Permission Denied | Deny camera access | Error message, switches to upload tab |
| No Camera | Test on device without camera | Camera tab hidden or disabled |

### 2.2 Camera Capture Test

**Test Procedure**:
1. Grant camera permission
2. Start camera preview
3. Capture photo
4. Verify image quality
5. Search with captured image

**Expected Results**:
- Smooth video preview (no lag/flicker)
- High-quality photo capture
- Captured image displayed correctly
- Retake functionality works
- Search button enabled after capture

### 2.3 Mobile Camera Test

**Specific Mobile Tests**:
- Front/rear camera switching (if multiple cameras)
- Portrait/landscape orientation handling
- Touch controls work properly
- Native camera capture via file input (`capture="environment"`)

### 2.4 Camera Error Handling Test

**Error Scenarios**:

| Error Type | Trigger | Expected Behavior |
|------------|---------|-------------------|
| Permission Denied | Deny camera permission | Error message + auto-switch to upload |
| Camera Busy | Open in 2 tabs simultaneously | Error message + retry option |
| No Camera | Test on device without camera | Camera tab hidden |
| Camera Disconnected | Unplug USB camera during use | Graceful error handling |

## Phase 3 Testing - Error Handling & Edge Cases

### 3.1 Browser Compatibility Test

**Test Browsers**:
- Chrome 90+ ✅ (Full support)
- Firefox 85+ ✅ (Full support)
- Safari 14+ ✅ (Full support)
- Safari 13 ⚠️ (Limited camera support)
- Internet Explorer ❌ (No support, graceful degradation)

**Expected Behavior**:
- Unsupported browsers show upload-only interface
- No JavaScript errors in any browser
- Progressive enhancement works

### 3.2 Network Error Test

**Test Scenarios**:
1. **Offline Search**: Disconnect internet, attempt search
2. **Slow Connection**: Throttle to 3G, test responsiveness
3. **API Timeout**: Block `/apps/proxy/api/search-image`, verify error handling
4. **Interrupted Upload**: Cancel request during image upload

**Expected Results**:
- Clear error messages for network issues
- Retry functionality available
- No hanging loading states
- Graceful degradation

### 3.3 Performance Test

**Metrics to Monitor**:
- Initial load time: <2 seconds
- Modal open time: <300ms
- Camera start time: <2 seconds
- Image processing time: <1 second
- Search request time: <3 seconds total

**Tools**:
- Browser DevTools Performance tab
- Lighthouse audit
- WebPageTest (optional)

### 3.4 Memory Usage Test

**Test Procedure**:
1. Open modal, start camera
2. Capture multiple photos (10+)
3. Monitor memory usage in DevTools
4. Close modal, verify cleanup

**Expected Results**:
- Memory usage stays stable
- No memory leaks after modal closure
- Camera stream properly released

## Testing Checklist

### Pre-Launch Checklist

- [ ] **Search Bar Integration**
  - [ ] Icons appear in Dawn theme
  - [ ] Icons appear in at least 2 other themes
  - [ ] Modal opens/closes properly
  - [ ] No console errors

- [ ] **Upload Functionality**
  - [ ] File validation works
  - [ ] Image preview displays
  - [ ] Drag & drop works
  - [ ] File size limits enforced

- [ ] **Camera Functionality**
  - [ ] Permission requests work
  - [ ] Video preview smooth
  - [ ] Photo capture works
  - [ ] Error handling functional

- [ ] **Image Processing**
  - [ ] Images resized to 224px
  - [ ] File size reduced appropriately
  - [ ] Processing time acceptable
  - [ ] No quality degradation

- [ ] **Search Integration**
  - [ ] API calls use relative URLs
  - [ ] Shop domain detected correctly
  - [ ] Results display properly
  - [ ] Error handling works

- [ ] **Mobile Testing**
  - [ ] Responsive design works
  - [ ] Touch controls functional
  - [ ] Native camera works
  - [ ] Performance acceptable

- [ ] **Error Handling**
  - [ ] All error types tested
  - [ ] Fallbacks work correctly
  - [ ] User messages clear
  - [ ] No JavaScript errors

### Performance Targets

- [ ] Lighthouse Score >90
- [ ] First Contentful Paint <2s
- [ ] Camera start time <2s
- [ ] Image processing <1s
- [ ] Total search time <3s

## Troubleshooting Guide

### Common Issues

**Camera icon not appearing**:
- Check browser console for JavaScript errors
- Verify script loading order
- Test search bar selector patterns

**Camera not starting**:
- Ensure HTTPS connection
- Check browser camera permissions
- Verify camera not used by other apps

**Image processing failing**:
- Check file format support
- Verify canvas API availability
- Monitor browser memory usage

**Search not working**:
- Verify proxy URL configuration
- Check network connectivity
- Review API response format

### Debug Mode

Enable debug mode in block settings:
```javascript
window.visualSearchConfig.debug = true;
```

This provides:
- Detailed console logging
- Performance measurements
- Error stack traces
- Configuration verification

## Deployment Recommendations

### Staging Environment
1. Deploy to staging first
2. Run full test suite
3. Performance testing with real data
4. User acceptance testing

### Production Rollout
1. Feature flag for gradual rollout
2. Monitor error rates and performance
3. A/B testing camera vs upload-only
4. Analytics tracking for usage patterns

### Monitoring
- Error rate <2%
- Camera usage rate target >30% (mobile)
- Search completion rate >80%
- User satisfaction >4.5/5

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: ___________

Phase 1 Results:
[ ] Search bar detection: ___/5 themes
[ ] Modal functionality: ___/6 tests passed
[ ] File upload: ___/6 tests passed
[ ] Image processing: All metrics within target
[ ] Search integration: API working correctly

Phase 2 Results:
[ ] Camera permissions: ___/4 environments
[ ] Camera capture: All functions working
[ ] Mobile camera: ___/3 mobile tests passed
[ ] Error handling: ___/4 error types handled

Phase 3 Results:
[ ] Browser compatibility: ___/5 browsers tested
[ ] Network errors: ___/4 scenarios handled
[ ] Performance: All metrics within target
[ ] Memory usage: No leaks detected

Overall Status: PASS / FAIL / NEEDS WORK
Critical Issues: ___________
```