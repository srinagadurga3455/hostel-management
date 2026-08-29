# Combined single-image build for hostel-management
# Usage: docker build -t durga67/hostel-management:latest .  (from repo root)
# Run:   docker run -p 80:80 -p 8000:8000 --env-file server/.env durga67/hostel-management
#        or: docker run -p 80:80 -e DATABASE_URL=... -e JWT_SECRET=... durga67/hostel-management

# Stage 1: build frontend (VITE_API_URL="" => same-origin, nginx proxies /api to backend)
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: combined runtime
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends nginx supervisor gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./

# frontend dist -> nginx
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx.combined.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80 8000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
