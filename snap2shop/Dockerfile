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

RUN npm ci --omit=dev && npm cache clean --force
RUN npm remove @shopify/cli

COPY . .

RUN npm run build

CMD ["npm", "run", "docker-start"]

