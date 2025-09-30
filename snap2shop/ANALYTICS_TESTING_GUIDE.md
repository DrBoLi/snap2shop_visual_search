# Analytics Testing Guide

## 🎯 Overview

This guide will help you test the complete analytics flow from image search to dashboard display.

## 🔧 **Fixes Applied**

### 1. **Image Search API** (`/app/routes/api.search-image.jsx`)
- ✅ Added database import
- ✅ Added search event tracking
- ✅ Added searchId generation
- ✅ Added client IP detection
- ✅ Added error handling for analytics

### 2. **Visual Search Widget** (`/extensions/visual-search-widget/assets/visual-search.js`)
- ✅ Updated click tracking to use direct API calls
- ✅ Added searchId capture from API response
- ✅ Added error handling for click tracking

### 3. **Test Scripts**
- ✅ Created analytics flow test script
- ✅ Added comprehensive data verification

## 🧪 **Testing Steps**

### **Step 1: Verify Current Data**
```bash
# Navigate to project directory
cd /Users/boli/Desktop/VS\ project/snap2shop

# Test current analytics data
npm run analytics:test-flow
```

### **Step 2: Start Development Server**
```bash
# Start the development server
npm run dev
```

### **Step 3: Test Image Search**

1. **Open your Shopify dev store**
2. **Navigate to a page with the visual search widget**
3. **Upload an image and perform a search**
4. **Click on some search results**
5. **Check browser console for analytics logs**

### **Step 4: Verify Dashboard**

1. **Open the analytics dashboard**: `/app/dashboard`
2. **Check if metrics are updating**
3. **Try different timeframes**
4. **Verify the data matches your searches**

## 🔍 **What to Look For**

### **Browser Console Logs**
You should see these logs when testing:
```
✅ Analytics tracked: Search event created for shop your-shop.myshopify.com
✅ Search ID captured for click tracking: search_1234567890_abc123
✅ Click tracked successfully
```

### **Dashboard Metrics**
- **Image Search Volume**: Should increase with each search
- **Image Search Clicks**: Should increase with each click
- **Click-Through Rate**: Should show realistic percentage

### **Database Verification**
```bash
# Check database directly
npx prisma studio
```

Look for:
- `VisualSearchEvent` records with `eventType: 'image_search'`
- `SearchResultClick` records with `clickType: 'search_result'`

## 🐛 **Troubleshooting**

### **If Dashboard Shows Zeros**

1. **Check if searches are being tracked:**
```bash
npm run analytics:test-flow
```

2. **Check browser console for errors**

3. **Verify the visual search widget is working**

### **If Click Tracking Doesn't Work**

1. **Check browser console for click tracking errors**

2. **Verify searchId is being captured:**
   - Look for "Search ID captured for click tracking" in console

3. **Check if the analytics API endpoint is accessible**

### **If Search Tracking Doesn't Work**

1. **Check server logs for analytics errors**

2. **Verify database connection**

3. **Check if the search API is returning searchId**

## 📊 **Expected Results**

### **After Performing 5 Searches with 10 Clicks:**
- **Image Search Volume**: 5
- **Image Search Clicks**: 10
- **Click-Through Rate**: 200% (10 clicks / 5 searches)

### **Sample Console Output:**
```
✅ Analytics tracked: Search event created for shop test-shop.myshopify.com
✅ Search ID captured for click tracking: search_1695326400000_abc123
✅ Click tracked successfully
✅ Click tracked successfully
```

## 🚀 **Quick Test Commands**

```bash
# Test current analytics data
npm run analytics:test-flow

# Test simplified analytics
npm run analytics:test-simple

# Populate sample data for testing
npm run analytics:populate

# Check database in browser
npx prisma studio
```

## 📈 **Performance Verification**

### **Database Queries Should Be Fast**
- Search count query: < 100ms
- Click count query: < 100ms
- Dashboard load: < 2 seconds

### **Analytics Tracking Should Be Reliable**
- Search events: 100% tracked
- Click events: 100% tracked
- No data loss or duplicates

## ✅ **Success Criteria**

- [ ] Image searches are tracked in database
- [ ] Click events are tracked in database
- [ ] Dashboard shows real-time data
- [ ] Metrics update after each search/click
- [ ] No errors in browser console
- [ ] No errors in server logs

## 🎉 **Next Steps After Testing**

1. **Deploy to production** if testing is successful
2. **Monitor analytics data** for accuracy
3. **Set up alerts** for any tracking failures
4. **Optimize performance** if needed

---

## 🔧 **Technical Details**

### **Analytics Flow**
1. **User uploads image** → Visual search widget
2. **Search API called** → Creates `VisualSearchEvent` record
3. **Results displayed** → SearchId captured for click tracking
4. **User clicks result** → Creates `SearchResultClick` record
5. **Dashboard queries** → Displays real-time metrics

### **Database Schema**
- `VisualSearchEvent`: Tracks search events
- `SearchResultClick`: Tracks click events
- Both tables linked by `searchId`

### **API Endpoints**
- `/api/search-image`: Handles image search + analytics tracking
- `/apps/proxy/analytics/click`: Handles click tracking
- `/api/analytics-dashboard-simple`: Provides dashboard data

The analytics system is now fully integrated and ready for testing!


