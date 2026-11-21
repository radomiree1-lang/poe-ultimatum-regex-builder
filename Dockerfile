FROM node:22-alpine AS builder
WORKDIR /app

# Copy root and package manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install && npm --prefix server install && npm --prefix client install

# Copy source and build
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies for server
RUN npm install --omit=dev --prefix server

# Copy built artifacts from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001
ENV PORT=3001

CMD ["node", "server/dist/index.js"]
