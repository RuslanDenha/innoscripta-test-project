# syntax=docker/dockerfile:1

# --- Build: install dependencies and compile the app into static files ---
# Debian-based (not Alpine) so the native binaries of TypeScript 7 and Vite's bundler just work.
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite writes VITE_* variables into the JavaScript bundle at build time,
# so the API keys are build arguments (see docker-compose.yml and README.md).
ARG VITE_NEWSAPI_KEY
ARG VITE_GUARDIAN_KEY
ARG VITE_NYT_KEY
RUN VITE_NEWSAPI_KEY="$VITE_NEWSAPI_KEY" \
    VITE_GUARDIAN_KEY="$VITE_GUARDIAN_KEY" \
    VITE_NYT_KEY="$VITE_NYT_KEY" \
    npm run build

# --- Serve: only the built files, behind nginx ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
