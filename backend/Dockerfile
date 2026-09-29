# Use Node.js 18 LTS Alpine for a lightweight, secure image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY --chown=node:node . .

# Expose backend API port
EXPOSE 5000

# Use non-root node user for security
USER node

# Health check to ensure Express API is healthy and reachable
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the Express server
CMD ["node", "src/app.js"]
