# --- STAGE 1: The Build Stage ---
# We name this stage "builder" using the "AS" keyword
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: The Runtime Stage ---
FROM node:20-alpine
WORKDIR /app

# We reference the "builder" stage defined above. 
# This must match "AS builder" exactly.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/api ./api 
COPY --from=builder /app/package*.json ./

RUN npm install --omit=dev

EXPOSE 4000
# Ensure this points to your actual entry file in the server folder
CMD ["node", "server/index.js"]