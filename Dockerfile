# Development Dockerfile for Gallop Amida Derby
# Phaser 3 + TypeScript + Vite

FROM node:20-alpine

WORKDIR /app

# Install dependencies for better DX
RUN apk add --no-cache git

# Copy package files
COPY app/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY app/ .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
