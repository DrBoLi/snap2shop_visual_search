FROM node:18-slim

# Install system dependencies needed for Sharp, ONNX Runtime, and image processing
RUN apt-get update && apt-get install -y \
    libc6 \
    libstdc++6 \
    python3 \
    make \
    g++ \
    libvips-dev \
 && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

# Install ALL dependencies first (needed for build)
RUN npm ci && npm cache clean --force

COPY . .

# Build the app
RUN npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

CMD ["npm", "run", "docker-start"]

