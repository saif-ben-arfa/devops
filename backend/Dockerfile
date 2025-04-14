### Backend Dockerfile (Node.js Express API)
FROM node:14

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./²

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port the application runs on

EXPOSE 3001

# Start the application


CMD ["npm", "start"]