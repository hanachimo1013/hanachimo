# Stage 1: Build Stage
FROM node:20-alpine AS build
WORKDIR /app
# Copy package files first to leverage Docker layer caching
COPY package*.json ./
RUN npm install
# Copy the rest of the source code
COPY . .
RUN npm run build

# Stage 2: Runtime Stage
# We use Nginx to serve the static files generated in Stage 1
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
# Clear default nginx static files
RUN rm -rf ./*
# Copy ONLY the built files from the 'build' stage
COPY --from=build /app/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]