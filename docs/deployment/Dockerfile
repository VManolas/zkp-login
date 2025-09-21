FROM node:18-alpine

# Install serve globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built frontend
COPY frontend/build ./build
COPY frontend/public/circuits ./build/circuits

# Copy configuration
COPY production-config.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
