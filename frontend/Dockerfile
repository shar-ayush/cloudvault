# Stage 1: Build React Production Bundle
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies required for Tailwind & PostCSS build)
RUN npm ci

# Copy application source code
COPY . .

# Build-time arguments for React environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_AWS_REGION
ARG REACT_APP_USER_POOL_ID
ARG REACT_APP_USER_POOL_CLIENT_ID

# Set environment variables for build step
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_AWS_REGION=$REACT_APP_AWS_REGION
ENV REACT_APP_USER_POOL_ID=$REACT_APP_USER_POOL_ID
ENV REACT_APP_USER_POOL_CLIENT_ID=$REACT_APP_USER_POOL_CLIENT_ID

# Compile production build
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
