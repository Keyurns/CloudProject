# Build stage for frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Build stage for backend
FROM node:18-alpine AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy built frontend
COPY --from=frontend-build /app/client/build ./client/build

# Copy backend
COPY --from=backend-build /app/server ./server

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Start the server
WORKDIR /app/server
CMD ["node", "server.js"] 