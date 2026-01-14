# -------------------------
# Build stage
# -------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application source
COPY . .

# Build the TypeScript application
RUN npm run build


# -------------------------
# Production stage
# -------------------------
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests again
COPY package*.json ./

# Install only production dependencies (Node 20+ recommended)
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy static assets if they exist (safe even if missing)
RUN mkdir -p dist/assets
COPY --from=builder /app/src/assets ./dist/assets

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Switch to non-root user
USER app

# Expose the application port
EXPOSE 5000

# Optional healthcheck (safe default)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]
