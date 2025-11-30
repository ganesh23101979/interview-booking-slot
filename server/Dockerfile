# Use official Node.js runtime
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend files
COPY . .

# Expose backend port
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]
