### Backend Dockerfile (Node.js Express API)
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Create .env file
RUN echo "PORT=3001\n\
    MONGO_URL=mongodb://mongodb:27017/todoapp\n\
    JWT_SECRET=4ab03d8be676e73d93476bb" > .env

# Expose the port the application runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"]