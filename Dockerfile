# Stage 1 — Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build-time env vars (override via BuildConfig env)
ARG VITE_APP_NAME="Imola Kit"
ARG VITE_AUTH_STRATEGY=AZURE_AD
ARG VITE_AZURE_CLIENT_ID=""
ARG VITE_AZURE_TENANT_ID=""
ARG VITE_AZURE_ORG_URL=""
ARG VITE_DOCUMENT_INTELLIGENCE_ENDPOINT=""
ARG VITE_DOCUMENT_INTELLIGENCE_KEY=""
ARG VITE_AZURE_OPENAI_ENDPOINT=""
ARG VITE_AZURE_OPENAI_KEY=""
ARG VITE_AZURE_OPENAI_DEPLOYMENT="gpt-4o"
ARG VITE_AZURE_OPENAI_API_VERSION="2024-12-01-preview"

ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_AUTH_STRATEGY=$VITE_AUTH_STRATEGY \
    VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID \
    VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID \
    VITE_AZURE_ORG_URL=$VITE_AZURE_ORG_URL \
    VITE_DOCUMENT_INTELLIGENCE_ENDPOINT=$VITE_DOCUMENT_INTELLIGENCE_ENDPOINT \
    VITE_DOCUMENT_INTELLIGENCE_KEY=$VITE_DOCUMENT_INTELLIGENCE_KEY \
    VITE_AZURE_OPENAI_ENDPOINT=$VITE_AZURE_OPENAI_ENDPOINT \
    VITE_AZURE_OPENAI_KEY=$VITE_AZURE_OPENAI_KEY \
    VITE_AZURE_OPENAI_DEPLOYMENT=$VITE_AZURE_OPENAI_DEPLOYMENT \
    VITE_AZURE_OPENAI_API_VERSION=$VITE_AZURE_OPENAI_API_VERSION

RUN npm run build

# Stage 2 — Serve with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# OKD runs containers as non-root random UID — fix permissions
RUN chmod -R 777 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chown -R nginx:0 /usr/share/nginx/html && \
    chmod -R g+rwX /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
