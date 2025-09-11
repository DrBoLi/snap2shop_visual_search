# Phase 0 Implementation Plan: Visual Search Shopify App

**Objective:** Deliver a secure and performant prototype that allows merchants to manually sync product images and metadata, index them, and enable image-based search on their storefront.  

---

## 1. Current State Analysis ✅
- **Framework**: Remix with TypeScript, Shopify App Bridge, Polaris UI  
- **Database**: SQLite with Prisma ORM (Session model exists)  
- **Authentication**: Shopify OAuth flow implemented  
- **Structure**: Standard Shopify app template with routes in `app/routes/`  

---

## 2. Database Schema Extension
Extend Prisma schema to support:
- **Product** model (id, shopify_product_id, title, description, tags, price, shop)  
- **ProductImage** model (id, product_id, image_url, image_path, shop)  
- **ProductEmbedding** model (id, image_id, embedding_vector, shop)  
- **SyncStatus** model (id, shop, status, progress, last_sync, error_message)  

---

## 3. Backend API Development
Create new routes:
- `app/routes/api.sync-products.jsx` — Handle manual product sync  
- `app/routes/api.search-image.jsx` — Process image search queries  
- `app/routes/api.sync-status.jsx` — Get sync progress/status  

---

## 4. Merchant Admin UI
Enhance `app/routes/app._index.jsx`:
- Sync button with loading states  
- Progress indicator (e.g., "150/200 products indexed")  
- Status display with error handling  
- Retry functionality for failed syncs  

---

## 5. Infrastructure Setup
- **Image Storage**: AWS S3 or similar for encrypted image storage  
- **Vector Database**: Pinecone, Weaviate, or FAISS for embeddings  
- **ML Service**: CLIP model API (Hugging Face, OpenAI, or self-hosted)  

---

## 6. Theme Extension
Create in `extensions/`:
- Visual search widget for storefronts  
- Image upload interface  
- Results display integration  

---

## 7. Security & Compliance
- HTTPS/TLS encryption for all communications  
- OAuth scopes validation  
- Data encryption at rest  
- Merchant-scoped data access  

---

## 8. Error Handling & Reliability
- Comprehensive error states  
- Retry mechanisms  
- Graceful degradation  
- Clear user feedback  

---

## 9. Key Technical Decisions
1. Database: Extend existing SQLite for development, prepare for PostgreSQL in production  
2. File Storage: External object storage for images (not in SQLite)  
3. ML Integration: External API service for CLIP embeddings  
4. Vector Search: Managed vector database service (Pinecone recommended)  

---

## 10. Dependencies to Add
- Image processing library (**Sharp**)  
- HTTP client for external APIs (**axios**)  
- Vector database SDK  
- AWS SDK or similar for object storage  
- File upload handling (multer equivalent for Remix)  

---

## 11. Testing Strategy

### Unit Testing
- **Prisma Models**: Validate schema constraints, relationships, and data validation  
- **Utility Functions**: Image processing, embedding generation, vector operations  
- **API Helpers**: Authentication, request validation, response formatting  
- **Component Logic**: React component state management and props handling  

### Integration Testing
- **API Endpoints**:  
  - `/sync-products` with mocked Shopify Admin API responses  
  - `/search-image` with mocked ML inference service  
  - `/sync-status` with various database states  
- **Database Operations**: Prisma queries with test database  
- **External Services**: Mocked responses from vector DB, image storage, ML APIs  

### End-to-End Testing
- **Complete Flow**: Merchant sync → embedding generation → customer search → results  
- **Error Scenarios**: Network failures, API timeouts, invalid data  
- **User Journeys**: Full merchant onboarding and customer search experience  

### Testing Dependencies
```json
"devDependencies": {
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "msw": "^2.0.0"
}
```

---

## 12. Data Deletion Flow

**Merchant Data Purging (App Review Requirement)**
- **API Endpoint**: `DELETE /api/sync-products`  
- **Functionality**:  
  - Delete all product records for authenticated merchant  
  - Remove associated images from object storage  
  - Clear embeddings from vector database  
  - Reset sync status  
- **UI Component**: "Delete All Data" button with confirmation modal  
- **Compliance**: Required for Shopify App Store approval  

---

## 13. Phase-by-Phase Rollout

### Phase A: Sync + Database Foundation 🏗️
**Scope**: Core data synchronization without ML components  
- Database schema implementation  
- Shopify Admin API integration  
- Basic sync functionality  
- Merchant admin UI (sync button, status)  
- Data deletion flow  

**Deliverables**:  
- Products and images stored securely  
- Manual sync with progress tracking  
- Error handling and retry mechanisms  

**Testing**: Unit + Integration tests for sync flow  

---

### Phase B: Embeddings + Vector Database 🧠
**Scope**: Add ML inference and vector storage  
- ML service integration (CLIP model)  
- Vector database setup (Pinecone/Weaviate)  
- Embedding generation pipeline  
- Basic search API (`/search-image`)  

**Deliverables**:  
- Image embeddings generated and stored  
- Vector similarity search functional  
- Search API returns ranked product IDs  

**Testing**: Integration tests with mocked ML services, E2E tests for embedding pipeline  

---

### Phase C: Theme Extension + Customer Search 🛍️
**Scope**: Customer-facing search functionality  
- Theme app extension development  
- Image upload widget  
- Search results integration  
- Storefront display  

**Deliverables**:  
- Complete customer search experience  
- Theme extension published  
- Full E2E functionality  

**Testing**: Complete E2E testing including customer journey  

---

## 14. Updated Implementation Structure

**Phase A Routes & Components**
```
app/routes/
├── api.sync-products.jsx        # POST, DELETE
├── api.sync-status.jsx          # GET
├── app.visual-search.jsx        # Admin UI
└── components/
    ├── SyncButton.jsx
    ├── SyncStatus.jsx
    └── DataDeletionModal.jsx
```

**Phase B Extensions**
```
app/routes/
├── api.search-image.jsx         # POST
└── services/
    ├── mlInference.server.js
    ├── vectorDb.server.js
    └── imageStorage.server.js
```

**Phase C Extensions**
```
extensions/
└── visual-search-widget/
    ├── blocks/
    ├── assets/
    └── locales/
```

---

## 15. Rollout Benefits
1. **Incremental Testing**: Each phase is independently testable  
2. **Risk Mitigation**: Core functionality validated before complex ML integration  
3. **Merchant Feedback**: Early validation of sync UX before customer-facing features  
4. **Resource Planning**: Staged infrastructure provisioning (vector DB only needed in Phase B)  
5. **App Review**: Phase A can be submitted for initial review while B/C are developed  

---

**Conclusion**:  
This plan addresses testing comprehensively, ensures App Store compliance with data deletion, and provides a clear staged rollout that reduces implementation risk while enabling continuous validation.  
