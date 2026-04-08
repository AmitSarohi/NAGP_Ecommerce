# =========================
# BUILD STAGE
# =========================
FROM node:18-alpine as build

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm install && npm cache clean --force

COPY . .

# 🔥 BUILD ARGS (INCLUDING GUID)
ARG REACT_APP_API_URL
ARG REACT_APP_PRODUCT_SERVICE_URL
ARG REACT_APP_SEARCH_SERVICE_URL
ARG REACT_APP_DEPLOYMENT_GUID

# 🔥 ENV (Injected into React build)
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_PRODUCT_SERVICE_URL=$REACT_APP_PRODUCT_SERVICE_URL
ENV REACT_APP_SEARCH_SERVICE_URL=$REACT_APP_SEARCH_SERVICE_URL
ENV REACT_APP_DEPLOYMENT_GUID=$REACT_APP_DEPLOYMENT_GUID

# Build React app
RUN npm run build


# =========================
# PRODUCTION STAGE
# =========================
FROM nginx:alpine

RUN apk add --no-cache dumb-init

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -S nginx || true && \
    adduser -S nginx -G nginx || true

# Fix permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /usr/share/nginx/html

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]