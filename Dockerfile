FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=prod \
    PORT=8000 \
    LOG_LEVEL=debug \
    POSTGRES_USER=workwise \
    POSTGRES_PASSWORD=myworkwise \
    POSTGRES_DB=workwise \
    POSTGRES_HOST=postgres \
    POSTGRES_PORT=5432 \
    JWT_SECRET=jlfal@#$%&%*($&$&$FSDJF:SDJF:jlf) \
    FRONTEND_URL=http://localhost:3000

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build app
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Start app
CMD ["node", "dist/server.js"]