# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopify app built using the Remix framework and Shopify's official app template. It provides a foundation for building Shopify apps with modern React, TypeScript, and Node.js technologies.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Shopify CLI (hot reload, tunneling, authentication)
- `npm run build` - Build the app for production using Remix Vite
- `npm run start` - Start production server
- `npm run docker-start` - Start with Docker (runs setup then start)

### Shopify CLI Commands
- `npm run generate` - Generate new app extensions or components
- `npm run deploy` - Deploy app to Shopify Partners Dashboard
- `npm run config:link` - Link to existing Shopify app configuration
- `npm run config:use` - Switch between app configurations
- `npm run env` - Manage environment variables

### Development Tools
- `npm run lint` - Run ESLint with caching
- `npm run setup` - Generate Prisma client and run database migrations
- `npm run graphql-codegen` - Generate GraphQL types and queries

## Architecture Overview

### Tech Stack
- **Framework**: Remix (React-based meta-framework)
- **Runtime**: Node.js (ESM modules, v18.20+ or v20.10+ or v21.0+)
- **Database**: SQLite via Prisma (configurable for production databases)
- **UI**: Shopify Polaris design system
- **Build Tool**: Vite
- **Authentication**: Shopify App Bridge + OAuth

### Key Directories and Files

**Core Application:**
- `app/` - Remix application code
  - `shopify.server.js` - Shopify app configuration and authentication
  - `db.server.js` - Prisma database client
  - `routes/` - Remix file-based routing
    - `app.jsx` - Main app layout with Polaris AppProvider and NavMenu
    - `app._index.jsx` - Home page with sample product creation
    - `webhooks.*` - Webhook handling routes

**Configuration:**
- `shopify.app.toml` - Shopify app configuration (scopes, webhooks, URLs)
- `shopify.web.toml` - Web-specific Shopify configuration
- `vite.config.js` - Vite bundler configuration with Shopify-specific settings
- `prisma/schema.prisma` - Database schema (Session model for auth)

**Extensions:**
- `extensions/` - Shopify app extensions (currently empty)

### Authentication Flow
The app uses Shopify's embedded app authentication:
1. OAuth flow handled by `@shopify/shopify-app-remix`
2. Sessions stored in SQLite via Prisma
3. Admin API access configured with scopes in `shopify.app.toml`
4. Embedded app runs inside Shopify Admin iframe

### Database Architecture
- **SQLite** (development) - Single file database
- **Session Model** - Stores Shopify OAuth sessions, user info, and permissions
- **Migration Strategy** - Prisma migrations for schema changes

## Development Patterns

### Route Patterns
- `app/routes/app.*` - Protected admin routes (require authentication)
- `app/routes/webhooks.*` - Webhook endpoints (public, HMAC verified)
- `app/routes/auth.*` - Authentication flow routes

### API Integration
- Use `authenticate.admin(request)` in loaders/actions for Admin API access
- GraphQL Admin API preferred over REST
- Webhook verification handled automatically by `@shopify/shopify-app-remix`

### UI Components
- Polaris components from `@shopify/polaris`
- App Bridge components from `@shopify/app-bridge-react`
- Remix navigation using `Link` from `@remix-run/react`

### Environment Variables
Required environment variables:
- `SHOPIFY_API_KEY` - App API key from Partners Dashboard
- `SHOPIFY_API_SECRET` - App API secret
- `SCOPES` - Comma-separated OAuth scopes
- `SHOPIFY_APP_URL` - Public app URL (set by CLI in development)

## Common Tasks

### Adding New Routes
1. Create file in `app/routes/` following Remix conventions
2. Use `authenticate.admin(request)` in loader for protected routes
3. Import and use Polaris components for UI consistency

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev` to create and apply migration
3. Restart development server

### Adding App Extensions
1. Use `npm run generate` to scaffold new extensions
2. Extensions are automatically built and deployed with the app

### Webhook Handling
1. Add webhook subscriptions to `shopify.app.toml`
2. Create route file matching webhook topic (e.g., `webhooks.products.update.jsx`)
3. Export action function to handle webhook payload

## Production Deployment

### Database Migration
- SQLite works for single-instance deployments
- For production, consider PostgreSQL, MySQL, or other managed databases
- Update `prisma/schema.prisma` datasource provider accordingly

### Environment Setup
- Set `NODE_ENV=production`
- Configure production database URL
- Ensure all required environment variables are set
- Run `npm run setup` to initialize database

### Build Process
1. `npm run build` - Creates production build
2. `npm run start` - Starts production server
3. Alternative: Use Docker with provided Dockerfile

## Troubleshooting

### Common Issues
- **Database not found**: Run `npm run setup` to initialize Prisma
- **Authentication loops**: Run `npm run deploy` to update app scopes
- **Embedded app navigation**: Always use Remix `Link` or Polaris components, never `<a>` tags
- **HMAC validation fails**: Use app-specific webhooks defined in `shopify.app.toml`

### Development Server Issues
- Check `shopify.app.toml` configuration matches Partners Dashboard
- Verify environment variables are properly set
- Use `npm run config:link` to reconnect to Shopify app
- Clear browser cache and restart development server

## Key Integrations
- **Shopify Admin API**: GraphQL v2025-07 (configured in `shopify.server.js`)
- **Polaris Design System**: v12.0.0+ for consistent Shopify UI
- **App Bridge**: Embedded app communication with Shopify Admin
- **Prisma ORM**: Database operations with type safety