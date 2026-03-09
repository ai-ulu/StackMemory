# StackMemory MCP Server
FROM node:18-alpine

WORKDIR /app

# Install all dependencies first because TypeScript build needs dev packages.
COPY package*.json ./
RUN npm install

# Application
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev-only dependencies from the final runtime image.
RUN npm prune --omit=dev

CMD ["node", "dist/index.js"]
