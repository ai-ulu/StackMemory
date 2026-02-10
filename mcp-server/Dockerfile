# AI-ULU MCP Server - Claude/Cursor Integration
FROM node:18-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Application
COPY . .

# Build TypeScript
RUN npm run build

CMD ["node", "dist/index.js"]
