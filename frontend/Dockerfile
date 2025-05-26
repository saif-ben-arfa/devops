### Frontend Dockerfile (React App)
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies with clean install and cache clearing
RUN npm cache clean --force && \
    npm ci

# Copy the rest of the application source code
COPY . .

# Build the React application
RUN npm run build

# Use Nginx to serve the built React app
FROM nginx:alpine

# Copy the build output to Nginx's html directory
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]