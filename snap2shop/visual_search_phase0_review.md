# Phase 0: Visual Search Shopify App (Review-Friendly Draft)

**Objective:** Deliver a secure and performant prototype that allows merchants to manually sync product images and metadata, index them, and enable image-based search on their storefront.

---

## 1. Scope of Phase 0
- **Merchant Admin UI**
  - Feature: **Manual Sync**
    - Merchant initiates sync via a button in the app dashboard.
    - Sync pulls product catalog data (images, titles, descriptions, tags, prices) through Shopify Admin API.
    - Data is securely transmitted and stored in backend services for indexing.
  - Admin dashboard provides:
    - Sync status (progress indicator, e.g., “50/200 products indexed”).
    - Retry or refresh option if sync fails.

- **Backend**
  - **Data Storage**
    - Images stored in a secure object storage bucket (encrypted at rest).
    - Product metadata stored in a database (Postgres/Mongo) with strict access control.
    - Mapping table: `product_id → image_id(s) → embeddings`.
  - **Index Pipeline**
    - Pre-trained vision model (CLIP-like) generates embeddings from product images.
    - Embeddings stored in a vector database (e.g., Pinecone, Weaviate, or FAISS).
    - Provides secure API for image similarity search.
  - **APIs**
    - `/sync-products`: Validates merchant permissions, pulls catalog, stores images/metadata.
    - `/search-image`: Accepts a customer-uploaded query image, processes embeddings, returns ranked product IDs.

- **Storefront Integration (Theme App Extension)**
  - Merchant installs extension, which injects a **“Search by Image”** widget into the storefront.
  - Customers upload an image → securely sent to backend `/search-image` endpoint.
  - Backend returns matching product IDs → Shopify storefront renders product results.

---

## 2. Security & Compliance
- **Data Privacy**
  - Only product images and metadata from the merchant’s own store are processed.
  - No customer personal data is stored.
  - All API requests are authenticated with Shopify’s OAuth flow.
- **Data Handling**
  - Images and embeddings are encrypted at rest and in transit (HTTPS/TLS).
  - Sync and retrieval requests are scoped to the authenticated merchant.
- **App Review Considerations**
  - No external data sharing with third parties outside of storage/indexing provider.
  - No PII (Personally Identifiable Information) is collected or stored.
  - Merchants can delete synced data on request.

---

## 3. Performance & Reliability
- **Manual Sync Only (Phase 0)**
  - No background polling or automatic sync to minimize load on Shopify APIs.
  - Sync is merchant-triggered to ensure control and transparency.
- **Scalability**
  - Vector DB and storage designed to handle hundreds to thousands of products per store in Phase 0.
  - Retrieval API optimized for <500ms latency for top-K search results.
- **Error Handling**
  - Clear error messages in admin dashboard (e.g., failed sync, invalid image format).
  - Retries supported via “Retry Sync” button.

---

## 4. Non-Goals for Phase 0
- No automated scheduled sync.  
- No analytics dashboards.  
- No training of custom ML models (only pre-trained inference).  
- No support for multi-modal queries (text + image).  

---

## 5. Architecture Overview

### High-Level Flow
1. **Merchant Sync**
   - Merchant triggers sync → Backend `/sync-products`.
   - Backend authenticates with Shopify Admin API.
   - Product images + metadata retrieved, stored securely.
   - Images processed → embeddings generated → indexed in vector DB.

2. **Customer Search**
   - Customer uploads image in storefront extension.
   - Image securely transmitted to `/search-image`.
   - Embedding generated, compared against index.
   - Top-K product IDs returned → Storefront renders results.

---

### Components
- **Merchant Admin UI (React + Shopify App Bridge)**  
  - Sync button.  
  - Progress/status display.  

- **Theme App Extension (Storefront)**  
  - “Upload Image” widget.  
  - Connects to backend API.  

- **Backend (Render / AWS / GCP)**  
  - REST API endpoints.  
  - Storage:  
    - Product metadata DB (encrypted).  
    - Image bucket (encrypted).  
    - Vector DB for embeddings.  

- **ML Inference Service**  
  - Pre-trained CLIP-like model.  
  - GPU-enabled if needed.  
  - API for image → embedding conversion.  

---

### Diagram (Textual)

```
[Merchant Admin UI] ----(Sync Request)---> [Backend API]
     |                                          |
     |                                    [Shopify Admin API]
     |                                          |
     |----<-- Status ---------------------------|
     
[Backend API] --(Store)--> [Image Storage (encrypted)]
[Backend API] --(Store)--> [Product DB (encrypted)]
[Backend API] --(Embed)--> [Vector DB]

[Customer Storefront Extension] --(Query Image)--> [Backend API]
                                              |
                                       [CLIP Inference Model]
                                              |
                                        [Vector DB Search]
                                              |
                                     <-- Product IDs/Results --
```

---

## 6. Requirements Checklist
- **Merchant Admin UI**
  - [ ] Sync button (manual).  
  - [ ] Status display with error handling.  

- **Backend**
  - [ ] Secure `/sync-products` API.  
  - [ ] Secure `/search-image` API.  
  - [ ] Encrypted storage for product images + metadata.  
  - [ ] Embedding pipeline + vector DB indexing.  

- **Theme Extension**
  - [ ] “Search by Image” widget.  
  - [ ] Map results to product pages.  

- **Infrastructure**
  - [ ] Render/AWS deployment for backend API.  
  - [ ] Encrypted object storage for images.  
  - [ ] Vector DB provisioned (Pinecone/Weaviate/FAISS).  
  - [ ] GPU-enabled inference service.  

---

## 7. Future Considerations (Beyond Phase 0)
- Automated background sync.  
- Analytics dashboard (search queries, CTR, conversions).  
- Support for multi-modal (image + text) search.  
- Scaling to 100k+ products.  
