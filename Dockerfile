# ... (Stage 1 is the same)

# Stage 2: Production Runtime
FROM node:20-alpine
WORKDIR /app

# Copy the build results
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
# --- ADD THIS LINE BELOW ---
COPY --from=builder /app/api ./api 
# ---------------------------
COPY --from=builder /app/package*.json ./

RUN npm install --omit=dev

EXPOSE 3000
CMD ["node", "server/index.js"]