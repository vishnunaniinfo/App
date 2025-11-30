# Use the official Node.js runtime as a parent image
FROM node:18-alpine AS base

# Install dependencies only when needed
RUN --mount=type=cache,target=/root/.npm \
    npm --cache=/root/.npm ci --only=production

# Production stage
FROM node:18-alpine AS production

# Create app directory
WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S xavira -u 1001

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm --cache=/root/.npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY --chown=xavira:nodejs . .

# Build the application
RUN npm run build

# Switch to non-root user
USER xavira

# Expose port
EXPOSE 3001

# Add health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Run the application
CMD ["npm", "start"]