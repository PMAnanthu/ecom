FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ARG CATALOG_SERVICE_URL=http://localhost:3004
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV CATALOG_SERVICE_URL=$CATALOG_SERVICE_URL
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npx", "next", "start"]
